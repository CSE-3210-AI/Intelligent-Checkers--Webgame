"""
gameState.py – State transitions and top-level game-turn logic.
"""

from __future__ import annotations

from game.board import cloneBoard, countPieces
from game.moveGenerator import getLegalMoves
from game.rules import promoteToKing, switchTurn


# ── Capture removal ──────────────────────────────────────────────────────

def handleCapture(board, move):
    """Remove captured pieces from a cloned board."""
    b = cloneBoard(board)
    for mr, mc in move.get("captures", []):
        b[mr][mc] = None
    return b


# ── Multi-jump continuation ───────────────────────────────────────────────

def handleMultiJump(board, position):
    """Return all further jump moves available to piece at position."""
    row, col = position
    piece = board[row][col]
    if not piece:
        return []
    player = "blue" if piece[0] == "b" else "red"
    return [
        m
        for m in getLegalMoves(board, player)
        if m["isJump"] and m["from"][0] == row and m["from"][1] == col
    ]


# ── Move application ─────────────────────────────────────────────────────

def applyMove(board, move):
    """Apply move and return a new board (no mutation of original)."""
    b = cloneBoard(board)

    if move.get("isJump") and move.get("captures"):
        b = handleCapture(b, move)

    fr, fc = move["from"]
    piece = b[fr][fc]
    b[fr][fc] = None

    final_dest = move["to"][-1]
    dr, dc = final_dest
    b[dr][dc] = piece

    b = promoteToKing(b)
    return b


# ── Win detection ────────────────────────────────────────────────────────

def checkWin(board, currentPlayer: str):
    """Returns winner ("blue" | "red") or None."""
    counts = countPieces(board)
    if counts["blue"] == 0:
        return "red"
    if counts["red"] == 0:
        return "blue"

    if len(getLegalMoves(board, currentPlayer)) == 0:
        return switchTurn(currentPlayer)

    return None


# ── Full turn execution ───────────────────────────────────────────────────

def executeTurn(board, move, currentPlayer: str):
    """Apply a move and return the updated turn state."""
    opponent_key = "red" if currentPlayer == "blue" else "blue"
    old_counts = countPieces(board)

    new_board = applyMove(board, move)

    new_counts = countPieces(new_board)
    capture_count = old_counts[opponent_key] - new_counts[opponent_key]

    next_player = switchTurn(currentPlayer)
    winner = checkWin(new_board, next_player)

    return {
        "newBoard": new_board,
        "nextPlayer": next_player,
        "winner": winner,
        "captureCount": capture_count,
    }
