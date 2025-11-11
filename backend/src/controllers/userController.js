import { Telegraf } from 'telegraf';
import { pool } from '../config/db.js';
import { BOT_TOKEN } from '../config/env.js';
const CHANNEL_ID = '@Sport_433et';

const bot = new Telegraf(BOT_TOKEN);

export const getUserDashboard = async (req, res) => {
    try {
        const { id: telegramId, name } = req.body;
        if (!telegramId) return res.status(400).json({ error: "Missing id" });

        // 1️⃣ Check if user is a member of the Telegram channel
        let hasJoined = false;
        try {
            const member = await bot.telegram.getChatMember(CHANNEL_ID, telegramId);
            const status = member.status;
            hasJoined = ["creator", "administrator", "member"].includes(status);
        } catch (err) {
            console.warn(`⚠️ Failed to verify channel membership for ${telegramId}: ${err.message}`);
        }

        // 2️⃣ Fetch profile picture from Telegram
        let profilePicture = null;
        try {
            const photos = await bot.telegram.getUserProfilePhotos(telegramId, 0, 1);
            if (photos.total_count > 0) {
                const fileId = photos.photos[0][0].file_id;
                const file = await bot.telegram.getFile(fileId);
                profilePicture = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
            }
        } catch (err) {
            console.warn(`⚠️ Could not fetch profile picture for ${telegramId}:, err.message`);
        }

        // 3️⃣ Upsert user (insert or update)
        const userQuery = `
      INSERT INTO users (telegram_id, name, profile_photo)
      VALUES ($1, $2, $3)
      ON CONFLICT (telegram_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        profile_photo = EXCLUDED.profile_photo
      RETURNING id, telegram_id, name, referral_count, profile_photo, claimed_referral_count`;
        ;
        const { rows } = await pool.query(userQuery, [telegramId, name, profilePicture]);
        const user = rows[0];


        // Pending referrals = sum of pending withdrawals
        const pendingResult = await pool.query('SELECT COALESCE(SUM(requested_referrals), 0) AS pending_referrals FROM withdrawal_requests WHERE user_id = $1 AND status = $2', [user.id, 'pending']);
        const pending_referrals = parseInt(pendingResult.rows[0].pending_referrals, 10);

        // Compute unclaimed referrals
        const total_referrals = user.referral_count;
        const claimed_referrals = user.claimed_referral_count;
        const unclaimed_referrals = total_referrals - claimed_referrals - pending_referrals;

        // 4️⃣ Return merged user + referral summary
        const responseUser = {
            id: user.id,
            telegram_id: user.telegram_id,
            name: user.name,
            profile_photo: user.profile_photo,
            total_referrals,
            claimed_referrals,
            unclaimed_referrals,
            hasJoined
        };

        return res.status(200).json({ user: responseUser });
    } catch (error) {
        console.error("❌ Error fetching user dashboard:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};