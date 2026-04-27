import { Markup } from "telegraf";
import logger from "../config/logger.js";
import { pool } from "../config/db.js";
import { bot } from "../bot/bot.js";
import { WEBAPP_URL } from "../config/env.js";
import pLimit from "p-limit";

const limit = pLimit(25);

// Helper to prevent hitting Telegram Flood Limits
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function broadcastUpdate() {
    try {
        const { rows: users } = await pool.query("SELECT telegram_id FROM users");
        let successCount = 0;

        logger.info(`🚀 Starting broadcast to ${users.length} users...`);

        const updatePromises = users.map((user, index) =>
            limit(async () => {
                try {
                    // Small staggered delay every 50 users
                    if (index % 50 === 0) await sleep(1000);

                    await bot.telegram.sendMessage(
                        user.telegram_id,
                        "🚀 *We've Upgraded!*\n\nOur app is now faster and more stable. Please use the button below or send /start to access the latest version and check your rewards.",
                        {
                            parse_mode: 'Markdown',
                            ...Markup.inlineKeyboard([
                                [Markup.button.webApp("🌐 Open New Mini App", WEBAPP_URL)],
                                [Markup.button.callback("🎁 Get Referral Link", "show_referral")]
                            ])
                        }
                    );
                    successCount++;
                } catch (err) {
                    const errMsg = err instanceof Error ? err.message : String(err);
                    if (errMsg.includes("blocked")) {
                        logger.warn(`User ${user.telegram_id} has blocked the bot.`);
                    } else {
                        logger.error(`Could not message ${user.telegram_id}: ${errMsg}`);
                    }
                }
            }),
        );

        await Promise.allSettled(updatePromises);
        logger.info(`✅ Broadcast complete. Successfully sent to ${successCount} users.`);

    } catch (error) {
        logger.error(`❌ Error on broadcasting: ${error instanceof Error ? error.message : String(error)}`);
    }
}

broadcastUpdate().then(async () => {
    logger.info("Closing database connection...");
    await pool.end();
    process.exit(0);
}).catch(async (err) => {
    logger.error(`Broadcast failed: ${err}`);
    await pool.end();
    process.exit(1);
});