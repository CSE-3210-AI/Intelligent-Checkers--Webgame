# How to set up and run the backend

1. Install dependencies:
   cd backend
   npm install

2. Set up environment variables:
   - Edit `.env` with your Supabase PostgreSQL connection string (already set).

3. Create the users table in your Supabase database:
   - Run the SQL in `users.sql` on your Supabase PostgreSQL instance.

4. Start the server:
   npm run dev

5. API Endpoints:
   - POST /api/auth/signup
   - POST /api/auth/signin

All sensitive credentials are loaded from `.env` and never exposed to the frontend.
