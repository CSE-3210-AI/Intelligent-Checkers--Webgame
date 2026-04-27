from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from postgrest.exceptions import APIError
from starlette.concurrency import run_in_threadpool

from config.supabase import supabase_admin

_FALLBACK_PATH = Path(__file__).resolve().parents[1] / "data" / "match_history_fallback.json"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_fallback_rows() -> list[dict[str, Any]]:
    if not _FALLBACK_PATH.exists():
        return []
    try:
        content = _FALLBACK_PATH.read_text(encoding="utf-8")
        parsed = json.loads(content)
        if isinstance(parsed, list):
            return [row for row in parsed if isinstance(row, dict)]
    except Exception:
        return []
    return []


def _save_fallback_rows(rows: list[dict[str, Any]]) -> None:
    _FALLBACK_PATH.parent.mkdir(parents=True, exist_ok=True)
    _FALLBACK_PATH.write_text(json.dumps(rows, ensure_ascii=True, indent=2), encoding="utf-8")


def _upsert_fallback_row(
    *,
    user_email: str,
    matchup_key: str,
    player1: str,
    player2: str,
    player1_wins: int,
    player2_wins: int,
    draws: int,
    game_mode: Optional[str],
) -> dict[str, Any]:
    rows = _load_fallback_rows()
    now = _utc_now_iso()
    existing_index = next(
        (
            idx
            for idx, row in enumerate(rows)
            if row.get("user_email") == user_email and row.get("matchup_key") == matchup_key
        ),
        None,
    )

    if existing_index is None:
        record = {
            "user_email": user_email,
            "matchup_key": matchup_key,
            "player1": player1,
            "player2": player2,
            "player1_wins": int(player1_wins),
            "player2_wins": int(player2_wins),
            "draws": int(draws),
            "game_mode": game_mode,
            "last_played": now,
        }
        rows.append(record)
        _save_fallback_rows(rows)
        return record

    existing = rows[existing_index]
    existing["player1"] = player1
    existing["player2"] = player2
    existing["player1_wins"] = int(existing.get("player1_wins", 0)) + int(player1_wins)
    existing["player2_wins"] = int(existing.get("player2_wins", 0)) + int(player2_wins)
    existing["draws"] = int(existing.get("draws", 0)) + int(draws)
    existing["game_mode"] = game_mode
    existing["last_played"] = now
    rows[existing_index] = existing
    _save_fallback_rows(rows)
    return existing


def _list_fallback_rows(*, user_email: str, game_mode: Optional[str]) -> list[dict[str, Any]]:
    rows = _load_fallback_rows()
    filtered = [
        row
        for row in rows
        if row.get("user_email") == user_email and (not game_mode or row.get("game_mode") == game_mode)
    ]
    return sorted(filtered, key=lambda row: str(row.get("last_played", "")), reverse=True)


async def upsert_match_history(
    *,
    user_email: str,
    matchup_key: str,
    player1: str,
    player2: str,
    player1_wins: int,
    player2_wins: int,
    draws: int,
    game_mode: Optional[str],
):
    try:
        existing_resp = await run_in_threadpool(
            lambda: supabase_admin.table("match_history")
            .select(
                "user_email,matchup_key,player1,player2,player1_wins,player2_wins,draws,game_mode,last_played"
            )
            .eq("user_email", user_email)
            .eq("matchup_key", matchup_key)
            .limit(1)
            .execute()
        )
    except APIError as exc:
        if getattr(exc, "code", None) == "PGRST205":
            return _upsert_fallback_row(
                user_email=user_email,
                matchup_key=matchup_key,
                player1=player1,
                player2=player2,
                player1_wins=player1_wins,
                player2_wins=player2_wins,
                draws=draws,
                game_mode=game_mode,
            )
        raise
    existing_rows = (existing_resp.data or []) if hasattr(existing_resp, "data") else []
    existing = existing_rows[0] if existing_rows else None

    if existing:
        payload = {
            "player1": player1,
            "player2": player2,
            "player1_wins": int(existing.get("player1_wins", 0)) + int(player1_wins),
            "player2_wins": int(existing.get("player2_wins", 0)) + int(player2_wins),
            "draws": int(existing.get("draws", 0)) + int(draws),
            "game_mode": game_mode,
            "last_played": _utc_now_iso(),
        }
        update_resp = await run_in_threadpool(
            lambda: supabase_admin.table("match_history")
            .update(payload)
            .eq("user_email", user_email)
            .eq("matchup_key", matchup_key)
            .execute()
        )
        rows = (update_resp.data or []) if hasattr(update_resp, "data") else []
        return rows[0] if rows else None

    insert_payload = {
        "user_email": user_email,
        "matchup_key": matchup_key,
        "player1": player1,
        "player2": player2,
        "player1_wins": player1_wins,
        "player2_wins": player2_wins,
        "draws": draws,
        "game_mode": game_mode,
        "last_played": _utc_now_iso(),
    }
    insert_resp = await run_in_threadpool(
        lambda: supabase_admin.table("match_history").insert(insert_payload).execute()
    )
    rows = (insert_resp.data or []) if hasattr(insert_resp, "data") else []
    return rows[0] if rows else None


async def list_match_history(*, user_email: str, game_mode: Optional[str] = None):
    def _fetch():
        query = (
            supabase_admin.table("match_history")
            .select(
                "user_email,matchup_key,player1,player2,player1_wins,player2_wins,draws,game_mode,last_played"
            )
            .eq("user_email", user_email)
        )
        if game_mode:
            query = query.eq("game_mode", game_mode)
        return query.order("last_played", desc=True).execute()

    try:
        response = await run_in_threadpool(_fetch)
    except APIError as exc:
        if getattr(exc, "code", None) == "PGRST205":
            return _list_fallback_rows(user_email=user_email, game_mode=game_mode)
        raise
    return (response.data or []) if hasattr(response, "data") else []
