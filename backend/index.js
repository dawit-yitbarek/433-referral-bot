import app from "./src/server.js";
import bot from "./src/bot/webhookHandler.js";
import { PORT, BACKEND_URL } from "./src/config/env.js";
import { startReferralCheckCron } from "./src/cron/checkReferrals.js";
import logger from "./src/config/logger.js";

app.listen(PORT, () => logger.info(`🌐 Server running on port ${PORT}`));

(async () => {
  try {
    const webhookUrl = `${BACKEND_URL}/webhook`;
    await bot.telegram.setWebhook(webhookUrl);
    startReferralCheckCron();
    logger.info(`✅ Webhook set at ${webhookUrl}`);
  } catch (err) {
    logger.error("❌ Failed to set webhook:", err.message || err);
  }
})();
