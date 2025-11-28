# grabsanta.hyko.dev

A festive Santa catching game made with Next.js and Tailwind CSS, featuring an arcade-style high score system.

![screenshot](/.github/assets/screenshot.png)

## Features

- 🎅 Interactive Santa catching game with 30-second timer
- 🎯 Score tracking with combo system
- 👻 Avoid bad emojis that decrease your score
- 🏆 Arcade-style high score system with leaderboard
- 💾 PostgreSQL database for persistent scores
- ❄️ Beautiful Christmas-themed effects

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your database:
   ```bash
   cp .env.example .env
   ```
4. Set the following environment variables:
   - `DATABASE_URL`: PostgreSQL connection string (required)
   - `INIT_SECRET_TOKEN`: Optional secret token for database initialization endpoint (recommended for production)
5. Initialize the database (optional, tables are created automatically):
   ```bash
   curl http://localhost:3000/api/scores/init
   ```
6. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `DATABASE_URL` (required): PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database`
- `INIT_SECRET_TOKEN` (optional): Secret token for protecting the database initialization endpoint
  - If set, the `/api/scores/init` endpoint requires `Authorization: Bearer <token>` header
  - If not set, the endpoint is only available in development mode

## Architecture

The application uses Next.js instrumentation hooks to initialize the database connection pool at server startup:

- `instrumentation.js` - Initializes database on server start
- `lib/db.js` - Centralized database connection pool management
- Database tables are automatically created on first use

## Security Features

- ✅ Rate limiting on POST requests (10 requests per minute per IP)
- ✅ Input validation and sanitization
- ✅ SQL injection protection via parameterized queries
- ✅ Request body size limits
- ✅ Score validation with maximum limit
- ✅ Protected database initialization endpoint
- ✅ Error message sanitization (no sensitive details exposed)
- ✅ Centralized database connection pool management