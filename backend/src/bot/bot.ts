import { Telegraf, Markup } from "telegraf";
import { pool } from "../config/db.js";
import { BOT_TOKEN, WEBAPP_URL, CHANNEL_USERNAME, CHANNEL_ID, BOT_USERNAME } from "../config/env.js";
import { hasJoinedChannel } from "../utils/checkChannelJoin.js";
import logger from "../config/logger.js";
import type { User } from "../types/index.js";
import { handleChannelMembershipChange } from "../controllers/channelMembershipController.js";
import { notifyAdminError } from "../utils/notifyAdminError.js";

export const bot = new Telegraf(BOT_TOKEN);


// ✅ START COMMAND
bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name || null
    const username = ctx.from.username || "";
    const args = ctx.message.text.split(" ");
    const referrerId = args[1] && !isNaN(Number(args[1])) ? parseInt(args[1], 10) : null;
    const displayName = firstName || username || "friend";

    // Check if user exists
    const res = await pool.query(
      "SELECT joined_channel FROM users WHERE telegram_id = $1",
      [userId],
    );
    const user: User = res.rows[0];

    // New user
    if (!user) {
      const alreadyJoined = await hasJoinedChannel(userId);

      if (alreadyJoined) {
        await pool.query(
          `INSERT INTO users (telegram_id, first_name, last_name, username, joined_channel)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (telegram_id) DO NOTHING
          `,
          [userId, firstName, lastName, username, true],
        );


        await ctx.reply(
          `👋 Hey ${displayName}! You’re already a member of our Telegram channel.\n\nYou can earn rewards by inviting new users who aren’t members yet!`,
          Markup.inlineKeyboard([
            [Markup.button.callback("🎁 Get Referral Link", "show_referral")],
            [Markup.button.webApp("🌐 Open Mini App", WEBAPP_URL)],
          ]),
        );
      } else {
        await pool.query(
          `INSERT INTO users (telegram_id, first_name, last_name, username, referred_by, joined_channel)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (telegram_id) DO NOTHING
                     `,
          [userId, firstName, lastName, username, referrerId, false],
        );

        await ctx.reply(
          `👋 Welcome ${displayName}!\n\nPlease join our official Telegram channel to continue:`,
          Markup.inlineKeyboard([
            [
              Markup.button.url(
                "📢 Join Channel",
                `https://t.me/${CHANNEL_USERNAME.replace("@", "")}`,
              ),
            ],
          ]),
        );
      }
      return;
    }

    // Existing user
    if (user.joined_channel) {
      await ctx.reply(
        `👋 Hey ${displayName}! You’ve already joined our Telegram channel.\n\nEarn more rewards by inviting friends!`,
        Markup.inlineKeyboard([
          [Markup.button.callback("🎁 Get Referral Link", "show_referral")],
          [Markup.button.webApp("🌐 Open Mini App", WEBAPP_URL)],
        ]),
      );
    } else {
      await ctx.reply(
        `👋 Welcome back ${displayName}!\n\nPlease join our official Telegram channel to continue:`,
        Markup.inlineKeyboard([
          [
            Markup.button.url(
              "📢 Join Channel",
              `https://t.me/${CHANNEL_USERNAME.replace("@", "")}`,
            ),
          ]
        ]),
      );
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    try {
      await ctx.reply("⚠️ Something went wrong. Please try again.");
    } catch (_) { }
    logger.error(`❌ Error in /start handler: ${errorMessage}`);
    notifyAdminError(errorMessage, "bot Start handler")
  }
});

bot.on("chat_member", async (ctx) => {
  const update = ctx.chatMember;
  const channelId = ctx.chat.id
  const userId = update.new_chat_member.user.id;

  if (channelId !== Number(CHANNEL_ID)) return;

  const newStatus = update.new_chat_member.status;
  const oldStatus = update.old_chat_member.status;

  const activeStatuses = ["creator", "administrator", "member", "restricted"];
  const inactiveStatuses = ["left", "kicked"];

  const wasJoined = activeStatuses.includes(oldStatus);
  const isJoined = activeStatuses.includes(newStatus);

  // Status didn't change with respect to membership (e.g. promoted to admin)
  if (wasJoined === isJoined) return;

  if (isJoined) {
    await handleChannelMembershipChange(userId, true);
  } else if (inactiveStatuses.includes(newStatus)) {
    await handleChannelMembershipChange(userId, false);
  }
})

// ✅ Show Referral Link
bot.action("show_referral", async (ctx) => {
  try {
    const userId = ctx.from.id;
    await ctx.answerCbQuery();
    await ctx.reply(
      `🎁 Your referral link:\n<code>https://t.me/${BOT_USERNAME}?start=${userId}</code>`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [Markup.button.webApp("🌐 Open Mini App", WEBAPP_URL)],
        ]),
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    try {
      await ctx.reply(
        "⚠️ Could not show your referral link. Please try again.",
      );
    } catch (_) { }
    logger.error(`❌ Error showing referral link: ${errorMessage}`);
    notifyAdminError(errorMessage, "bot show_referral handler")
  }
});

// ✅ Global bot-level error handler
bot.catch((err, ctx) => {
  const errorMessage = err instanceof Error ? err.message : String(err)
  logger.error(`🚨 Unhandled error for update type "${ctx.updateType}": ${errorMessage}`);
  notifyAdminError(errorMessage, "bot catch")
});
