import { Telegraf } from 'telegraf';
import { pool } from '../config/db.js';
import { BOT_TOKEN } from '../config/env.js';

const bot = new Telegraf(BOT_TOKEN);

export const getUserDashboard = async (req, res) => {
    try {
        const { id: telegramId, name } = req.body;
        if (!telegramId) return res.status(400).json({ error: 'Missing id' });

        // 1️⃣ Fetch profile picture from Telegram
        let profilePicture = null;
        try {
            const photos = await bot.telegram.getUserProfilePhotos(telegramId, 0, 1);
            if (photos.total_count > 0) {
                const fileId = photos.photos[0][0].file_id;
                const file = await bot.telegram.getFile(fileId);
                profilePicture = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
            }
        } catch (err) {
            console.warn(`⚠️ Could not fetch profile picture for ${telegramId}:`, err.message);
        }

        // 2️⃣ Upsert (insert or update if user exists)
        const query = `
      INSERT INTO users (telegram_id, name, profile_photo)
      VALUES ($1, $2, $3)
      ON CONFLICT (telegram_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        profile_photo = EXCLUDED.profile_photo
      RETURNING telegram_id, name, referral_count, profile_photo, claimed_referral_count;
    `;

        const { rows } = await pool.query(query, [telegramId, name, profilePicture]);
        const user = rows[0];

        console.log(`✅ User data: `, user);
        // ✅ Return success
        return res.status(200).json({ user });

    } catch (error) {
        console.error('❌ Error fetching user dashboard:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};