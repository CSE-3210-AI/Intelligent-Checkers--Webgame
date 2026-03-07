"""
Authentication service – sign-in, sign-up, sign-out.

Talks directly to Supabase Auth (no Express middleman).
Mirrors the auth calls that were in SignIn.jsx / SignUp.jsx.
"""
from __future__ import annotations
from backend.supabase_client import get_client


def sign_in(email: str, password: str) -> dict:
    """
    Sign in via Supabase Auth.
    Returns {"user": <UserObj>, "session": <SessionObj>} on success.
    Raises RuntimeError on failure.
    """
    client = get_client()
    res = client.auth.sign_in_with_password(
        {"email": email, "password": password}
    )
    if not res.user:
        raise RuntimeError("Invalid credentials")
    return {"user": res.user, "session": res.session}


def sign_up(email: str, password: str, username: str) -> dict:
    """
    Create a new Supabase Auth user.
    Returns {"user": <UserObj>, "session": <SessionObj>}.
    Raises RuntimeError on failure.
    """
    client = get_client()
    res = client.auth.sign_up({
        "email": email,
        "password": password,
        "options": {"data": {"username": username}},
    })
    if not res.user:
        raise RuntimeError("Sign-up failed")
    return {"user": res.user, "session": res.session}


def sign_out():
    """Sign the current user out."""
    get_client().auth.sign_out()
