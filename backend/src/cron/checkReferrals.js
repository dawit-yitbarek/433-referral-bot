import cron from "node-cron";
import { pool } from "../config/db.js";
import { bot } from "../bot/bot.js";
import { CHANNEL_ID } from "../config/env.js";

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

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
  cron.schedule("0 3 * * *", async () => {
    if (isRunning) return;
    isRunning = true;

    console.log("🌞 Starting daily referral sweep...");
    const client = await pool.connect();

    try {
      let hasMore = true;
      let lastMaxId = 0;

      while (hasMore) {
        const { rows: referrers } = await client.query(
          `SELECT id, telegram_id, referral_count FROM users
           WHERE referral_count > 0 AND id > $1
           ORDER BY id LIMIT $2`,
          [lastMaxId, BATCH_SIZE],
        );

        if (referrers.length === 0) {
          hasMore = false;
          break;
        }

        for (const referrer of referrers) {
          lastMaxId = referrer.id;

          const { rows: referrals } = await client.query(
            `SELECT telegram_id FROM users WHERE joined_telegram = true AND referred_by = $1`,
            [referrer.telegram_id],
          );

          if (referrals.length === 0) continue;

          let leftIds = [];
          for (const r of referrals) {
            const stillIn = await isUserInChannel(r.telegram_id);
            if (!stillIn) leftIds.push(r.telegram_id);
            // 1 second wait ensures we NEVER hit Telegram's 30 msg/sec limit
            await wait(1000);
          }

          if (leftIds.length > 0) {
            await client.query("BEGIN");
            try {
              await client.query(
                `UPDATE users SET joined_telegram = false WHERE telegram_id = ANY($1)`,
                [leftIds],
              );

              const newCount = Math.max(
                0,
                referrer.referral_count - leftIds.length,
              );
              await client.query(
                `UPDATE users SET referral_count = $1 WHERE id = $2`,
                [newCount, referrer.id],
              );

              await client.query(
                `DELETE FROM withdrawal_requests WHERE user_id = $1 AND status = 'pending'`,
                [referrer.id],
              );
              await client.query("COMMIT");
            } catch (e) {
              await client.query("ROLLBACK");
              console.error(`Error updating referrer ${referrer.id}:`, e);
            }
          }
        }
        console.log(`Processed up to ID: ${lastMaxId}`);
      }
    } catch (err) {
      console.error("❌ Daily sweep error:", err);
    } finally {
      client.release();
      isRunning = false;
      console.log("✅ Daily sweep complete.");
    }
  });
}
