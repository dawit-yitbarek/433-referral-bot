import { CHANNEL_USERNAME } from "../config/env.js";
import logger from "../config/logger.js";
import { bot } from "../bot/bot.js";
import { notifyAdminError } from "./notifyAdminError.js";

export async function hasJoinedChannel(userId: number) {
    try {
        const formattedChannel = CHANNEL_USERNAME.startsWith("@") ? CHANNEL_USERNAME : `@${CHANNEL_USERNAME}`;
        const member = await bot.telegram.getChatMember(formattedChannel, userId);
        return ["member", "administrator", "creator"].includes(member.status);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`⚠️ Error checking channel membership for ${userId}: ${errorMessage}`);
        notifyAdminError(errorMessage, "channel join checker");
        return false;
    }
}