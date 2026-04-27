import logger from "./logger.js";
import type { EnvConfig } from "../types/index.js";
import dotenv from "dotenv";
dotenv.config();

const config: EnvConfig = {
  BOT_TOKEN: process.env.BOT_TOKEN!,
  WEBAPP_URL: process.env.WEBAPP_URL!,
  BACKEND_URL: process.env.BACKEND_URL!,
  DATABASE_URL: process.env.DATABASE_URL!,
  PORT: process.env.PORT!,
  CHANNEL_ID: process.env.CHANNEL_ID!,
  BOT_USERNAME: process.env.BOT_USERNAME!,
  REFERRAL_VALUE: process.env.REFERRAL_VALUE!,
  WITHDRAW_THRESHOLD: process.env.WITHDRAW_THRESHOLD!,
};

const missingVars: string[] = []
Object.entries(config).forEach(([key, value]) => {
  if (!value) {
    missingVars.push(key);
  }
});

if (missingVars.length > 0) {
  const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
  logger.error(errorMsg);
  throw new Error(errorMsg);
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
  WITHDRAW_THRESHOLD
} = config;