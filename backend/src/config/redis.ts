import { Redis } from 'ioredis';
import { REDIS_URL } from './env.js';
import logger from './logger.js';
import { notifyAdminError } from '../utils/notifyAdminError.js';

const redisOptions = {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => Math.min(times * 100, 3000),
};

export const redis = REDIS_URL.startsWith('/')
    ? new Redis({ path: REDIS_URL, ...redisOptions })
    : new Redis(REDIS_URL, redisOptions);

redis.on("ready", () => {
    logger.info('✅ Redis Client Connected and Ready!');
})


redis.on("error", (err) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`❌ Redis Client Error: ${errorMessage}`);
    notifyAdminError(errorMessage, "Redis error")
})