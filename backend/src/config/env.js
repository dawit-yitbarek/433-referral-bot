import dotenv from "dotenv";
dotenv.config();

export const {
  BOT_TOKEN,
  WEBAPP_URL,
  DATABASE_URL,
  PORT
} = process.env;
