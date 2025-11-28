import { NextResponse } from 'next/server';
import { initializeDatabase, getPool } from '@/lib/db';

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
    // Use the centralized initialization function
    await initializeDatabase();
    
    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database is not configured. Please set DATABASE_URL environment variable.',
        },
        { status: 500 }
      );
    }

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

