import { pool } from "../config/db.js";

export const checkAdmin = async (req, res) => {
    const adminUsername = req.query.username;

    try {
        const { rows } = await pool.query(`SELECT id FROM admins WHERE username = $1`, [adminUsername]);
        const isAdmin = rows.length > 0 ? true : false;
        return res.json({ isAdmin });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAdmins = async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT username FROM admins`);
        return res.json({ admins: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

export const addAdmin = async (req, res) => {
    const { username } = req.query;
    try {
        await pool.query(`INSERT INTO admins (username) VALUES ($1)`, [username]);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

export const deleteAdmin = async (req, res) => {
    const { username } = req.query;
    try {
        await pool.query(`DELETE FROM admins WHERE username = $1`, [username]);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

export const getAllWithdrawals = async (req, res) => {

    try {
        const { rows } = await pool.query(`SELECT * FROM withdrawal_requests`);
        return res.json({ withdrawals: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

