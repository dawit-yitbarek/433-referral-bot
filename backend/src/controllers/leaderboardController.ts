import type { RequestHandler } from "express";
import logger from "../config/logger.js";
import { pool } from "../config/db.js";
import type { User } from "../types/index.js";
import { CHANNEL_USERNAME, BOT_USERNAME, WITHDRAW_THRESHOLD, REFERRAL_VALUE } from "../config/env.js";
import { notifyAdminError } from "../utils/notifyAdminError.js";

export const getLeaderboard: RequestHandler = async (req, res) => {
  try {
    const telegramId = Number(req.query.telegram_id);

    const leaderboardQuery = `
      SELECT *
      FROM users
      WHERE joined_channel = TRUE
      ORDER BY referral_count DESC, created_at ASC, id ASC
      LIMIT 10;
    `;

    const { rows } = await pool.query<User>(leaderboardQuery);

    let currentUser = rows.find((user) => user.telegram_id === telegramId)

    if (!currentUser && telegramId) {
      const userQuery = `
        SELECT *
        FROM users
        WHERE telegram_id = $1;
      `;
      const { rows: userRows } = await pool.query<User>(userQuery, [telegramId]);
      currentUser = userRows[0];
    }

    res.json({
      topTen: rows,
      currentUser,
      channelUsername: CHANNEL_USERNAME.replace("@", ""),
      botUsername: BOT_USERNAME,
      withdrawThreshold: WITHDRAW_THRESHOLD,
      referralValue: REFERRAL_VALUE
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error(`❌ Error fetching leaderboard: ${errorMessage}`);
    notifyAdminError(errorMessage, "Leaderboard fetcher")
    res.status(500).json({
      error: "Failed to load leaderboard",
    });
  }
};

