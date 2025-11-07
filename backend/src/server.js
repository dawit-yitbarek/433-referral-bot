import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import { WEBAPP_URL } from './config/env.js';

const app = express();
app.use((req, res, next) => {
  // Skip logging for Render's health checks
  if (req.url === '/health' || req.url === '/') return next();

  console.log(`[CORS-CHECK] ${req.method} ${req.url} from ${req.headers.origin || 'N/A'}`);
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === WEBAPP_URL) {
      console.log(`✅ Allowed origin: ${origin || 'null (no origin)'}`);
      callback(null, true);
    } else {
      console.warn(`🚫 Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
}));
app.use(express.json())

app.use('/api/user', userRoutes);
app.get('/health', (req, res) => res.send('OK'))

export default app