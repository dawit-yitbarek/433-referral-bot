import type { RequestHandler } from "express";
import { pool } from "../config/db.js";
import { bot } from "../bot/bot.js";
import pLimit from "p-limit";
import logger from "../config/logger.js";
import { TelegramError } from "telegraf";

export const checkAdmin: RequestHandler = async (req, res) => {
  const adminUsername = req.query.username;

  try {
    const { rows } = await pool.query(
      `SELECT id FROM admins WHERE username = $1`,
      [adminUsername],
    );
    const isAdmin = rows.length > 0 ? true : false;
    res.json({ isAdmin });
  } catch (err) {
    logger.error(`❌ Error on checkAdmin: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ message: "Server error" });
  }
  return;
};

export const getAdmins: RequestHandler = async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT username FROM admins`);
    res.json({ admins: rows });
  } catch (err) {
    logger.error(`❌ Error fetching admins: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ message: "Server error" });
  }
  return;
};

export const addAdmin: RequestHandler = async (req, res) => {
  const { username } = req.query;
  try {
    const result = await pool.query(
      `INSERT INTO admins (username) VALUES ($1) RETURNING *`, [username]
    );
    const newAdmin = result.rows[0];
    res.json({ success: true, admin: newAdmin });
  } catch (err) {
    logger.error(`❌ Error adding admin: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ message: "Server error" });
  }
  return;
};

export const deleteAdmin: RequestHandler = async (req, res) => {
  const { username } = req.query;
  try {
    await pool.query(`DELETE FROM admins WHERE username = $1`, [username]);
    res.json({ success: true });
  } catch (err) {
    logger.error(`❌ Error deleting admin: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ message: "Server error" });
  }
  return;
};

export const getAllWithdrawals: RequestHandler = async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM withdrawal_requests`);
    res.json({ withdrawals: rows });
  } catch (err) {
    logger.error(`❌ Error fetching all Withdrawals: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ message: "Server error" });
  }
  return;
};

export const getUsers: RequestHandler = async (req, res) => {
  try {
    let { page, limit } = req.query;

    const pageNum = parseInt(String(page || 1));
    const limitNum = parseInt(String(limit || 50));

    const offset = (pageNum - 1) * limitNum;

    const usersQuery = await pool.query(
      `
      SELECT 
        u.*,
        COALESCE(rc.live_count, 0)::int as referral_count
      FROM users u
      LEFT JOIN (
        SELECT referred_by, COUNT(*)::int as live_count 
        FROM users 
        WHERE joined_telegram = true 
        GROUP BY referred_by
      ) rc ON u.telegram_id = rc.referred_by
      ORDER BY referral_count DESC, u.id ASC
      LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    let totalUsers = null;
    if (pageNum === 1) {
      const countQuery = await pool.query(`SELECT COUNT(*) FROM users`);
      totalUsers = parseInt(countQuery.rows[0].count);
    }

    return res.json({
      users: usersQuery.rows,
      has_more: usersQuery.rows.length === limitNum,
      total_users: totalUsers,
    });
  } catch (err) {
    logger.error(`❌ Error fetching users: ${err instanceof Error ? err.message : String(err)}`);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getAllReferrals: RequestHandler = async (req, res) => {
  try {
    const { telegram_id } = req.query;

    const query = await pool.query(
      `SELECT * FROM users 
       WHERE referred_by = $1 AND joined_telegram = true
       ORDER BY id DESC`,
      [telegram_id],
    );

    res.json({ referrals: query.rows });
  } catch (err) {
    logger.error(`❌ Error fetching user referrals: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ error: "Server error" });
  }
  return;
};

export const searchUser: RequestHandler = async (req, res) => {
  const q = String(req.query.query)?.trim();
  if (!q) return res.status(400).json({ error: "Missing query" });

  try {
    const textSearch = await pool.query(
      `
      SELECT 
        u.*,
        (SELECT COUNT(*)::int FROM users WHERE referred_by = u.telegram_id AND joined_telegram = true) as referral_count
      FROM users u 
      WHERE username = $1
      `,
      [q],
    );

    res.json({ user: textSearch.rows });
  } catch (err) {
    logger.error(`User Search error: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ error: "Server error" });
  }
  return;
};

export const broadcastMessage: RequestHandler = async (req, res) => {
  const { message } = req.body;
  const limit = pLimit(25);

  if (!message || !message.trim()) {
    logger.warn("Broadcast failed: Message is required");
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const { rows: users } = await pool.query("SELECT telegram_id FROM users");

    if (users.length === 0) {
      logger.warn("Broadcast failed: No users found");
      return res.status(400).json({ error: "No users found." });
    }

    res.json({
      success: true,
      message: `Broadcast started for ${users.length} users.`,
    });

    // Run the broadcast in the background
    (async () => {
      logger.info(`Starting broadcast to ${users.length} users...`);

      const promises = users.map((user) =>
        limit(async () => {
          try {
            await bot.telegram.sendMessage(user.telegram_id, message, {
              parse_mode: "Markdown",
            });
          } catch (err) {
            if (err instanceof TelegramError && err.response?.error_code === 403) {
              logger.info(`User ${user.telegram_id} blocked the bot.`);
            } else {
              logger.error(
                `Broadcast error for ${user.telegram_id}: 
                ${err instanceof Error ? err.message : String(err)}`
              );
            }
          }
        }),
      );

      await Promise.all(promises);
      logger.info("✅ Broadcast complete.");
    })();
  } catch (err) {
    logger.error(`Broadcast initiation failed: ${err instanceof Error ? err.message : String(err)}`);
    if (!res.headersSent) {
      res.status(500).json({ error: "Server error starting broadcast." });
    }
  }
  return;
};
