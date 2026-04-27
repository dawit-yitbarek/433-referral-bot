import type { RequestHandler } from "express";
import { pool } from "../config/db.js";
import { BOT_TOKEN, CHANNEL_ID } from "../config/env.js";
import { bot } from "../bot/bot.js";
import logger from "../config/logger.js";
import type { UserDashboardResponse, UserDashboardRequest } from "../types/index.js";

export const getUserDashboard: RequestHandler = async (req, res) => {
  try {
    const { id: telegramId, name }: UserDashboardRequest = req.body;
    if (!telegramId) return res.status(400).json({ error: "Missing id" });

    // Verify channel membership
    let hasJoined = false;
    try {
      const member = await bot.telegram.getChatMember(CHANNEL_ID, telegramId);
      hasJoined = ["creator", "administrator", "member"].includes(
        member.status,
      );
    } catch (err) {
      logger.warn(
        `⚠️ Membership check failed for ${telegramId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Fetch profile picture
    let profilePicture = null;
    try {
      const photos = await bot.telegram.getUserProfilePhotos(telegramId, 0, 1);
      if (photos.total_count > 0) {
        const fileId = photos.photos[0]?.[0]?.file_id;
        if (fileId) {
          const file = await bot.telegram.getFile(fileId);
          profilePicture = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
        }
      }
    } catch (err) {
      logger.warn(
        `⚠️ Profile pic fetch failed for ${telegramId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Fetch user data
    const dashboardQuery = `
            WITH upserted_user AS (
                INSERT INTO users (telegram_id, name, profile_photo, joined_telegram)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (telegram_id)
                DO UPDATE SET
                    name = EXCLUDED.name,
                    profile_photo = EXCLUDED.profile_photo,
                    joined_telegram = EXCLUDED.joined_telegram
                RETURNING id, telegram_id, name, profile_photo, claimed_referral_count
            )
            SELECT 
                u.*,
                (SELECT COUNT(*)::int FROM users WHERE referred_by = u.telegram_id AND joined_telegram = true) as total_referrals,
                (SELECT COALESCE(SUM(requested_referrals), 0)::int FROM withdrawal_requests WHERE user_id = u.id AND status = 'pending') as pending_referrals
            FROM upserted_user u;
        `;

    const { rows } = await pool.query(dashboardQuery, [
      telegramId,
      name,
      profilePicture,
      hasJoined,
    ]);
    const user = rows[0];

    // Compute balance logic
    const total_referrals = user.total_referrals;
    const claimed_referrals = user.claimed_referral_count;
    const pending_referrals = user.pending_referrals;

    let unclaimed_referrals = total_referrals - claimed_referrals - pending_referrals;
    if (unclaimed_referrals < 0) unclaimed_referrals = 0;

    const responseUser: UserDashboardResponse['user'] = {
      id: user.id,
      telegram_id: user.telegram_id,
      name: user.name,
      profile_photo: user.profile_photo,
      total_referrals,
      claimed_referrals,
      unclaimed_referrals,
      hasJoined,
    };

    res.status(200).json({ user: responseUser });
  } catch (error) {
    logger.error(`❌ Error fetching user dashboard: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ message: "Internal server error" });
  }
  return;
};
