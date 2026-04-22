import { Telegraf, Markup } from "telegraf";
import { pool } from "../config/db.js";
import { BOT_TOKEN, WEBAPP_URL, CHANNEL_ID, BOT_USERNAME } from "../config/env.js";
import logger from "../config/logger.js";

export const bot = new Telegraf(BOT_TOKEN);

async function hasJoinedChannel(userId) {
  try {
    const member = await bot.telegram.getChatMember(CHANNEL_ID, userId);
    return ["member", "administrator", "creator"].includes(member.status);
  } catch (err) {
    logger.error(
      `⚠️ Error checking channel membership for ${userId}:`,
      err.message || err,
    );
    return false;
  }
}

// ✅ START COMMAND
bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const name = ctx.from.first_name;
    const username = ctx.from.username || "";
    const args = ctx.message.text.split(" ");
    const referrerId = args[1] ? parseInt(args[1]) : null;
    const displayName = name || username || "friend";

    // Check if user exists
    const res = await pool.query(
      "SELECT telegram_id, name, username, joined_telegram FROM users WHERE telegram_id = $1",
      [userId],
    );
    let user = res.rows[0];

    // New user
    if (!user) {
      const alreadyJoined = await hasJoinedChannel(userId);

      if (alreadyJoined) {
        const insert = await pool.query(
          `INSERT INTO users (telegram_id, name, username, joined_telegram)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (telegram_id) DO NOTHING
                     RETURNING telegram_id, name, username, joined_telegram`,
          [userId, name, username, true],
        );

        user = insert.rows[0];

        await ctx.reply(
          `👋 Hey ${displayName}! You’re already a member of our Telegram channel.\n\nYou can earn rewards by inviting new users who aren’t members yet!`,
          Markup.inlineKeyboard([
            [Markup.button.callback("🎁 Get Referral Link", "show_referral")],
            [Markup.button.webApp("🌐 Open Mini App", WEBAPP_URL)],
          ]),
        );
      } else {
        const insert = await pool.query(
          `INSERT INTO users (telegram_id, name, username, referred_by, joined_telegram)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (telegram_id) DO NOTHING
                     RETURNING telegram_id, name, username, joined_telegram`,
          [userId, name, username, referrerId, false],
        );

        user = insert.rows[0];

        await ctx.reply(
          `👋 Welcome ${displayName}!\n\nPlease join our official Telegram channel to continue:`,
          Markup.inlineKeyboard([
            [
              Markup.button.url(
                "📢 Join Channel",
                `https://t.me/${CHANNEL_ID.replace("@", "")}`,
              ),
            ],
            [Markup.button.callback("✅ Verify Joined", "verify_join")],
          ]),
        );
      }
      return;
    }

    // Existing user
    if (user.joined_telegram) {
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
              `https://t.me/${CHANNEL_ID.replace("@", "")}`,
            ),
          ],
          [Markup.button.callback("✅ Verify Joined", "verify_join")],
        ]),
      );
    }
  } catch (err) {
    logger.error("❌ Error in /start handler:", err.message || err);
    try {
      await ctx.reply("⚠️ Something went wrong. Please try again.");
    } catch (_) { }
  }
});

// ✅ Verify Join
bot.action("verify_join", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const joined = await hasJoinedChannel(userId);

    if (!joined) {
      return ctx.answerCbQuery("❌ Please join the channel first!", {
        show_alert: true,
      });
    }

    // Update joined status
    const res = await pool.query(
      "UPDATE users SET joined_telegram = true WHERE telegram_id = $1 RETURNING telegram_id, name, username, joined_telegram, referred_by",
      [userId],
    );
    const user = res.rows[0];

    await ctx.editMessageText(
      "✅ Verified successfully! You’re now part of the community.\n\nStart earning by inviting new users!",
      Markup.inlineKeyboard([
        [Markup.button.callback("🎁 Get Referral Link", "show_referral")],
        [Markup.button.webApp("🌐 Open Mini App", WEBAPP_URL)],
      ]),
    );

    // Notify referrer if applicable
    if (user?.referred_by) {
      try {
        await bot.telegram.sendMessage(
          user.referred_by,
          `🎉 *New Referral!* \n\n${user.name || "A friend"} has joined the channel using your link. Your balance has been updated!`,
          { parse_mode: "Markdown" },
        );
      } catch (notifyErr) {
        logger.warn(
          `Could not notify referrer ${user.referred_by} about new referral: ${notifyErr.message || notifyErr}`,
        );
      }
    }
  } catch (err) {
    logger.error("❌ Error in verify_join handler:", err.message || err);
    try {
      await ctx.reply(
        "⚠️ Something went wrong while verifying. Please try again.",
      );
    } catch (_) { }
  }
});

// ✅ Show Referral Link
bot.action("show_referral", async (ctx) => {
  try {
    const userId = ctx.from.id;
    await ctx.answerCbQuery();
    await ctx.reply(
      `🎁 Your referral link:\nhttps://t.me/${BOT_USERNAME}?start=${userId}`,
      Markup.inlineKeyboard([
        [Markup.button.webApp("🌐 Open Mini App", WEBAPP_URL)],
      ]),
    );
  } catch (err) {
    logger.error("❌ Error showing referral link:", err.message || err);
    try {
      await ctx.reply(
        "⚠️ Could not show your referral link. Please try again.",
      );
    } catch (_) { }
  }
});

// ✅ Global bot-level error handler
bot.catch((err, ctx) => {
  logger.error(
    `🚨 Unhandled error for update type "${ctx.updateType}":`,
    err.message || err,
  );
});

// ✅ Prevent crashes from unexpected rejections
process.on("unhandledRejection", (err) => {
  logger.error("🚨 Unhandled Rejection:", err.message || err);
});

process.on("uncaughtException", (err) => {
  logger.error("🚨 Uncaught Exception:", err.message || err);
});
