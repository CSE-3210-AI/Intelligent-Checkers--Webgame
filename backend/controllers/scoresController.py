from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field, ValidationError

from models.matchHistoryModel import list_match_history, upsert_match_history


class ScoreUpsertRequest(BaseModel):
    userEmail: EmailStr
    player1: str = Field(min_length=1)
    player2: str = Field(min_length=1)
    winner: Optional[str] = None
    gameMode: Optional[str] = None


def _normalize_name(name: str) -> str:
    return " ".join(str(name).strip().lower().split())


def _canonicalize_matchup(player1: str, player2: str, winner: Optional[str]):
    p1_norm = _normalize_name(player1)
    p2_norm = _normalize_name(player2)

    winner_key = str(winner or "draw").lower()
    if winner_key in ("blue", "player1", "p1"):
        winner_key = "player1"
    elif winner_key in ("red", "player2", "p2"):
        winner_key = "player2"
    else:
        winner_key = "draw"

    if p1_norm <= p2_norm:
        matchup_key = f"{p1_norm}__vs__{p2_norm}"
        return matchup_key, player1, player2, winner_key

    matchup_key = f"{p2_norm}__vs__{p1_norm}"
    swapped_winner = "draw"
    if winner_key == "player1":
        swapped_winner = "player2"
    elif winner_key == "player2":
        swapped_winner = "player1"

    return matchup_key, player2, player1, swapped_winner


def _winner_to_increments(winner_key: str):
    if winner_key == "player1":
        return 1, 0, 0
    if winner_key == "player2":
        return 0, 1, 0
    return 0, 0, 1


def _shape_match(match: dict[str, Any] | None):
    if not match:
        return None
    p1_wins = int(match.get("player1_wins", 0))
    p2_wins = int(match.get("player2_wins", 0))
    draws = int(match.get("draws", 0))
    return {
        **match,
        "wins_player1": p1_wins,
        "wins_player2": p2_wins,
        "draws": draws,
    }


async def upsert_score(payload: ScoreUpsertRequest | dict[str, Any] | None = None):
    if payload is None:
        return {"error": "Invalid payload"}, 400

    if not isinstance(payload, ScoreUpsertRequest):
        try:
            payload = ScoreUpsertRequest.model_validate(payload)
        except ValidationError as exc:
            return {"error": "Invalid payload", "details": exc.errors()}, 400

    matchup_key, canonical_p1, canonical_p2, winner_key = _canonicalize_matchup(
        payload.player1,
        payload.player2,
        payload.winner,
    )

    inc1, inc2, draws = _winner_to_increments(winner_key)

    result = await upsert_match_history(
        user_email=str(payload.userEmail),
        matchup_key=matchup_key,
        player1=canonical_p1,
        player2=canonical_p2,
        player1_wins=inc1,
        player2_wins=inc2,
        draws=draws,
        game_mode=payload.gameMode,
    )

    return {"match": _shape_match(result)}


async def list_scores(user_email: str, game_mode: Optional[str] = None):
    if not user_email:
        return {"error": "userEmail is required"}, 400

    rows = await list_match_history(user_email=user_email, game_mode=game_mode)
    return {"matches": [_shape_match(row) for row in rows]}
