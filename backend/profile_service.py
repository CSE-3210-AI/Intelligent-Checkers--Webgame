"""
Profile service – CRUD on the ``profiles`` table.

Replaces BOTH the old network.py (Express HTTP calls) and the profile
helpers that were in supabase_client.py.  Everything now goes through
supabase-py directly – no Node server required.
"""
from __future__ import annotations
from backend.supabase_client import get_client


def fetch_profile(email: str) -> dict | None:
    """
    Fetch a profile row by email.
    Equivalent to the old ``GET /api/auth/profile?email=…`` Express endpoint.
    """
    res = (
        get_client()
        .table("profiles")
        .select("*")
        .eq("email", email)
        .maybe_single()
        .execute()
    )
    return res.data


def create_profile(user_id: str, email: str, username: str) -> dict | None:
    """
    Insert a new profile row.
    Equivalent to the old ``POST /api/auth/profile`` Express endpoint.
    """
    res = (
        get_client()
        .table("profiles")
        .insert({"id": user_id, "email": email, "username": username})
        .execute()
    )
    return res.data[0] if res.data else None


def upsert_profile(user_id: str, email: str, username: str) -> dict | None:
    """Insert or update a profile row."""
    res = (
        get_client()
        .table("profiles")
        .upsert({"id": user_id, "email": email, "username": username})
        .execute()
    )
    return res.data[0] if res.data else None


def increment_wins(profile_id: str):
    """Increment the win counter for a profile."""
    client = get_client()
    row = (
        client.table("profiles")
        .select("wins")
        .eq("id", profile_id)
        .single()
        .execute()
    )
    current = row.data.get("wins", 0) if row.data else 0
    client.table("profiles").update({"wins": current + 1}).eq("id", profile_id).execute()


def increment_losses(profile_id: str):
    """Increment the loss counter for a profile."""
    client = get_client()
    row = (
        client.table("profiles")
        .select("losses")
        .eq("id", profile_id)
        .single()
        .execute()
    )
    current = row.data.get("losses", 0) if row.data else 0
    client.table("profiles").update({"losses": current + 1}).eq("id", profile_id).execute()
