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
5. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `DATABASE_URL` (required): PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database`

## Architecture

The application uses Next.js instrumentation hooks to initialize the database connection pool at server startup:

- `instrumentation.js` - Initializes database on server start
- `lib/db.js` - Centralized database connection pool management
- Database tables are automatically created on first use