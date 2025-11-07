import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import { WEBAPP_URL } from './config/env.js';

const app = express()
app.use(cors({
  origin: "*",
}));

app.use(express.json())

app.use('/api/user', userRoutes);
app.get('/health', (req, res) => res.send('OK'))

export default app