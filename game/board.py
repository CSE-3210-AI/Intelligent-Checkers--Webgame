"""
Board state representation and preset configurations.

Ported from InitialBoard.jsx, MidGameBoard.jsx, EndGameBoard.jsx,
AnotherGameState.jsx.

Board representation
--------------------
An 8×8 list-of-lists.  Each cell is either ``None`` or a dict::

    {"color": "blue"|"red", "isKing": bool}

Blue pieces start at the top (rows 0-2), red at the bottom (rows 5-7).
Pieces live on dark squares only – where ``(row + col) % 2 == 1``.
"""
from __future__ import annotations
import json


# ── Helpers ───────────────────────────────────────────────────────────

def empty_board() -> list[list]:
    """Return a blank 8×8 board."""
    return [[None for _ in range(8)] for _ in range(8)]


def count_pieces(board) -> dict[str, int]:
    """Count pieces for each colour."""
    counts = {"blue": 0, "red": 0}
    for r in range(8):
        for c in range(8):
            p = board[r][c]
            if p:
                counts[p["color"]] += 1
    return counts


# ── Serialisation (for Supabase JSONB storage) ───────────────────────

def board_to_json(board) -> str:
    return json.dumps(board)


def board_from_json(data: str) -> list[list]:
    return json.loads(data)


# ── Preset board states ──────────────────────────────────────────────

def initial_board() -> list[list]:
    """Standard opening position (same as InitialBoard.jsx)."""
    b = empty_board()
    for r in range(3):
        for c in range(8):
            if (r + c) % 2 == 1:
                b[r][c] = {"color": "blue", "isKing": False}
    for r in range(5, 8):
        for c in range(8):
            if (r + c) % 2 == 1:
                b[r][c] = {"color": "red", "isKing": False}
    return b


def midgame_board() -> list[list]:
    """Matches MidGameBoard.jsx."""
    b = empty_board()
    b[0][1] = {"color": "blue", "isKing": False}
    b[1][0] = {"color": "blue", "isKing": False}
    b[0][5] = {"color": "blue", "isKing": True}
    b[3][2] = {"color": "blue", "isKing": False}
    b[4][5] = {"color": "blue", "isKing": False}
    b[4][7] = {"color": "red", "isKing": False}
    b[5][0] = {"color": "red", "isKing": False}
    b[5][2] = {"color": "red", "isKing": False}
    b[6][7] = {"color": "red", "isKing": False}
    b[7][0] = {"color": "red", "isKing": False}
    return b


def endgame_board() -> list[list]:
    """Matches EndGameBoard.jsx."""
    b = empty_board()
    b[0][1] = {"color": "blue", "isKing": False}
    b[1][0] = {"color": "blue", "isKing": False}
    b[0][5] = {"color": "red", "isKing": False}
    b[3][2] = {"color": "blue", "isKing": False}
    b[4][5] = {"color": "blue", "isKing": False}
    b[4][7] = {"color": "red", "isKing": False}
    b[5][0] = {"color": "red", "isKing": False}
    b[6][7] = {"color": "red", "isKing": False}
    b[7][0] = {"color": "red", "isKing": False}
    return b


def another_board() -> list[list]:
    """Matches AnotherGameState.jsx."""
    b = empty_board()
    b[1][4] = {"color": "red", "isKing": True}
    b[3][2] = {"color": "blue", "isKing": False}
    b[4][5] = {"color": "red", "isKing": False}
    b[4][7] = {"color": "red", "isKing": False}
    b[5][0] = {"color": "red", "isKing": False}
    b[7][0] = {"color": "red", "isKing": False}
    return b
