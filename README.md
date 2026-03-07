# StellarCheckers Desktop Client

This repository contains a Python/Pygame desktop implementation of a
Checkers benchmark application originally built with React & Express.  The
current version uses **pygame** for rendering and **pygame_gui** for structured
UI components, and connects directly to a Supabase backend via
`supabase-py`.

## Features

- 8×8 checkers board with piece movement, captures, and undo/resign
- Two AI agents (Minimax with alpha‑beta pruning and Monte Carlo simulation)
- Multiple game modes and tournament types
- Supabase authentication and profile storage
- Clean architecture separated into `client/`, `backend/`, and `game/`

## Prerequisites

- Python 3.10 or newer
- A virtual environment (`venv`, `conda`, etc.) is recommended

## Setup

1. Clone the repository and navigate into it:

   ```powershell
   cd "E:\Web Dev\Checkers_AI"
   ```

2. Create and activate a virtual environment:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1   # PowerShell
   ```

3. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

   The `requirements.txt` file includes:
   - `pygame` for rendering and input
   - `pygame_gui` for UI widgets and layout
   - `supabase` (supabase-py) for backend API calls
   - `python-dotenv` to load environment variables
   - `requests` for any HTTP needs

4. Create a `.env` file at the project root with your Supabase
   credentials:

   ```text
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=eyJ...  # anon or service role key
   ```

   The project already includes a `.env.example` showing the expected keys.
   **Do not commit** your actual `.env` to version control.

5. Run the game:

   ```powershell
   python main.py
   ```

   A window will open showing the home screen. Use the mouse or keyboard to
   navigate between screens.

## Project Structure

```
├── config.py            # loads .env values
├── main.py              # application entry point & screen manager
├── backend/             # service layer talking to Supabase
├── game/                # checkers logic and AI agents
└── client/              # pygame GUI code (screens & widgets)
```

## Environment variables

Sensitive values such as `SUPABASE_URL` and `SUPABASE_KEY` are read from
`.env` using `python-dotenv`.  This keeps secrets out of the codebase and makes
it easy to switch between different Supabase projects.

## Visual Theme and UI

The UI maintains the original color palette and layout from the React
frontend but now uses `pygame_gui` components arranged in panels and containers
for better alignment, spacing, and consistency.

## Future Work

- Add animations and transitions using `pygame_gui` themes
- Implement online multiplayer using Supabase Realtime or WebSocket API
- Extract common GUI helper functions for form validation and layout

Enjoy benchmarking your AI agents with a polished desktop interface!  