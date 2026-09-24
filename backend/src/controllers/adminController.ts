import type { RequestHandler } from "express";
import { pool } from "../config/db.js";
import logger from "../config/logger.js";
import { ADMIN } from "../config/env.js";
import { notifyAdminError } from "../utils/notifyAdminError.js";

export const checkAdmin: RequestHandler = async (req, res) => {
  const userId = req.query.telegram_id;

  // Handle missing or invalid query parameter
  if (typeof userId !== "string") {
    return res.status(400).json({ error: "userId query parameter must be a string" });
  }

  const isAdmin = Number(userId.trim()) === Number(ADMIN.trim());

  return res.json({ isAdmin });
};

export const getUsers: RequestHandler = async (req, res) => {
  try {
    let { page, limit } = req.query;

    const pageNum = parseInt(String(page || 1));
    const limitNum = parseInt(String(limit || 50));

    const offset = (pageNum - 1) * limitNum;

    const usersQuery = await pool.query(
      `
  SELECT * FROM users
  ORDER BY referral_count DESC, id ASC
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
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error(`❌ Error fetching users: ${errorMessage}`);
    notifyAdminError(errorMessage, "Users fetcher for referrals page")
    return res.status(500).json({ error: "Server error" });
  }
};

export const getAllReferrals: RequestHandler = async (req, res) => {
  try {
    const { telegram_id } = req.query;

    const query = await pool.query(
      `SELECT * FROM users 
       WHERE referred_by = $1 AND joined_channel = true
       ORDER BY id DESC`,
      [telegram_id],
    );

    res.json({ referrals: query.rows });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error(`❌ Error fetching user referrals: ${errorMessage}`);
    notifyAdminError(errorMessage, "All Users fetcher for referrals page")
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
      SELECT * FROM users WHERE LOWER(username) = LOWER($1)
      `,
      [q],
    );

    res.json({ user: textSearch.rows });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error(`User Search error: ${errorMessage}`);
    notifyAdminError(errorMessage, "Users searcher for referrals page")
    res.status(500).json({ error: "Server error" });
  }
  return;
};