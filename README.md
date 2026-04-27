# Geld Earn Referral Bot

A full Telegram referral ecosystem consisting of a Telegram Bot, Telegram Mini App, Admin Panel, and PostgreSQL backend.
This system supports referral tracking, anti-fraud checks, leaderboard, user profiles, withdrawal requests, and a complete admin interface.

## 🚀 Features

### User Features
- Join the bot → open the Mini App
- Unique referral links
- Real-time balance and points
- Leaderboard
- Claiming referral rewards
- Withdraw earnings when reaching the threshold

### Admin Features
- View all users and statistics
- Approve withdrawal requests
- Assign requests to admins
- Track system performance
- Super admin with elevated permissions
- Broadcast messages to all users

### 📁 Project Structure
```
433-referral-bot/
├── backend/           # Express + PostgreSQL + TypeScript API
│   └── src/
│       ├── bot/      # Telegram Bot (Telegraf)
│       ├── config/   # Database, env, logger
│       ├── controllers/
│       ├── routes/
│       ├── cron/     # Scheduled jobs
│       ├── scripts/  # Utility scripts
│       └── types/    # TypeScript interfaces
│
└── mini-app/         # React + Vite + TypeScript + Tailwind v4
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        └── types/
```

### 🛠️ Tech Stack

#### Backend
- Node.js
- TypeScript
- Express.js
- PostgreSQL (pg)
- Telegraf (Telegram Bot API)
- Winston (logging)
- node-cron (scheduled tasks)

#### Frontend (Mini App)
- React 19 (Vite)
- TypeScript
- Tailwind CSS v4
- Telegram WebApp library
- Framer Motion
- Axios

### 🗄️ Database Schema

```sql
-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255),
    username VARCHAR(255),
    profile_photo TEXT,
    referred_by BIGINT,
    joined_telegram BOOLEAN DEFAULT false,
    claimed_referral_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE
);

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    requested_referrals INTEGER NOT NULL,
    requested_amount DECIMAL(10,2) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    bank_account VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    assigned_to VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);
```

## Table of Contents
- [🚀 Live Demo](#-live-demo)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Development Setup](#development-setup)
- [Running](#running-production)
- [Deployment Notes](#deployment-notes)

## Prerequisites
- Node.js 18+
- PostgreSQL instance (local or hosted)
- A Telegram Bot token and Bot username

## Environment Variables

Create `.env` file in `backend/` folder:

```env
BOT_TOKEN=your_telegram_bot_token
WEBAPP_URL=https://your-webapp-url.example
BACKEND_URL=https://your-backend-url.example
DATABASE_URL=postgres://user:pass@host:5432/dbname
CHANNEL_ID=@your_channel_username
BOT_USERNAME=your_bot_username
REFERRAL_VALUE=5
WITHDRAW_THRESHOLD=500
PORT=3000
```

Create `.env` file in `mini-app/` folder:

```env
VITE_BACKEND_URL=https://your-backend-url.example
VITE_FRONTEND_URL=https://your-webapp-url.example
VITE_WITHDRAW_THRESHOLD=500
VITE_REFERRAL_POINT=5
VITE_BOT_USERNAME=your_bot_username
VITE_CHANNEL_USERNAME=your_channel_username
VITE_SUPER_ADMIN=your_username(comma separated if more than 1 superadmins)
```

## Development Setup

### Backend
```powershell
cd backend
npm install
npm run dev
```

### Mini App
```powershell
cd mini-app
npm install
npm run dev
```

## Running (Production)

### Backend
```powershell
cd backend
npm run build
npm start
```

### Mini App
```powershell
cd mini-app
npm run build
```

## Deployment Notes
- Configure `WEBAPP_URL`, `BACKEND_URL`, and `BOT_TOKEN` correctly for production
- If deploying the bot as a webhook, ensure your backend is reachable over HTTPS
- The bot webhook is set automatically at `{BACKEND_URL}/webhook`
- A daily cron job runs at 3:00 AM (Africa/Addis_Ababa timezone) to validate referral channel membership

## Bot Commands
- `/start` - Start the bot and get referral link
- `/start {user_id}` - Join using someone's referral link

## API Endpoints
- `POST /api/user/sync` - Sync user data
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/withdrawals` - Get withdrawal history
- `POST /api/withdrawals` - Create withdrawal request
- `GET /api/admin` - Admin endpoints
- `POST /webhook` - Telegram webhook

## 🚀 Live Demo

You can test the production version of the Geld Earn Referral Bot directly on Telegram:

[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-blue?style=for-the-badge&logo=telegram)](https://t.me/Geldearn_Bot?start=6867085646)

**Link:** [t.me/Geldearn_Bot](https://t.me/Geldearn_Bot?start=6867085646)
