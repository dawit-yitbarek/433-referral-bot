import app from './server.js';
import './bot/bot.js';
import { PORT } from './config/env.js';

app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`))