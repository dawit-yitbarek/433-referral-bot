import { pool } from "../config/db.js";
import { bot } from "../bot/bot.js";

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
        let { page = 1, limit = 50 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        const offset = (page - 1) * limit;

        // Get users with pagination
        const usersQuery = await pool.query(
            `
            SELECT id, telegram_id, username, name, profile_photo, referral_count, created_at
            FROM users
            ORDER BY referral_count DESC
            LIMIT $1 OFFSET $2`
            ,
            [limit, offset]
        );

        let totalUsers = null
        if (page === 1) {
            const countQuery = await pool.query(`SELECT COUNT(*) FROM users`);
            totalUsers = parseInt(countQuery.rows[0].count);
            console.log("User counted ", totalUsers)
        };

        return res.json({
            users: usersQuery.rows,
            has_more: usersQuery.rows.length === limit,
            total_users: totalUsers
        });
    } catch (err) {
        console.error("❌ Error fetching users:", err.message);
        return res.status(500).json({ error: "Server error" });
    }
};


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
            WHERE referred_by = $1 AND joined_telegram = true
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

        // search by username
        const textSearch = await pool.query(
            `
            SELECT 
               id, telegram_id, username, name, profile_photo, referral_count, created_at
               FROM users
               WHERE username = $1
            `,
            [q]
        );


        return res.json({
            user: textSearch.rows,
        });
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Server error" });
    }
};


export const broadcastMessage = async (req, res) => {
    const { message } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        // Fetch all users
        const { rows: users } = await pool.query("SELECT telegram_id FROM users");
        if (users.length === 0) {
            return res.status(400).json({ error: "No users found." });
        }

        let successSent = false;
        let responseSent = false;

        // Go through users one by one
        (async () => {
            for (let i = 0; i < users.length; i++) {
                try {
                    await bot.telegram.sendMessage(users[i].telegram_id, message);

                    // First success → respond to the frontend
                    if (!successSent) {
                        successSent = true;
                        if (!responseSent) {
                            responseSent = true;
                            res.json({ success: true, message: "Broadcast started." });
                        }
                    }

                    // Small delay to avoid Telegram rate limit
                    await new Promise(r => setTimeout(r, 30));

                } catch (err) {
                    console.log("Failed to send to:", users[i].telegram_id);
                }
            }


            if (!successSent && !responseSent) {
                responseSent = true;
                res.status(500).json({ error: "Failed to send message to any user." });
            }
        })();

    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Server error starting broadcast." });
        }
    }
};