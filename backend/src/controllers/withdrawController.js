import { pool } from "../config/db.js";

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

// ✅ Submit a new withdrawal request securely
export const sendWithdraw = async (req, res) => {
    const { user_id, name, bank_name, bank_account, phone } = req.body;

    if (!user_id || !name || !bank_name || !bank_account)
        return res.status(400).json({ error: "Missing required fields" });

    try {
        // 1️⃣ Fetch user data
        const userQuery = await pool.query(`
      SELECT referral_count, claimed_referral_count FROM users WHERE id = $1`,
            [user_id]
        );
        if (userQuery.rowCount === 0)
            return res.status(404).json({ error: "User not found" });

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
        const availableReferrals =
            user.referral_count - user.claimed_referral_count - pendingReferrals;

        if (availableReferrals <= 0)
            return res.status(400).json({ error: "No referrals available to withdraw" });

        // 4️⃣ Compute requested amount
        const requestedAmount = availableReferrals * REFERRAL_VALUE;

        // 5️⃣ Insert the withdrawal request
        const insertQuery = await pool.query(`
      INSERT INTO withdrawal_requests 
        (user_id, name, requested_referrals, requested_amount, bank_name, bank_account, phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
            [user_id, name, availableReferrals, requestedAmount, bank_name, bank_account, phone]
        );

        return res.json({
            message: "✅ Withdrawal request submitted successfully",
            request: insertQuery.rows[0],
        });
    } catch (err) {
        console.error("❌ Error creating withdrawal:", err);
        return res.status(500).json({ error: "Server error" });
    }
};