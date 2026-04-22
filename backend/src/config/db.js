import pkg from 'pg';
import { DATABASE_URL } from './env.js';
import logger from './logger.js';

const { Pool } = pkg
export const pool = new Pool({ connectionString: DATABASE_URL })

// Handle pool errors
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client:', err.message || err);
});