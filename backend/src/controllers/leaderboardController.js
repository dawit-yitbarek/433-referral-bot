import logger from "../config/logger.js";
import { pool } from "../config/db.js";

export const getLeaderboard = async (req, res) => {
  try {
    const userId = req.query.user_id;

    const leaderboardQuery = `
      WITH user_referral_counts AS (
        SELECT 
          referred_by, 
          COUNT(*)::int as live_count 
        FROM users 
        WHERE joined_telegram = true AND referred_by IS NOT NULL
        GROUP BY referred_by
      ),
      ranked_users AS (
        SELECT 
          u.telegram_id, 
          u.name, 
          u.profile_photo, 
          COALESCE(rc.live_count, 0) as referral_count,
          ROW_NUMBER() OVER (ORDER BY COALESCE(rc.live_count, 0) DESC, u.created_at ASC) AS rank
        FROM users u
        LEFT JOIN user_referral_counts rc ON u.telegram_id = rc.referred_by
      )
      SELECT * FROM ranked_users WHERE rank <= 10 OR telegram_id = $1
      ORDER BY rank ASC;
    `;

    const { rows: allRelevantUsers } = await pool.query(leaderboardQuery, [
      userId,
    ]);

    // Extract the Top 10
    const topTen = allRelevantUsers.filter((u) => u.rank <= 10);

    const isInTopTen = topTen.some(
      (u) => u.telegram_id.toString() === userId.toString(),
    );

    const currentUser = isInTopTen
      ? null
      : allRelevantUsers.find(
          (u) => u.telegram_id.toString() === userId.toString(),
        ) || null;

    res.json({ topTen, currentUser });
  } catch (err) {
    logger.error("❌ Error fetching leaderboard:", err.message || err);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
};
