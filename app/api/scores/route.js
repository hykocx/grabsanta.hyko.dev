import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Simple in-memory rate limiting (for production, use Redis or a proper rate limiting service)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP

// Rate limiting helper
function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  // Clean up old entries periodically (simple cleanup)
  if (rateLimitMap.size > 1000) {
    for (const [key, requests] of rateLimitMap.entries()) {
      const filtered = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
      if (filtered.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, filtered);
      }
    }
  }
  
  return true;
}

// Get client IP address
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}

// Maximum score limit (reasonable limit for a 30-second game)
const MAX_SCORE = 1000;

// Maximum request body size (1KB)
const MAX_BODY_SIZE = 1024;

// Helper function to get pool and ensure it exists
function getDatabasePool() {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database is not configured. Please set DATABASE_URL environment variable.');
  }
  return pool;
}

// GET: Fetch high scores (supports daily and all-time views)
export async function GET(request) {
  try {
    const pool = getDatabasePool();

    const { searchParams } = new URL(request.url);
    const modeParam = searchParams.get('mode') || 'today';
    
    // Validate mode to prevent injection
    const validModes = ['today', 'all-time', 'daily-winners'];
    const mode = validModes.includes(modeParam) ? modeParam : 'today';

    if (mode === 'daily-winners') {
      // Get the top scorer for each day
      const query = `
        WITH daily_top_scores AS (
          SELECT 
            DATE(created_at AT TIME ZONE 'UTC') as game_date,
            MAX(score) as max_score
          FROM high_scores
          GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ),
        ranked_scores AS (
          SELECT 
            hs.id,
            hs.name,
            hs.score,
            hs.created_at,
            DATE(hs.created_at AT TIME ZONE 'UTC') as game_date,
            ROW_NUMBER() OVER (
              PARTITION BY DATE(hs.created_at AT TIME ZONE 'UTC') 
              ORDER BY hs.score DESC, hs.created_at ASC
            ) as rank
          FROM high_scores hs
          INNER JOIN daily_top_scores dts 
            ON DATE(hs.created_at AT TIME ZONE 'UTC') = dts.game_date 
            AND hs.score = dts.max_score
        )
        SELECT id, name, score, created_at, game_date
        FROM ranked_scores
        WHERE rank = 1
        ORDER BY game_date DESC
        LIMIT 30
      `;

      const result = await pool.query(query);

      return NextResponse.json({
        success: true,
        dailyWinners: result.rows,
      });
    } else if (mode === 'today') {
      // Get today's top 10 scores (based on UTC date)
      const query = `
        SELECT DISTINCT ON (name, score) id, name, score, created_at
        FROM high_scores
        WHERE DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
        ORDER BY name, score DESC, created_at ASC
      `;

      const result = await pool.query(query);

      // Sort by score descending after deduplication and limit to top 10
      const sortedScores = result.rows
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return new Date(a.created_at) - new Date(b.created_at);
        })
        .slice(0, 10);

      return NextResponse.json({
        success: true,
        scores: sortedScores,
      });
    } else {
      // Get all-time top 10 scores
      const query = `
        SELECT DISTINCT ON (name, score) id, name, score, created_at
        FROM high_scores
        ORDER BY name, score DESC, created_at ASC
      `;

      const result = await pool.query(query);

      // Sort by score descending after deduplication and limit to top 10
      const sortedScores = result.rows
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return new Date(a.created_at) - new Date(b.created_at);
        })
        .slice(0, 10);

      return NextResponse.json({
        success: true,
        scores: sortedScores,
      });
    }
  } catch (error) {
    console.error('Error fetching high scores:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch high scores',
      },
      { status: 500 }
    );
  }
}

// POST: Save a new high score
export async function POST(request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Check Content-Length header
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Request body too large' },
        { status: 413 }
      );
    }

    const pool = getDatabasePool();

    // Read and parse body with size limit
    const text = await request.text();
    if (text.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Request body too large' },
        { status: 413 }
      );
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const { name, score } = body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
      return NextResponse.json(
        { success: false, error: `Score must be an integer between 0 and ${MAX_SCORE}` },
        { status: 400 }
      );
    }

    // Sanitize and truncate name to 10 characters
    const sanitizedName = name.trim().slice(0, 10);

    if (sanitizedName.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name cannot be empty' },
        { status: 400 }
      );
    }

    // Insert the new score
    const insertQuery = `
      INSERT INTO high_scores (name, score)
      VALUES ($1, $2)
      RETURNING id, name, score, created_at
    `;

    const result = await pool.query(insertQuery, [sanitizedName, score]);

    return NextResponse.json({
      success: true,
      score: result.rows[0],
    });
  } catch (error) {
    console.error('Error saving high score:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save high score',
      },
      { status: 500 }
    );
  }
}

