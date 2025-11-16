import { bot } from './bot.js'

export const handleTelegramUpdate = async (req, res) => {
    try {
        await bot.handleUpdate(req.body);
        res.sendStatus(200);
    } catch (err) {
        console.error('❌ Telegram webhook error:', err.message);
        res.sendStatus(500);
    }
};

export default bot;