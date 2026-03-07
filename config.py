"""
Application-wide configuration – loads .env and exposes constants.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Supabase (same project the React app used) ───────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# ── Window ────────────────────────────────────────────────────────────
WINDOW_WIDTH = 1280
WINDOW_HEIGHT = 800
FPS = 60
APP_TITLE = "StellarCheckers"
