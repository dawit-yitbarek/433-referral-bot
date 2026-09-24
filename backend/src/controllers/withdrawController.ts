import type { RequestHandler } from "express";
import { pool } from "../config/db.js";
import type { PoolClient } from "pg";
import { REFERRAL_VALUE, WITHDRAW_THRESHOLD } from "../config/env.js";
import logger from "../config/logger.js";
import type { WithdrawalHistoryResponse, SendWithdrawalRequest, WithdrawalRequest, User } from "../types/index.js";
import { ADMIN } from "../config/env.js";
import { sendAdminPayoutMessage, sendUserApprovedPayoutMessage, sendAdminConfirmedPayoutMessage, sendUserRejectedPayoutMessage, sendAdminRejectedPayoutMessage } from "../utils/sendPayoutMessage.js";
import { notifyAdminError } from "../utils/notifyAdminError.js";

// Fetch withdrawal history for a user
export const getWithdrawHistory: RequestHandler = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) return res.status(400).json({ error: "user_id is required" });

  try {
    const { rows } = await pool.query(
      `
      SELECT id, referrals_claimed, requested_amount, status, created_at 
       FROM payout_requests 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user_id],
    );

    res.json({ withdrawals: rows } as WithdrawalHistoryResponse);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error(`❌ Error fetching withdrawal history for user:  ${errorMessage}`);
    notifyAdminError(errorMessage, "withdrawal history fetcher")
    res.status(500).json({ error: "Server error" });
  }
  return;
};


export const sendWithdraw: RequestHandler = async (req, res) => {
  const {
    user_id,
    bank_name,
    bank_account,
    account_holder_name,
  }: SendWithdrawalRequest = req.body;
  const admin_telegram_id = Number(ADMIN.trim())

  // 1. Basic validation
  if (!user_id || !admin_telegram_id || !bank_name || !bank_account || !account_holder_name) {
    return res.status(400).json({ error: "Missing required payout details" });
  }

  let client: PoolClient | undefined;

  try {
    // Start atomic transaction
    client = await pool.connect();
    await client.query("BEGIN");

    // 2. Lock user row and fetch referral counters
    const userQuery = `
      SELECT 
        id, 
        telegram_id, 
        first_name,
        username,
        referral_count, 
        claimed_referral_count
      FROM users
      WHERE id = $1
      FOR UPDATE;
    `;

    const { rows: userRows } = await client.query(userQuery, [user_id]);

    if (userRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const user: User = userRows[0];

    // 3. Calculate claimable referrals
    const claimableReferrals = user.referral_count - user.claimed_referral_count;

    // 4. Check minimum threshold requirement
    const minThreshold = Number(WITHDRAW_THRESHOLD);
    if (claimableReferrals < minThreshold) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `Insufficient claimable referrals. Minimum required is ${minThreshold}, but you have ${claimableReferrals}.`,
      });
    }

    // 5. Compute request values
    const pointRate = Number(REFERRAL_VALUE);
    const requestedAmount = claimableReferrals * pointRate;

    // 6. Insert record into payout_requests
    const insertPayoutQuery = `
      INSERT INTO payout_requests (
        user_id,
        admin_telegram_id,
        referrals_claimed,
        point_rate,
        requested_amount,
        bank_name,
        bank_account,
        account_holder_name,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *;
    `;

    const { rows: payoutRows } = await client.query(insertPayoutQuery, [
      user.id,
      admin_telegram_id,
      claimableReferrals,
      pointRate,
      requestedAmount,
      bank_name,
      bank_account,
      account_holder_name,
    ]);

    const newPayout: WithdrawalRequest = payoutRows[0];

    // 7. Update claimed_referral_count on the user table atomically
    const updateUserQuery = `
      UPDATE users
      SET 
        claimed_referral_count = claimed_referral_count + $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2;
    `;

    await client.query(updateUserQuery, [claimableReferrals, user.id]);

    // Commit atomic transaction
    await client.query("COMMIT");

    await sendAdminPayoutMessage({
      admin_telegram_id: admin_telegram_id,
      payoutId: newPayout.id,
      username: user.username,
      name: user.first_name,
      requestedAmount,
      claimableReferrals,
      pointRate,
      bank_name,
      bank_account,
      account_holder_name
    })

    return res.status(201).json({
      message: "✅ Payout request submitted successfully",
      payout_request: payoutRows[0],
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    logger.error(`❌ Error creating payout request: ${errorMessage}`);
    notifyAdminError(errorMessage, "payout request sender")
    return res.status(500).json({ error: "Failed to process payout request" });
  } finally {
    client?.release();
  }
};


export const getAdminWithdrawals: RequestHandler = async (req, res) => {
  const adminTelegramId = Number(req.query.telegram_id);

  try {
    const { rows } = await pool.query(
      `
            SELECT * FROM payout_requests WHERE status = 'pending' AND admin_telegram_id = $1
        `,
      [adminTelegramId],
    );
    res.json({ withdrawals: rows });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error(`❌ Error fetching withdrawal requests for admin: ${errorMessage}`);
    notifyAdminError(errorMessage, "admin withdrawals fetcher")
    res.status(500).json({ message: "Server error" });
  }
  return;
};


export const processWithdrawal: RequestHandler = async (req, res) => {
  const { payout_id, action, rejection_reason } = req.body;

  if (!payout_id || !action || !["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "Invalid or missing required parameters" });
  }

  let client: PoolClient | undefined;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Lock and fetch the pending payout request along with user details
    const payoutQuery = `
      SELECT 
        pr.id,
        pr.user_id,
        pr.admin_telegram_id,
        pr.referrals_claimed,
        pr.requested_amount,
        pr.status,
        u.telegram_id AS user_telegram_id,
        u.first_name AS user_first_name,
        u.username
      FROM payout_requests pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.id = $1
      FOR UPDATE OF pr;
    `;

    const { rows } = await client.query(payoutQuery, [payout_id]);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Payout request not found" });
    }

    const payout = rows[0];

    // Ensure request is still pending
    if (payout.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Request has already been processed (Status: ${payout.status})` });
    }

    const nextStatus = action === "approve" ? "paid" : "rejected";

    // 2. Update payout request status
    const updatePayoutQuery = `
      UPDATE payout_requests
      SET 
        status = $1::payment_request_status_type,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;

    await client.query(updatePayoutQuery, [nextStatus, payout_id]);

    // 3. If rejected, revert the claimed_referral_count back to user's balance
    if (action === "reject") {
      const revertUserQuery = `
        UPDATE users
        SET 
          claimed_referral_count = GREATEST(0, claimed_referral_count - $1),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2;
      `;
      await client.query(revertUserQuery, [payout.referrals_claimed, payout.user_id]);
    }

    await client.query("COMMIT");

    // 4. Send Telegram Notifications (Post-Commit)
    const amountFormatted = Number(payout.requested_amount).toFixed(2);

    // User/admin Notice
    if (action === "approve") {
      await sendUserApprovedPayoutMessage({
        user_telegram_id: payout.user_telegram_id,
        amountFormatted,
        referrals_claimed: payout.referrals_claimed
      })

      await sendAdminConfirmedPayoutMessage({
        admin_telegram_id: payout.admin_telegram_id,
        payoutId: payout.id,
        username: payout.username,
        name: payout.user_first_name
      })
    } else {
      await sendUserRejectedPayoutMessage({
        user_telegram_id: payout.user_telegram_id,
        amountFormatted,
        referrals_claimed: payout.referrals_claimed,
        rejection_reason
      })

      await sendAdminRejectedPayoutMessage({
        admin_telegram_id: payout.admin_telegram_id,
        payoutId: payout.id,
        referrals_claimed: payout.referrals_claimed,
        username: payout.username,
        name: payout.user_first_name
      })
    }

    return res.status(200).json({
      message: `Payout request successfully ${action === "approve" ? "approved" : "rejected"}`,
      status: nextStatus,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    logger.error(`❌ Error processing payout request: ${errorMessage}`);
    notifyAdminError(errorMessage, "withdrawal request processer")
    return res.status(500).json({ error: "Failed to process payout request" });
  } finally {
    client?.release();
  }
};
