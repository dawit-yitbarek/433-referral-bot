import cron from "node-cron";
import { pool } from "../config/db.js";
import { bot } from "../bot/bot.js";
import { channelId } from '../config/env.js'

async function isUserInChannel(userTelegramId) {
    try {
        const res = await bot.telegram.getChatMember(channelId, userTelegramId);

        const validStatuses = ["creator", "administrator", "member"];
        return validStatuses.includes(res.status);

    } catch (err) {
        if (err.description?.includes("user not found")) {
            return false;
        };
        console.error("Error checking membership:", err);
        return false;
    };
};

export function startReferralCheckCron() {
    cron.schedule("*/2 * * * *", async () => {
        console.log("🔍 Running referral integrity check...");

        try {
            const { rows: referrers } = await pool.query(`
                SELECT id, telegram_id, referral_count
                FROM users
                WHERE referral_count > 0
            `);

            for (const referrer of referrers) {

                const { rows: referrals } = await pool.query(`
                    SELECT id, telegram_id
                    FROM users
                    WHERE joined_telegram = true AND referred_by = $1
                `, [referrer.telegram_id]);

                let left = [];

                for (const referral of referrals) {
                    const stillIn = await isUserInChannel(referral.telegram_id);
                    if (!stillIn) left.push(referral.telegram_id);
                };

                if (left.length === 0) {
                    continue;
                };

                const client = await pool.connect();
                try {
                    await client.query("BEGIN");

                    for (const tgId of left) {
                        await client.query(`
                            UPDATE users
                            SET joined_telegram = false
                            WHERE telegram_id = $1
                        `, [tgId]);
                    };

                    const newCount = Math.max(0, referrer.referral_count - left.length);

                    await client.query(`
                        UPDATE users
                        SET referral_count = $1
                        WHERE id = $2
                    `, [newCount, referrer.id]);

                    await client.query(`
                        DELETE FROM withdrawal_requests
                        WHERE user_id = $1 AND status = 'pending'
                    `, [referrer.id]);

                    await client.query("COMMIT");
                } catch (err) {
                    console.error("❌ Transaction failed:", err);
                    await client.query("ROLLBACK");
                } finally {
                    client.release();
                };
            };

            console.log("✅ Referral membership check complete.");
        } catch (err) {
            console.error("❌ Referral check error:", err);
        };
    });
};