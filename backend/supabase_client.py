"""
Supabase client initialisation.

Uses the same project URL and anon key that the React app used,
loaded from .env.  Every other service module imports get_client()
from here.
"""
from __future__ import annotations
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY


_client: Client | None = None


def get_client() -> Client:
    """Return a lazily-initialised Supabase client singleton."""
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client
