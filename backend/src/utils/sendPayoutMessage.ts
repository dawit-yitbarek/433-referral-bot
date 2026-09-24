import { bot } from "../bot/bot.js"
import logger from "../config/logger.js";
import { notifyAdminError } from "./notifyAdminError.js";

interface adminPayout {
    admin_telegram_id: number;
    payoutId: number;
    username: string | null;
    name: string;
    requestedAmount: number;
    claimableReferrals: number;
    pointRate: number;
    bank_name: string;
    bank_account: string;
    account_holder_name: string;
}

const escapeMarkdown = (text: string = ''): string =>
    text.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');

export const sendAdminPayoutMessage = async ({
    admin_telegram_id,
    payoutId,
    username,
    name,
    requestedAmount,
    claimableReferrals,
    pointRate,
    bank_name,
    bank_account,
    account_holder_name
}: adminPayout) => {
    const sanitizedName = escapeMarkdown(name);

    const userDmLink = username ? `[${sanitizedName}](https://t.me/${username})` : sanitizedName;

    const adminMessage = `
🆕 *New Payout Request #${payoutId}*

👤 *User:* ${userDmLink}
💰 *Amount:* ${requestedAmount.toFixed(2)} ETB
🔢 *Referrals Claimed:* ${claimableReferrals} (${pointRate} ETB/ref)

🏦 *Bank Name:* ${bank_name}
💳 *Account Number:* \`${bank_account}\`
👤 *Account Holder:* ${account_holder_name}
    `.trim();

    try {
        await bot.telegram.sendMessage(admin_telegram_id, adminMessage, {
            parse_mode: "Markdown",
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logger.error(`⚠️ Failed to send Telegram notification to admin ${admin_telegram_id}: ${errorMessage}`);
        notifyAdminError(errorMessage, "send Admin Payout Message")
    }
}

export const sendUserApprovedPayoutMessage = async ({
    user_telegram_id,
    amountFormatted,
    referrals_claimed,
}: {
    user_telegram_id: number | string;
    amountFormatted: string | number;
    referrals_claimed: number;
}) => {
    const userApprovedMsg = `
✅ *Payout Request Approved!*

Your withdrawal of *${amountFormatted} ETB* (${referrals_claimed} referrals) has been successfully processed. Please check your bank account.
    `.trim();

    try {
        await bot.telegram.sendMessage(user_telegram_id, userApprovedMsg, {
            parse_mode: "Markdown",
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logger.error(`⚠️ Failed to send user payout approval message to ${user_telegram_id}: ${errorMessage}`);
        notifyAdminError(errorMessage, "send User Approved Payout Message")
    }
};

export const sendAdminConfirmedPayoutMessage = async ({
    admin_telegram_id,
    payoutId,
    username,
    name,
}: {
    admin_telegram_id: number | string;
    payoutId: number | string;
    username: string | null;
    name: string
}) => {

    const sanitizedName = escapeMarkdown(name);
    const userDmLink = username ? `[${sanitizedName}](https://t.me/${username})` : sanitizedName;
    const adminApprovedMsg = `
✅ *Payout #${payoutId} Confirmed*
Successfully marked as paid for user : ${userDmLink}.
    `.trim();


    try {
        await bot.telegram.sendMessage(admin_telegram_id, adminApprovedMsg, {
            parse_mode: "Markdown",
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logger.error(`⚠️ Failed to send admin payout confirmation message to ${admin_telegram_id}: ${errorMessage}`);
        notifyAdminError(errorMessage, "send Admin Confirmed Payout Message")
    }
};

export const sendUserRejectedPayoutMessage = async ({
    user_telegram_id,
    amountFormatted,
    referrals_claimed,
    rejection_reason,
}: {
    user_telegram_id: number | string;
    amountFormatted: string | number;
    referrals_claimed: number;
    rejection_reason?: string;
}) => {
    const sanitizedReason = rejection_reason ? escapeMarkdown(rejection_reason) : '';
    const reasonText = sanitizedReason ? `\n*Reason:* ${sanitizedReason}\n` : '';

    const userRejectedMsg = `
❌ *Payout Request Rejected*

Your withdrawal request for *${amountFormatted} ETB* was not approved.${reasonText}
Your ${referrals_claimed} referrals have been refunded to your account balance so you can try again.
  `.trim();

    try {
        await bot.telegram.sendMessage(user_telegram_id, userRejectedMsg, {
            parse_mode: "Markdown",
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logger.error(`⚠️ Failed to send user payout rejection message to ${user_telegram_id}: ${errorMessage}`);
        notifyAdminError(errorMessage, "send User Rejected Payout Message");
    }
};

export const sendAdminRejectedPayoutMessage = async ({
    admin_telegram_id,
    payoutId,
    referrals_claimed,
    username,
    name
}: {
    admin_telegram_id: number | string;
    payoutId: number | string;
    referrals_claimed: number;
    username: string | null;
    name: string;
}) => {
    const sanitizedName = escapeMarkdown(name);
    const userDmLink = username ? `[${sanitizedName}](https://t.me/${username})` : sanitizedName;
    const adminRejectedMsg = `
❌ *Payout #${payoutId} Rejected*
Request rejected and ${referrals_claimed} referrals refunded to user : ${userDmLink}.
    `.trim();

    try {
        await bot.telegram.sendMessage(admin_telegram_id, adminRejectedMsg, {
            parse_mode: "Markdown",
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logger.error(`⚠️ Failed to send admin payout rejection message to ${admin_telegram_id}: ${errorMessage}`);
        notifyAdminError(errorMessage, "send Admin Rejected Payout Message")
    }
};