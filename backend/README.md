# How to set up and run the backend (FastAPI)

This backend is migrated 1:1 from Express.js to FastAPI while preserving:

- Route structure (`/api/auth/*`, `/api/game/*`)
- Controller and game logic flow
- Supabase integration behavior
- Request/response contracts used by the frontend

## 1) Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

## 2) Environment variables

Keep the existing `.env` file and values. These are still used:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `PORT` (optional, defaults to `4000`)

## 3) Database setup

Create the users table in Supabase PostgreSQL by running the SQL in [users.sql](users.sql).

Create the match history table by running the SQL in [match_history.sql](match_history.sql).

## 4) Start the server

```bash
uvicorn main:app --host 0.0.0.0 --port 4000 --reload
```

## 5) API Endpoints (unchanged)

- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/game/init`
- `POST /api/game/legal-moves`
- `POST /api/game/move`
- `GET /api/game/state`
- `POST /api/scores/upsert`
- `GET /api/scores?userEmail=...&gameMode=...`

All sensitive credentials are loaded from `.env` and are never exposed to the frontend.
