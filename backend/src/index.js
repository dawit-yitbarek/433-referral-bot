import app from './server.js';
import bot from './bot/webhookHandler.js';
import { PORT, BACKEND_URL } from './config/env.js';

app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

(async () => {
    try {
        const webhookUrl = `${BACKEND_URL}/webhook`;
        await bot.telegram.setWebhook(webhookUrl);
        console.log(`✅ Webhook set at ${webhookUrl}`);
    } catch (err) {
        console.error('❌ Failed to set webhook:', err.message);
    }
})();