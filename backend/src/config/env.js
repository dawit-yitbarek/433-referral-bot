import dotenv from "dotenv";
dotenv.config();

export const {
  BOT_TOKEN,
  WEBAPP_URL,
  BACKEND_URL,
  DATABASE_URL,
  PORT,
  ADMINS,
} = process.env;
