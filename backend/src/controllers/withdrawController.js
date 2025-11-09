import { pool } from "../config/db.js";
import { ADMINS } from '../config/env.js';

const REFERRAL_VALUE = 0.4; // $ per referral

// ✅ Fetch withdrawal history for a user
export const getWithdrawHistory = async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    try {
        const { rows } = await pool.query(`
      SELECT id, requested_referrals, requested_amount, status, created_at 
       FROM withdrawal_requests 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
            [user_id]
        );

        return res.json({ withdrawals: rows });
    } catch (err) {
        console.error("❌ Error fetching withdrawals:", err);
        return res.status(500).json({ error: "Server error" });
    }
};


const admins = ADMINS.split(",");

export const sendWithdraw = async (req, res) => {
    const { user_id, name, bank_name, bank_account, phone } = req.body;

    if (!user_id || !name || !bank_name || !bank_account) {
        console.log("❌ Missing fields in withdrawal request:", req.body);
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // 1️⃣ Fetch user data
        const userQuery = await pool.query(`
            SELECT referral_count, claimed_referral_count FROM users WHERE id = $1`,
            [user_id]
        );
        if (userQuery.rowCount === 0) {
            console.log("❌ User not found for withdrawal request:", user_id);
            return res.status(404).json({ error: "User not found" });
        }
        const user = userQuery.rows[0];

        // 2️⃣ Calculate pending referrals
        const pendingQuery = await pool.query(`
            SELECT COALESCE(SUM(requested_referrals), 0) AS pending_referrals
             FROM withdrawal_requests 
             WHERE user_id = $1 AND status = 'pending'`,
            [user_id]
        );
        const pendingReferrals = parseInt(pendingQuery.rows[0].pending_referrals || 0, 10);

        // 3️⃣ Calculate unclaimed referrals
        const availableReferrals = user.referral_count - user.claimed_referral_count - pendingReferrals;
        if (availableReferrals <= 0) {
            console.log("❌ No referrals available for withdrawal for user:", user_id);
            return res.status(400).json({ error: "No referrals available to withdraw" });
        }

        // 4️⃣ Compute requested amount
        const requestedAmount = availableReferrals * REFERRAL_VALUE;

        // 5️⃣ Determine admin with fewest pending requests
        const adminQuery = await pool.query(`
            SELECT assigned_to, COUNT(*) AS count
             FROM withdrawal_requests
             WHERE status = 'pending'
             GROUP BY assigned_to`
        );

        // Build admin load map
        const adminLoads = {};
        admins.forEach(admin => adminLoads[admin] = 0);
        adminQuery.rows.forEach(row => {
            adminLoads[row.assigned_to] = parseInt(row.count);
        });

        // Pick admin with least pending requests
        const assignedTo = Object.entries(adminLoads).sort((a, b) => a[1] - b[1])[0][0];

        // 6️⃣ Insert the withdrawal request with assigned_to
        const insertQuery = await pool.query(`
            INSERT INTO withdrawal_requests
            (user_id, name, requested_referrals, requested_amount, bank_name, bank_account, phone, status, assigned_to)
             VALUES($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
             RETURNING *`,
            [user_id, name, availableReferrals, requestedAmount, bank_name, bank_account, phone, assignedTo]
        );

        return res.json({
            message: `✅ Withdrawal request submitted successfully and assigned to ${assignedTo}`,
            request: insertQuery.rows[0],
        });
    } catch (err) {
        console.error("❌ Error creating withdrawal:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

export const getAdminWithdrawals = async (req, res) => {
    const adminUsername = req.query.username;

    try {
        const { rows } = await pool.query(`
            SELECT * FROM withdrawal_requests WHERE status = 'pending' AND assigned_to = $1
        `, [adminUsername]);
        return res.json({ withdrawals: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const processWithdrawal = async (req, res) => {
    const { id, user_Id } = req.body;
    try {
        const { rows } = await pool.query(`UPDATE withdrawal_requests SET status = 'paid', processed_at = NOW() WHERE id = $1 RETURNING requested_referrals`, [id]);
        await pool.query(`UPDATE users SET claimed_referral_count = claimed_referral_count + $1 WHERE id = $2`, [rows[0].requested_referrals, user_Id]);
        res.json({ message: "Withdrawal marked as paid" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};