import type { RequestHandler } from "express";
import { redis } from "../config/redis.js";
import { getUserAvatarBuffer } from "../utils/getUserAvatarBuffer.js";
import logger from "../config/logger.js";
import { notifyAdminError } from "../utils/notifyAdminError.js";


export const provideImage: RequestHandler = async (req, res) => {
    const telegramId = Number(req.query.telegram_id);
    const cacheKey = `telegram:avatar:${telegramId}`;

    try {
        if (!telegramId) {
            return res.status(400).json({ error: 'Missing telegram id' });
        }

        // 1. Check Redis for cached raw binary Buffer
        const [buffer, contentType] = await Promise.all([
            await redis.hgetBuffer(cacheKey, "data"),
            await redis.hget(cacheKey, "contentType")
        ])

        if (buffer) {
            const remainingTtl = await redis.ttl(cacheKey);
            res.setHeader('Content-Type', contentType || 'image/jpeg');
            res.setHeader('Cache-Control', `public, max-age=${Math.max(remainingTtl, 0)}`);
            return res.send(buffer);
        }

        // 2. Cache Miss: Download binary buffer from Telegram
        const avatarBuffer = await getUserAvatarBuffer(telegramId);

        if (!avatarBuffer) {
            return res.status(404).json({ error: 'Avatar not found or private' });
        }

        // 3. Cache binary Buffer in Redis for 24 hours (86,400 seconds)
        const ttl = 86400
        await redis.hset(cacheKey, avatarBuffer)
        await redis.expire(cacheKey, ttl);


        // 4. Return raw binary response to browser
        res.setHeader('Content-Type', avatarBuffer.contentType);
        res.setHeader('Cache-Control', `public, max-age=${Math.max(ttl, 0)}`);
        return res.send(avatarBuffer.data);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to provide image: ${errorMessage}`);
        notifyAdminError(errorMessage, "Image provider")
        return res.status(500).send('Internal Server Error');
    }
};