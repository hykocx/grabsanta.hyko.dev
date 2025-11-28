import { Pool } from 'pg';

let pool = null;
let tableInitialized = false;

/**
 * Initialize the PostgreSQL connection pool
 */
export function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

/**
 * Initialize database tables and indexes
 */
export async function initializeDatabase() {
  const dbPool = getPool();
  
  if (!dbPool) {
    console.warn('⚠️  DATABASE_URL is not set. Database features will be disabled.');
    return;
  }

  if (tableInitialized) {
    return;
  }

  try {
    // Create table first
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS high_scores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(10) NOT NULL,
        score INTEGER NOT NULL CHECK (score >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await dbPool.query(createTableQuery);

    // Create index separately to avoid conflicts
    try {
      const createIndexQuery = `
        CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
      `;
      await dbPool.query(createIndexQuery);
    } catch (indexError) {
      // Index might already exist, which is fine
      if (indexError.code !== '42P07' && indexError.code !== '23505') {
        console.warn('Warning creating index (may already exist):', indexError.message);
      }
    }

    tableInitialized = true;
    console.log('✅ Database initialized successfully');
  } catch (error) {
    // If table already exists, that's fine
    if (error.code === '42P07' || error.code === '23505') {
      tableInitialized = true;
      console.log('✅ Database table already exists');
      return;
    }
    
    console.error('❌ Error initializing database:', error.message);
    // Don't throw - let the app continue, but database features won't work
  }
}

/**
 * Close the database connection pool (useful for cleanup)
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    tableInitialized = false;
  }
}

