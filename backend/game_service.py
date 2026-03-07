"""
Game persistence service – save / load / update game rows in the
``games`` table via Supabase.
"""
from __future__ import annotations
from backend.supabase_client import get_client


def save_game(game_data: dict) -> dict | None:
    """Insert a new game row (board state stored as JSONB)."""
    res = get_client().table("games").insert(game_data).execute()
    return res.data[0] if res.data else None


def update_game(game_id: str, updates: dict):
    """Patch an existing game row."""
    get_client().table("games").update(updates).eq("id", game_id).execute()


def load_game(game_id: str) -> dict | None:
    """Fetch a single game row by id."""
    res = (
        get_client()
        .table("games")
        .select("*")
        .eq("id", game_id)
        .maybe_single()
        .execute()
    )
    return res.data
