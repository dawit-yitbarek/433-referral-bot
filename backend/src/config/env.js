import logger from "./logger.js";
import dotenv from "dotenv";
dotenv.config();

// Required environment variables
const requiredEnvVars = [
  'BOT_TOKEN',
  'WEBAPP_URL',
  'BACKEND_URL',
  'DATABASE_URL',
  'PORT',
  'CHANNEL_ID',
  'BOT_USERNAME',
  'REFERRAL_VALUE',
  'WITHDRAW_THRESHOLD'
];

// Validate required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export const {
  BOT_TOKEN,
  WEBAPP_URL,
  BACKEND_URL,
  DATABASE_URL,
  PORT,
  CHANNEL_ID,
  BOT_USERNAME,
  REFERRAL_VALUE,
  WITHDRAW_THRESHOLD,
} = process.env;
