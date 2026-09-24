import { pool } from "../config/db.js";
import type { PoolClient } from "pg";
import type { User } from "../types/index.js";
import logger from "../config/logger.js";
import { notifyAdminError } from "../utils/notifyAdminError.js";


export async function handleChannelMembershipChange(
    telegramId: number,
    isJoined: boolean
) {
    let client: PoolClient | undefined;

    try {
        client = await pool.connect();
        await client.query("BEGIN");

        // Fetch user details with ROW LOCK
        const userRes = await client.query(
            `SELECT telegram_id, referred_by, joined_channel, reward_status
            FROM users
            WHERE telegram_id = $1 
            FOR UPDATE`,
            [telegramId]
        );

        if (userRes.rowCount === 0) {
            // User hasn't interacted with bot yet; ignore event
            await client.query("COMMIT");
            return;
        }

        const user: User = userRes.rows[0];
        const referrerId = user.referred_by;

        if (isJoined) {
            // CASE 1: USER JOINED / RE-JOINED
            if (referrerId && user.reward_status !== "awarded") {
                // Award reward to referrer
                await client.query(
                    `UPDATE users 
                    SET joined_channel = TRUE, reward_status = 'awarded', updated_at = NOW() 
                    WHERE telegram_id = $1`,
                    [telegramId]
                );

                await client.query(
                    `UPDATE users 
                    SET referral_count = referral_count + 1, updated_at = NOW() 
                    WHERE telegram_id = $1`,
                    [referrerId]
                );
            } else {
                // User joined without a referrer or already awarded
                await client.query(
                    `UPDATE users 
                    SET joined_channel = TRUE, updated_at = NOW() 
                    WHERE telegram_id = $1`,
                    [telegramId]
                );
            }
        } else {
            // CASE 2: USER LEFT / KICKED
            if (referrerId && user.reward_status === "awarded") {
                // Revoke reward from referrer
                await client.query(
                    `UPDATE users 
                    SET joined_channel = FALSE, reward_status = 'revoked', updated_at = NOW() 
                    WHERE telegram_id = $1`,
                    [telegramId]
                );

                await client.query(
                    `UPDATE users 
                    SET referral_count = GREATEST(0, referral_count - 1), updated_at = NOW() 
                    WHERE telegram_id = $1`,
                    [referrerId]
                );
            } else {
                // User joined without a referrer or left without active awarded state
                await client.query(
                    `UPDATE users 
                    SET joined_channel = FALSE, updated_at = NOW() 
                    WHERE telegram_id = $1`,
                    [telegramId]
                );
            }
        }

        await client.query("COMMIT");
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (client) await client.query("ROLLBACK").catch(() => undefined);
        logger.error(`Error syncing channel member status for ${telegramId}: ${errorMessage}`);
        notifyAdminError(errorMessage, "Channel Membership Change handler")
    } finally {
        client?.release();
    }
}