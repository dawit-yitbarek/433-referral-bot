import cron from "node-cron";
import pLimit from "p-limit";
import { pool } from "../config/db.js";
import { bot } from "../bot/bot.js";
import { CHANNEL_ID } from "../config/env.js";
import logger from "../config/logger.js";

const limit = pLimit(25);

let isRunning = false;
const BATCH_SIZE = 200;

async function isUserInChannel(userTelegramId) {
  try {
    const res = await bot.telegram.getChatMember(CHANNEL_ID, userTelegramId);
    const validStatuses = ["creator", "administrator", "member"];
    return validStatuses.includes(res.status);
  } catch (err) {
    return false;
  }
}

export function startReferralCheckCron() {
  // Runs once a day at 3:00 AM
  cron.schedule(
    "0 3 * * *",
    async () => {
      if (isRunning) return;
      isRunning = true;

      logger.info("🌞 Starting optimized daily referral sweep...");
      const client = await pool.connect();

      try {
        let hasMore = true;
        let lastMaxId = 0;

        while (hasMore) {
          const { rows: referrers } = await client.query(`
            SELECT 
              u.id, 
              u.telegram_id, 
              u.claimed_referral_count,

              (SELECT COUNT(*)::int FROM users WHERE referred_by = u.telegram_id AND joined_telegram = true) as live_count,
              
              (SELECT COALESCE(SUM(requested_referrals), 0)::int FROM withdrawal_requests WHERE user_id = u.id AND status = 'pending') as pending_sum
            FROM users u
            WHERE u.id > $1 
            AND (
              EXISTS (SELECT 1 FROM users WHERE referred_by = u.telegram_id)
            )
            ORDER BY u.id ASC
            LIMIT $2`,
            [lastMaxId, BATCH_SIZE]
          );

          if (referrers.length === 0) {
            hasMore = false;
            break;
          }

          for (const referrer of referrers) {
            lastMaxId = referrer.id;

            const { rows: referrals } = await client.query(
              `SELECT id, telegram_id FROM users WHERE referred_by = $1`,
              [referrer.telegram_id],
            );

            if (referrals.length === 0) continue;

            // Parallel update with concurrency limiting
            const updatePromises = referrals.map((r) =>
              limit(async () => {
                try {
                  const stillIn = await isUserInChannel(r.telegram_id);
                  await client.query(
                    `UPDATE users SET joined_telegram = $1 WHERE id = $2`,
                    [stillIn, r.id],
                  );
                } catch (err) {
                  logger.error(`Failed to update user in cron job ${r.telegram_id}:`, err.message || err);
                  // Continue with other updates even if one fails
                }
              }),
            );

            await Promise.allSettled(updatePromises);

            //check the balance
            const { rows: balRes } = await client.query(
              `SELECT COUNT(*)::int as count FROM users WHERE referred_by = $1 AND joined_telegram = true`,
              [referrer.telegram_id]
            );

            const currentLiveCount = balRes[0]?.count || 0;

            // If the user's live referrals have dropped below what they have already asked to withdraw cancel all pending requests
            if (currentLiveCount < (referrer.claimed_referral_count + referrer.pending_sum)) {
              await client.query("BEGIN");
              try {
                const cancelQuery = 
                `
                    UPDATE withdrawal_requests 
                    SET status = 'cancelled', 
                        processed_at = NOW()
                    WHERE user_id = $1 AND status = 'pending'
                    RETURNING id;`;

                const { rows: cancelledItems } = await client.query(cancelQuery, [referrer.id]);
                await client.query("COMMIT");

                if (cancelledItems.length > 0) {
                  const alertMsg = `🚨 *Withdrawal Protection Alert*\n\nYour pending withdrawal requests were cancelled because your live referral count (${currentLiveCount}) dropped below your total claimed amount. Please ensure your referrals stay in the channel!`;
                  await bot.telegram.sendMessage(referrer.telegram_id, alertMsg, {
                    parse_mode: "Markdown",
                  }).catch((err) => {
                    logger.error(`Failed to send notify to user ${referrer.id} about withdraw cancelation :`, err.message || err);
                  });
                }
              } catch (dbErr) {
                await client.query("ROLLBACK");
                logger.error(
                  `Failed to protect withdrawal for user ${referrer.id}:`,
                  dbErr.message || dbErr,
                );
              }
            }
          }
          logger.info(`Processed up to ID: ${lastMaxId}`);
        }
      } catch (err) {
        logger.error("❌ Daily sweep error:", err.message || err);
      } finally {
        client.release();
        isRunning = false;
        logger.info("✅ Daily sweep complete.");
      }
    },
    {
      scheduled: true,
      timezone: "Africa/Addis_Ababa",
    },
  );
}
