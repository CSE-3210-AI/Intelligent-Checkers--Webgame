"""
board.py – Board representation and initialization.

Board: 8×8 array-of-arrays.  Each cell is:
  None  – empty
  "b"   – blue piece   (moves downward, row++)
  "r"   – red piece    (moves upward,   row--)
  "bk"  – blue king
  "rk"  – red king

Pieces occupy dark squares only: (row + col) % 2 == 1
Blue starts rows 0–2; Red starts rows 5–7.
"""

from __future__ import annotations

import json
from typing import List, Optional

Board = List[List[Optional[str]]]


# ── Initialization ──────────────────────────────────────────────────────

def initializeBoard() -> Board:
    """initializeBoard() – Standard opening position."""
    board: Board = [[None for _ in range(8)] for _ in range(8)]

    # Blue pieces – rows 0-2, dark squares
    for r in range(3):
        for c in range(8):
            if (r + c) % 2 == 1:
                board[r][c] = "b"

    # Red pieces – rows 5-7, dark squares
    for r in range(5, 8):
        for c in range(8):
            if (r + c) % 2 == 1:
                board[r][c] = "r"

    return board


# ── Cloning (critical for AI simulations) ──────────────────────────────

def cloneBoard(board: Board) -> Board:
    """cloneBoard(board) – Shallow-clone each row."""
    return [row[:] for row in board]


# ── Piece counting ──────────────────────────────────────────────────────

def countPieces(board: Board) -> dict[str, int]:
    """countPieces(board) – Returns { blue: n, red: n }."""
    blue = 0
    red = 0
    for r in range(8):
        for c in range(8):
            p = board[r][c]
            if p in ("b", "bk"):
                blue += 1
            elif p in ("r", "rk"):
                red += 1
    return {"blue": blue, "red": red}


# ── Serialization (Supabase JSONB / HTTP transport) ─────────────────────

def serializeBoard(board: Board) -> str:
    """Serialize board to a JSON string."""
    return json.dumps(board)


def deserializeBoard(serialized: str) -> Board:
    """Deserialize board from a JSON string."""
    return json.loads(serialized)
