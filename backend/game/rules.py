"""
rules.py – Pure rule helpers: piece properties, promotion, turn switching,
           and board evaluation.
"""

from __future__ import annotations

from game.board import cloneBoard


# ── Piece helpers ────────────────────────────────────────────────────────

def getColor(piece: str | None) -> str | None:
    """Return the owning player ("blue" | "red") for a piece, or None."""
    if not piece:
        return None
    return "blue" if piece[0] == "b" else "red"


def isKing(piece: str | None) -> bool:
    """True when the piece is a king."""
    return piece in ("bk", "rk")


def isPiece(piece: str | None, player: str) -> bool:
    """True when the piece at a square belongs to player."""
    if not piece:
        return False
    return (piece in ("b", "bk")) if player == "blue" else (piece in ("r", "rk"))


def getMoveDirs(piece: str | None) -> list[list[int]]:
    """Diagonal movement directions for the piece."""
    if not piece:
        return []
    if piece in ("bk", "rk"):
        return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    if piece == "b":
        return [[1, -1], [1, 1]]
    return [[-1, -1], [-1, 1]]


PROMOTION_ROW = {"blue": 7, "red": 0}


# ── King promotion ────────────────────────────────────────────────────────

def promoteToKing(board):
    """promoteToKing(board) – Crown pieces that reach back row."""
    b = cloneBoard(board)
    for c in range(8):
        if b[7][c] == "b":
            b[7][c] = "bk"
        if b[0][c] == "r":
            b[0][c] = "rk"
    return b


# ── Turn switching ────────────────────────────────────────────────────────

def switchTurn(currentPlayer: str) -> str:
    """Return the opponent of currentPlayer."""
    return "red" if currentPlayer == "blue" else "blue"


# ── Board evaluation (for Minimax / Monte Carlo AI) ──────────────────────

def evaluateBoard(board) -> float:
    """Static heuristic evaluation from blue's perspective."""
    score = 0.0
    for r in range(8):
        for c in range(8):
            p = board[r][c]
            if not p:
                continue

            is_blue = p in ("b", "bk")
            king = p in ("bk", "rk")
            base = 2.0 if king else 1.0
            advance = (r / 7) * 0.3 if is_blue else ((7 - r) / 7) * 0.3
            center = 0.1 if 2 <= c <= 5 else 0.0
            piece_score = base + advance + center

            score += piece_score if is_blue else -piece_score
    return score
