import cron from "node-cron";
import { pool } from "../config/db.js";
import { bot } from "../bot/bot.js";
import { CHANNEL_ID } from '../config/env.js';

const wait = (ms) => new Promise(res => setTimeout(res, ms));

let lastMaxId = 0;
const BATCH_SIZE = 200;

async function isUserInChannel(userTelegramId) {
    try {
        const res = await bot.telegram.getChatMember(CHANNEL_ID, userTelegramId);
        const validStatuses = ["creator", "administrator", "member"];
        return validStatuses.includes(res.status);
    } catch (err) {
        if (err.description?.includes("user not found")) return false;
        return false;
    }
}

export function startReferralCheckCron() {

    cron.schedule("*/2 * * * *", async () => {
        console.log("🔍 Running referral batch...");

        try {
            const { rows: referrers } = await pool.query(
                `
                SELECT id, telegram_id, referral_count
                FROM users
                WHERE referral_count > 0 AND id > $1
                ORDER BY id
                LIMIT $2
                `,
                [lastMaxId, BATCH_SIZE]
            );

            if (referrers.length === 0) {
                console.log("🔁 All users processed, restarting cycle...");
                lastMaxId = 0;
                return;
            }

            for (const referrer of referrers) {

                // Update pointer
                if (referrer.id > lastMaxId) {
                    lastMaxId = referrer.id;
                }

                const { rows: referrals } = await pool.query(
                    `
                    SELECT telegram_id
                    FROM users
                    WHERE joined_telegram = true AND referred_by = $1
                    `,
                    [referrer.telegram_id]
                );

                if (referrals.length === 0) continue;

                let left = [];

                for (const r of referrals) {
                    const stillIn = await isUserInChannel(r.telegram_id);
                    if (!stillIn) left.push(r.telegram_id);

                    await wait(1200);
                }

                if (left.length === 0) continue;

                const client = await pool.connect();

                try {
                    await client.query("BEGIN");

                    for (const tgId of left) {
                        await client.query(
                            `UPDATE users SET joined_telegram = false WHERE telegram_id = $1`,
                            [tgId]
                        );
                    };

                    const newCount = Math.max(0, referrer.referral_count - left.length);

                    await client.query(
                        `UPDATE users SET referral_count = $1 WHERE id = $2`,
                        [newCount, referrer.id]
                    );

                    await client.query(
                        `DELETE FROM withdrawal_requests WHERE user_id = $1 AND status = 'pending'`,
                        [referrer.id]
                    );

                    await client.query("COMMIT");
                } catch (err) {
                    console.error("❌ Transaction error:", err);
                    await client.query("ROLLBACK");
                } finally {
                    client.release();
                };
            };

            console.log("✅ Batch complete.");
        } catch (err) {
            console.error("❌ Error during batch:", err);
        };
    });
};