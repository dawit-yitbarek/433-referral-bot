import type { RequestHandler } from "express";
import { bot } from "./bot.js";
import logger from "../config/logger.js";
import { notifyAdminError } from "../utils/notifyAdminError.js";

export const handleTelegramUpdate: RequestHandler = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`❌ Telegram webhook error: ${errorMessage}`);
    notifyAdminError(errorMessage, "Webhook update handler")
    res.sendStatus(500);
  }
};

export default bot;
