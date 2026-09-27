import path from "node:path";
import logger from "../config/logger.js";
import { notifyAdminError } from "./notifyAdminError.js";
import { BOT_TOKEN } from "../config/env.js";

export async function getUserAvatarBuffer(telegramId: number): Promise<{ data: Buffer; contentType: string } | null> {
    try {
        // 1. Fetch latest profile photo file_id from Telegram
        const photosRes = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos?user_id=${telegramId}&limit=1`
        );
        const photosData: any = await photosRes.json();

        if (!photosData.ok || photosData.result.total_count === 0) {
            return null;
        }

        // Grab medium/high res photo (last element in array)
        const photos = photosData.result.photos[0];
        const fileId = photos[photos.length - 1].file_id;

        // Resolve Telegram file path
        const fileRes = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
        );
        const fileData: any = await fileRes.json();

        if (!fileData.ok) return null;

        // Download image directly from Telegram CDN as an ArrayBuffer
        const filePath = fileData.result.file_path;
        const imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        const imageRes = await fetch(imageUrl);

        if (!imageRes.ok) return null;

        const arrayBuffer = await imageRes.arrayBuffer();

        // Return raw Buffer directly
        return {
            data: Buffer.from(arrayBuffer),
            contentType: getContentType(filePath),
        };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to fetch avatar for ${telegramId}: ${errorMessage}`);
        notifyAdminError(errorMessage, "user image fetcher");
        return null;
    }
}


function getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".png":
            return "image/png";
        case ".webp":
            return "image/webp";
        case ".gif":
            return "image/gif";
        default:
            return "application/octet-stream";
    }
}