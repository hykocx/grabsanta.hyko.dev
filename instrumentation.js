export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize database connection pool when server starts
    const { initializeDatabase } = await import('./lib/db');
    await initializeDatabase();
  }
}

