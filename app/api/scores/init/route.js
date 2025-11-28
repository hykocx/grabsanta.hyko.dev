import { Pool } from 'pg';
import { NextResponse } from 'next/server';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Simple protection: only allow initialization in development or with a secret token
function isAuthorized(request) {
  // In production, you should use a proper authentication mechanism
  // For now, we'll check for an optional secret token or restrict to development
  const authHeader = request.headers.get('authorization');
  const secretToken = process.env.INIT_SECRET_TOKEN;
  
  // Allow if no secret token is set (development) or if token matches
  if (!secretToken) {
    return process.env.NODE_ENV === 'development';
  }
  
  return authHeader === `Bearer ${secretToken}`;
}

export async function GET(request) {
  // Protect this endpoint in production
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Create the high_scores table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS high_scores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(10) NOT NULL,
        score INTEGER NOT NULL CHECK (score >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
    `;

    await pool.query(createTableQuery);

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully. Table "high_scores" is ready.',
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database',
      },
      { status: 500 }
    );
  }
}

