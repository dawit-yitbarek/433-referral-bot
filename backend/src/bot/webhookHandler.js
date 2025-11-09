import { Telegraf } from 'telegraf';
import { BOT_TOKEN } from '../config/env.js';
import './bot.js';

const bot = new Telegraf(BOT_TOKEN);

export const handleTelegramUpdate = async (req, res) => {
    try {
        await bot.handleUpdate(req.body);
        res.sendStatus(200); // Telegram requires 200
    } catch (err) {
        console.error('❌ Telegram webhook error:', err.message);
        res.sendStatus(500);
    }
};

export default bot;