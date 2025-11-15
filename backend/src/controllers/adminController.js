import { pool } from "../config/db.js";

export const checkAdmin = async (req, res) => {
    const adminUsername = req.query.username;

    try {
        const { rows } = await pool.query(`SELECT id FROM admins WHERE username = $1`, [adminUsername]);
        const isAdmin = rows.length > 0 ? true : false;
        return res.json({ isAdmin });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAdmins = async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT username FROM admins`);
        return res.json({ admins: rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
}

export const addAdmin = async (req, res) => {
    const { username } = req.query;
    try {
        await pool.query(`INSERT INTO admins (username) VALUES ($1)`, [username]);
        return res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
}

export const deleteAdmin = async (req, res) => {
    const { username } = req.query;
    try {
        await pool.query(`DELETE FROM admins WHERE username = $1`, [username]);
        return res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
}

export const getAllWithdrawals = async (req, res) => {

    try {
        const { rows } = await pool.query(`SELECT * FROM withdrawal_requests`);
        return res.json({ withdrawals: rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
};


export const getUsers = async (req, res) => {
    try {
        let { page = 1, limit = 20 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        const offset = (page - 1) * limit;

        // 1️⃣ Get users (paginated)
        const usersQuery = await pool.query(
            `
            SELECT id, telegram_id, username, name, profile_photo, referral_count, created_at
            FROM users
            ORDER BY referral_count DESC
            LIMIT $1 OFFSET $2
            `,
            [limit, offset]
        );

        return res.json({
            users: usersQuery.rows,
            has_more: usersQuery.rows.length === limit
        });
    } catch (err) {
        console.error("❌ Error fetching users:", err.message);
        return res.status(500).json({ error: "Server error" });
    }
};


// routes/admin.js (same file)
export const getAllReferrals = async (req, res) => {
    try {
        const { telegram_id } = req.query;

        const query = await pool.query(
            `
            SELECT 
                id,
                telegram_id,
                username,
                name,
                profile_photo,
                referral_count,
                created_at
            FROM users
            WHERE referred_by = $1
            ORDER BY id DESC
            `,
            [telegram_id]
        );

        return res.json({
            referrals: query.rows,
        });
    } catch (err) {
        console.error("❌ Error fetching user referrals:", err.message);
        return res.status(500).json({ error: "Server error" });
    }
};

export const searchUser = async (req, res) => {
    const q = req.query.query?.trim();

    if (!q) {
        return res.status(400).json({ error: "Missing query parameter" });
    }

    try {

        // General search (name or username, partial match)
        const textSearch = await pool.query(
            `
            SELECT 
               id, telegram_id, username, name, profile_photo, referral_count, created_at
               FROM users
               WHERE username ILIKE $1
            `,
            [`%${q}%`]
        );


        return res.json({
            user: textSearch.rows,
        });
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
