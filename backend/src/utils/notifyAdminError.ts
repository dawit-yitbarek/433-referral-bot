import { bot } from "../bot/bot.js"
import logger from "../config/logger.js";
import { ERROR_RECEIVER_ADMIN_ID } from "../config/env.js";

const RATE_LIMIT_DELAY_MS = 1500; // Wait 1.5s between Telegram API calls

// In-Memory state
const alertQueue: Array<{ text: string }> = [];
let isProcessingQueue = false;

const processAlertQueue = async () => {
    if (isProcessingQueue || alertQueue.length === 0 || !ERROR_RECEIVER_ADMIN_ID) return;

    isProcessingQueue = true;

    while (alertQueue.length > 0) {
        const item = alertQueue.shift();
        if (!item) continue;

        try {
            await bot.telegram.sendMessage(ERROR_RECEIVER_ADMIN_ID, item.text, {
                parse_mode: 'Markdown',
                link_preview_options: { is_disabled: true },
            });
        } catch (error: any) {
            // Fallback for Markdown parse failures or network hiccups
            logger.error(`[Admin Notifier] Markdown error alert failed: ${error.message || error}`);
            await bot.telegram.sendMessage(ERROR_RECEIVER_ADMIN_ID, item.text, {
                link_preview_options: { is_disabled: true },
            }).catch((error) => {
                logger.error(`[Admin Notifier] Plain text error alert also failed: ${error.message || error}}`);
            });
        }

        // Throttle to respect Telegram rate limits
        if (alertQueue.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
        }
    }

    isProcessingQueue = false;
};

export const notifyAdminError = async (error: any, context?: string): Promise<void> => {
    if (!ERROR_RECEIVER_ADMIN_ID || !error) return;

    const message = String(error.message || error).trim();

    // Format Message
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Etc/GMT-3',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const parts = Object.fromEntries(formatter.formatToParts(now).map(p => [p.type, p.value]));
    const timestamp = `${parts.month} ${parts.day} ${parts.year} ${parts.hour}:${parts.minute}:${parts.second} (UTC+3)`;
    const maxLength = 3500;
    const truncatedMessage = message.length > maxLength
        ? `${message.substring(0, maxLength)}\n\n... [Truncated]`
        : message;

    const header = context ? `🚨 *ERROR ALERT* - \`${context}\`` : `🚨 *ERROR ALERT*`;
    const alertText = `${header}\n📅 *Time:* \`${timestamp}\`\n\n\`\`\`text\n${truncatedMessage}\n\`\`\``;

    // Push to in-memory queue & process
    alertQueue.push({ text: alertText });
    processAlertQueue();
};