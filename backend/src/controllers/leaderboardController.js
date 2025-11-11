import { pool } from '../config/db.js';

export const getLeaderboard = async (req, res) => {

  try {
    const userId = req.query.user_id;

    // 1️⃣ Fetch Top 10 Users with Rank
    const { rows: topTen } = await pool.query(`
      WITH ranked_users AS (
        SELECT 
          telegram_id, name, profile_photo, referral_count,
          ROW_NUMBER() OVER (ORDER BY referral_count DESC) AS rank
        FROM users
      )
      SELECT * FROM ranked_users ORDER BY rank ASC LIMIT 10;
    `);

    // 2️⃣ Check if Current User is in Top 10
    const isInTopTen = topTen.some(u => u.telegram_id.toString() === userId);

    // 3️⃣ If not in Top 10, fetch current user separately
    let currentUser = null;
    if (!isInTopTen) {
      const { rows } = await pool.query(`
            WITH ranked_users AS (
              SELECT 
                telegram_id, name, profile_photo, referral_count,
                ROW_NUMBER() OVER (ORDER BY referral_count DESC) AS rank
              FROM users
            )
            SELECT * FROM ranked_users WHERE telegram_id = $1;
          `, [userId]);
      currentUser = rows[0] || null;
    }

    res.json({ topTen, currentUser });
  } catch (err) {
    console.error("❌ Error fetching leaderboard:", err.message);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
};