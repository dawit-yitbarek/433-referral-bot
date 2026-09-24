import { z } from 'zod';
import dotenv from "dotenv";
import logger from './logger.js';

dotenv.config();

const envSchema = z.object({
  BOT_TOKEN: z.string(),
  WEBAPP_URL: z.string(),
  BACKEND_URL: z.string(),
  DATABASE_URL: z.string(),
  PORT: z.string(),
  CHANNEL_USERNAME: z.string(),
  BOT_USERNAME: z.string(),
  REFERRAL_VALUE: z.string(),
  WITHDRAW_THRESHOLD: z.string(),
  ADMIN: z.string(),
  ERROR_RECEIVER_ADMIN_ID: z.string().optional(),
  NODE_ENV: z.string(),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.error('❌ Invalid environment variables:');
    logger.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
};

export const {
  BOT_TOKEN,
  WEBAPP_URL,
  BACKEND_URL,
  DATABASE_URL,
  PORT,
  CHANNEL_USERNAME,
  BOT_USERNAME,
  REFERRAL_VALUE,
  WITHDRAW_THRESHOLD,
  ADMIN,
  ERROR_RECEIVER_ADMIN_ID,
  NODE_ENV
} = parseEnv()