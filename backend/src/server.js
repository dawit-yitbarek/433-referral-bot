import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import withdrawRoutes from './routes/withdrawRoutes.js';
import { WEBAPP_URL } from './config/env.js';
import { handleTelegramUpdate } from './bot/webhookHandler.js';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === WEBAPP_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json())

app.use('/api/user', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/withdrawals', withdrawRoutes);

// Health check
app.get('/health', (req, res) => res.send('OK'));

// Telegram webhook endpoint
app.post('/webhook', handleTelegramUpdate);

export default app;