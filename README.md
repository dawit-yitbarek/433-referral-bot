# 433-Referral-Bot

A full Telegram referral ecosystem consisting of a Telegram Bot, Telegram Mini App, Admin Panel, and PostgreSQL backend.
This system supports referral tracking, anti-fraud checks, leaderboard, user profiles, withdrawal requests, and a complete admin interface.

## 🚀 Features
User Features

Join the bot → open the Mini App

Unique referral links

Anti-fraud validation for referrals

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

Users
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    username TEXT,
    referred_by BIGINT,
    joined_telegram BOOLEAN DEFAULT FALSE,
    referral_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name TEXT,
    profile_photo TEXT,
    claimed_referral_count INTEGER DEFAULT 0
);

Withdrawal Requests
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    requested_referrals INTEGER NOT NULL,
    requested_amount NUMERIC(12,2),
    bank_name VARCHAR(50) NOT NULL,
    phone VARCHAR(30),
    admin_id INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    bank_account TEXT NOT NULL,
    name VARCHAR(100),
    assigned_to VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE
);

### ⚙️ Environment Variables

Backend (/backend/.env)
BOT_TOKEN = Telegram Bot Token
WEBAPP_URL = Frontend Mini App URL
BACKEND_URL	= Backend API URL
DATABASE_URL = PostgreSQL connection
CHANNEL_ID = Channel username to verify joins
BOT_USERNAME = Bot username
REFERRAL_VALUE = Birr amount per referral
PORT = Backend server port


Frontend (/frontend/.env)
VITE_BACKEND_URL = Backend API URL
VITE_FRONTEND_URL = WebApp URL
VITE_ADMIN_USERNAME	= Super admin username
VITE_WITHDRAW_THRESHOLD	= Minimum birr required to withdraw
VITE_REFERRAL_POINT= Birr reward per referral


### 🧪 Installation & Setup
Backend
cd backend
npm install
npm install -g nodemon
nodemon src/index.js

Frontend
cd frontend
npm install
npm run dev

### 🌐 Deployment

### Bot is live on Telegram:
### https://t.me/Geldearn_Bot?start=6867085646