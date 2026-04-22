import { Markup } from "telegraf";
import { bot } from "../bot/bot.js";
import { pool } from "../config/db.js";
import { REFERRAL_VALUE, WITHDRAW_THRESHOLD } from "../config/env.js";
import logger from "../config/logger.js";
import { WEBAPP_URL } from "../config/env.js";

// Fetch withdrawal history for a user
export const getWithdrawHistory = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) return res.status(400).json({ error: "user_id is required" });

  try {
    const { rows } = await pool.query(
      `
      SELECT id, requested_referrals, requested_amount, status, created_at 
       FROM withdrawal_requests 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user_id],
    );

    return res.json({ withdrawals: rows });
  } catch (err) {
    logger.error(
      "❌ Error fetching withdrawal history for user: ",
      err.message || err,
    );
    return res.status(500).json({ error: "Server error" });
  }
};

export const sendWithdraw = async (req, res) => {
  const { user_id, name, bank_name, bank_account, phone } = req.body;

  if (!user_id || !name || !bank_name || !bank_account) {
    logger.error("❌ Missing fields in withdrawal request:", req.body);
    return res.status(400).json({ error: "Missing required fields" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const balanceQuery = `
            SELECT 
                u.telegram_id,
                u.claimed_referral_count,
                (SELECT COUNT(*)::int FROM users WHERE referred_by = u.telegram_id AND joined_telegram = true) as total_referrals,
                (SELECT COALESCE(SUM(requested_referrals), 0)::int FROM withdrawal_requests WHERE user_id = u.id AND status = 'pending') as pending_referrals
            FROM users u
            WHERE u.id = $1
            FOR UPDATE;
        `;

    const { rows } = await client.query(balanceQuery, [user_id]);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      logger.error("❌ User not found for withdrawal request:", user_id);
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];
    const availableReferrals =
      user.total_referrals -
      user.claimed_referral_count -
      user.pending_referrals;

    // Validate Balance
    if (availableReferrals < WITHDRAW_THRESHOLD) {
      await client.query("ROLLBACK");
      logger.error(
        "❌ referrals are under the minimum threshold to withdraw :",
        user_id,
      );
      return res
        .status(400)
        .json({ error: "referrals are under the minimum threshold" });
    }

    // Finds the admin with the minimum number of pending requests
    const adminAssignQuery = `
            SELECT a.username 
            FROM admins a
            LEFT JOIN withdrawal_requests wr ON a.username = wr.assigned_to AND wr.status = 'pending'
            GROUP BY a.username
            ORDER BY COUNT(wr.id) ASC
            LIMIT 1;
        `;

    const adminRes = await client.query(adminAssignQuery);
    if (adminRes.rowCount === 0) {
      await client.query("ROLLBACK");
      logger.error("❌ No admins found to set withdrawal request");
      return res
        .status(500)
        .json({ error: "System Error: No admins configured." });
    }
    const assignedTo = adminRes.rows[0].username;

    const requestedAmount = availableReferrals * REFERRAL_VALUE;

    const insertQuery = `
            INSERT INTO withdrawal_requests
                (user_id, name, requested_referrals, requested_amount, bank_name, bank_account, phone, status, assigned_to)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
            RETURNING *
        `;

    const result = await client.query(insertQuery, [
      user_id,
      name,
      availableReferrals,
      requestedAmount,
      bank_name,
      bank_account,
      phone,
      assignedTo,
    ]);

    await client.query("COMMIT");

    try {
      const adminLookup = await client.query(
        `SELECT telegram_id FROM users WHERE username = $1 LIMIT 1`,
        [assignedTo],
      );

      const adminTgId = adminLookup.rows[0]?.telegram_id;

      if (adminTgId) {
        logger.info('Admin telegram id found: ', adminTgId);
        const adminMsg =
          `💰 <b>New Withdrawal Assignment</b>\n\n` +
          `👤 <b>User:</b> ${name}\n` +
          `🔢 <b>Referrals:</b> ${availableReferrals}\n` +
          `💵 <b>Amount:</b> ${requestedAmount} ETB\n` +
          `🏦 <b>Bank:</b> ${bank_name}\n` +
          `🏦 <b>Bank Account:</b> ${bank_account}\n\n` +
          `👉 <b>Assigned to you (@${assignedTo})</b>`;

        // Send private message to the admin
        await bot.telegram.sendMessage(adminTgId, adminMsg, {
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([
            Markup.button.webApp("Process Request", `${WEBAPP_URL}/admin`)
          ])
        });
      } else {
        logger.warn(
          `Could not notify Admin @${assignedTo}: admin not found in users table.`,
        );
      }
    } catch (notifyErr) {
      logger.error("⚠️ Admin notification failed:", notifyErr.message || notifyErr);
    }

    logger.info(`✅ Withdrawal request submitted and assigned to ${assignedTo}`)
    return res.json({
      message: `✅ Withdrawal request submitted and assigned to ${assignedTo}`,
      request: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("❌ Error creating withdrawal: ", err.message || err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

export const getAdminWithdrawals = async (req, res) => {
  const adminUsername = req.query.username;

  try {
    const { rows } = await pool.query(
      `
            SELECT * FROM withdrawal_requests WHERE status = 'pending' AND assigned_to = $1
        `,
      [adminUsername],
    );
    return res.json({ withdrawals: rows });
  } catch (err) {
    logger.error(
      "❌ Error fetching withdrawal requests for admin: ",
      err.message || err,
    );
    res.status(500).json({ message: "Server error" });
  }
};

export const processWithdrawal = async (req, res) => {
  const { id, user_Id } = req.body;
  const client = await pool.connect(); // Use a client for transactions

  try {
    await client.query("BEGIN");

    // 1. Update withdrawal status
    const withdrawalQuery = await client.query(
      `UPDATE withdrawal_requests 
       SET status = 'paid', processed_at = NOW() 
       WHERE id = $1 
       RETURNING requested_referrals, requested_amount`,
      [id],
    );

    if (withdrawalQuery.rows.length === 0) {
      throw new Error("Withdrawal record not found");
    }

    const { requested_referrals, requested_amount } = withdrawalQuery.rows[0];

    // Update user's claimed referral count
    await client.query(
      `UPDATE users 
       SET claimed_referral_count = claimed_referral_count + $1 
       WHERE id = $2`,
      [requested_referrals, user_Id],
    );

    // Get user's telegram_id for notification
    const userQuery = await client.query(
      `SELECT telegram_id FROM users WHERE id = $1`,
      [user_Id],
    );
    const telegramId = userQuery.rows[0]?.telegram_id;

    await client.query("COMMIT");
    res.json({ message: "Withdrawal marked as paid" });

    // Send Telegram Notification (Post-Response)
    if (telegramId) {
      const message = `✅ *Withdrawal Successful!*\n\nYour request for *${Number(requested_amount).toFixed(2)} BIRR* has been processed. Please check your bank account.`;

      try {
        await bot.telegram.sendMessage(telegramId, message, { parse_mode: "Markdown" })
      } catch (error) {
        logger.error(
          "❌ Error to notify user after processing withdraw request: ",
          error.message || error,
        )
      }
    }
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("❌ Error to process withdraw request: ", error.message || error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
