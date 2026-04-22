import { bot } from "./bot.js";
import logger from "../config/logger.js";

export const handleTelegramUpdate = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    logger.error("❌ Telegram webhook error:", err.message || err);
    res.sendStatus(500);
  }
};

export default bot;
