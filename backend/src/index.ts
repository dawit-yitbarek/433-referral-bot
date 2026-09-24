import app from "./server.js";
import { bot } from "./bot/bot.js";
import { PORT, BACKEND_URL, NODE_ENV } from "./config/env.js";
import logger from "./config/logger.js";
import { notifyAdminError } from "./utils/notifyAdminError.js";

process.on("unhandledRejection", (reason: unknown) => {
    const errorMessage = reason instanceof Error ? reason.stack || reason.message : String(reason);
    logger.error(`🚨 Unhandled Rejection: ${errorMessage}`);
    notifyAdminError(errorMessage, "Unhandled Promise Rejection");
});

process.on("uncaughtException", async (error: Error) => {
    logger.error(`💥 Uncaught Exception(app stopped): ${error.stack || error.message}`);
    await notifyAdminError(error.message, "Uncaught Exception");
    process.exit(1);
});

app.listen(PORT, () => logger.info(`🌐 Server running on port ${PORT}`));

(async () => {
    try {
        // Remove any previously set webhook
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        if (NODE_ENV === "production") {
            const webhookUrl = `${BACKEND_URL}/webhook`;
            await bot.telegram.setWebhook(webhookUrl, {
                allowed_updates: ["message", "callback_query", "chat_member"]
            });
            logger.info(`✅ Webhook set at ${webhookUrl}`);
        } else {
            bot.launch({ allowedUpdates: ["message", "callback_query", "chat_member"] });
            logger.info(`⚡ Bot started in POLLING mode (Development)`);
        }
    } catch (err: any) {
        logger.error(`❌ Failed to start bot: ${err.message || err}`);
        process.exit(1);
    }
})();

// Graceful shutdown handling
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));