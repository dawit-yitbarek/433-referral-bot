# 433-Referral-Bot

A full Telegram referral ecosystem consisting of a Telegram Bot, Telegram Mini App, Admin Panel, and PostgreSQL backend.
This system supports referral tracking, anti-fraud checks, leaderboard, user profiles, withdrawal requests, and a complete admin interface.

## 🚀 Features
User Features

Join the bot → open the Mini App

Unique referral links

Real-time balance and points

Leaderboard

Claiming referral rewards

Withdraw earnings when reaching the threshold

Admin Features

View all users and statistics

Approve withdrawal requests

Assign requests to admins

Track system performance

Super admin with elevated permissions

Property listing CRUD support

### 📁 Project Structure
433-referral-bot/
│
├── backend/      # Express + PostgreSQL API
│   └── src/
│
└── frontend/     # Telegram WebApp (React + Vite)
    └── src/

### 🛠️ Tech Stack
Backend

Node.js

Express.js

PostgreSQL

pg

Telegraf (Telegram Bot API)

Nodemon (dev)

Frontend

React (Vite)

Tailwind CSS

Telegram WebApp library

### 🗄️ Database Schema
Admins
CREATE TABLE IF NOT EXISTS public.admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE
);

## 433 Referral Bot

A complete Telegram referral system: a Telegram Bot, a Telegram Mini App (frontend), an Express/PostgreSQL backend, and an admin interface for managing users and withdrawals.

## Table of Contents
- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Development Setup](#development-setup)
- [Running](#running)
- [Database](#database)
- [Deployment Notes](#deployment-notes)
- [Contributing](#contributing)
- [License](#license)

## About

This repository implements a referral ecosystem that tracks referrals, prevents fraud (basic checks), exposes a leaderboard, manages withdrawals, and provides an admin interface to review and process requests.

## Features

- User flows: referral links, mini-app onboarding, real-time balances and points
- Leaderboard to surface top referrers
- Withdrawal requests with admin approval workflow
- Admin and Super Admin roles for managing users and requests
- PostgreSQL persistence with clear data models

## Tech Stack

- Backend: Node.js, Express
- Bot: Telegraf (Telegram Bot API)
- Database: PostgreSQL (`pg`)
- Frontend (Mini App): React + Vite, Tailwind CSS

## Project Structure

Root layout (important folders):

```
backend/        # Express backend, bot and controllers
mini-app/       # React + Vite Telegram Mini App (frontend)
README.md
```

Key backend files:

- `backend/src/index.js` - server entry
- `backend/src/server.js` - express app setup
- `backend/src/bot/bot.js` - Telegraf bot logic
- `backend/src/bot/webhookHandler.js` - webhook handling
- `backend/src/config/` - `db.js`, `env.js` for configuration
- `backend/src/controllers/` - route handlers (users, admin, withdrawals, leaderboard)
- `backend/src/routes/` - routing for API endpoints

Frontend (mini-app) key files:

- `mini-app/src/main.jsx` - app bootstrapping
- `mini-app/src/App.jsx` - main React app
- `mini-app/src/components/` - UI components

## Prerequisites

- Node.js 18+ and `npm`
- PostgreSQL instance (local or hosted)
- A Telegram Bot token and a Telegram Bot username

## Environment Variables

Create `.env` files in the `backend/` and `mini-app/` folders. Example keys:

backend/.env (example)

```
BOT_TOKEN=your_telegram_bot_token
WEBAPP_URL=https://your-webapp-url.example
BACKEND_URL=https://your-backend-url.example
DATABASE_URL=postgres://user:pass@host:5432/dbname
CHANNEL_ID=@your_channel_username
BOT_USERNAME=your_bot_username
REFERRAL_VALUE=5
PORT=3000
```

mini-app/.env (example)

```
VITE_BACKEND_URL=https://your-backend-url.example
VITE_FRONTEND_URL=https://your-webapp-url.example
VITE_ADMIN_USERNAME=superadmin
VITE_WITHDRAW_THRESHOLD=50
VITE_REFERRAL_POINT=5
```

Make sure to never commit real secret tokens to the repository.

## Development Setup

Backend (development)

```powershell
cd backend
npm install
npm run dev   # or `nodemon src/index.js` if configured
```

Mini App (development)

```powershell
cd mini-app
npm install
npm run dev
```

Notes:

- The backend exposes API endpoints used by the mini-app and the bot. Check `backend/src/routes/` for available routes.
- The bot uses `Telegraf`; depending on deployment you may run it via long polling or using webhooks configured in `bot/webhookHandler.js`.

## Running (Production)

- Build the mini-app: `cd mini-app && npm run build`
- Start the backend server with a process manager (PM2) or containerization:

```powershell
cd backend
NODE_ENV=production node src/index.js
```

Configure webhook URL for Telegram bot to point to your backend endpoint if using webhooks.

## Database

This project uses PostgreSQL. SQL schema snippets exist in the repo (users, admins, withdrawal_requests). Ensure your `DATABASE_URL` points to a database where migrations or initialization scripts have run.

Example table names:

- `users`
- `admins`
- `withdrawal_requests`

If you want, I can add migration scripts (e.g., using `node-pg-migrate` or `knex`).

## Deployment Notes

- Configure `WEBAPP_URL`, `BACKEND_URL`, and `BOT_TOKEN` correctly for production.
- If deploying the bot as a webhook, ensure your backend is reachable over HTTPS and the webhook is registered with Telegram.
- Use environment-specific config for things like referral reward values and withdraw thresholds.


```
https://t.me/Geldearn_Bot?start=6867085646
```
