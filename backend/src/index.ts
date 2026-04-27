import app from "./server.js";
import { bot } from "./bot/bot.js";
import { PORT, BACKEND_URL } from "./config/env.js";
import { startReferralCheckCron } from "./cron/checkReferrals.js";
import logger from "./config/logger.js";

app.listen(PORT, () => logger.info(`🌐 Server running on port ${PORT}`));

(async () => {
    try {
        const webhookUrl = `${BACKEND_URL}/webhook`;
        await bot.telegram.setWebhook(webhookUrl);
        startReferralCheckCron();
        logger.info(`✅ Webhook set at ${webhookUrl}`);
    } catch (err: any) {
        logger.error(`❌ Failed to set webhook: ${err.message || err}`);
    }
})();
