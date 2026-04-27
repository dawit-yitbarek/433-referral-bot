import pkg from 'pg';
import { DATABASE_URL } from './env.js';
import logger from './logger.js';

const { Pool } = pkg
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('127.0.0.1') || DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false }
});

// Handle pool errors
pool.on('error', (err, _client) => {
  logger.error(`Unexpected error on idle client: ${err.message || err}`);
});