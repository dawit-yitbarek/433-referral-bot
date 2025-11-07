import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import { WEBAPP_URL } from './config/env.js';
console.log(`webapp url ${WEBAPP_URL}`)

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
app.get('/health', (req, res) => res.send('OK'))

export default app