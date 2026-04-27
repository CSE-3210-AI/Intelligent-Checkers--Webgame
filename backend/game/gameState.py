"""
gameState.py - State transitions and top-level game-turn logic.
"""

from __future__ import annotations

from typing import Any

from game.board import cloneBoard, countPieces
from game.moveGenerator import getLegalMoves
from game.rules import promoteToKing, switchTurn


def handleCapture(board, move):
    """Remove captured pieces from a cloned board."""
    b = cloneBoard(board)
    for mr, mc in move.get("captures", []):
        b[mr][mc] = None
    return b


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


def applyMove(board, move):
    """Apply move and return a new board (no mutation of original)."""
    b = cloneBoard(board)

    if move.get("isJump") and move.get("captures"):
        b = handleCapture(b, move)

    fr, fc = move["from"]
    piece = b[fr][fc]
    b[fr][fc] = None

    dr, dc = move["to"][-1]
    b[dr][dc] = piece

    b = promoteToKing(b)
    return b


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


def serializeBoard(board: list[list[Any | None]]) -> str:
    """Stable board serialization for repetition detection."""
    return "|".join(
        ",".join(cell if cell is not None else "_" for cell in row)
        for row in board
    )


def _did_promote(board_before, board_after, move) -> bool:
    fr, fc = move["from"]
    dr, dc = move["to"][-1]
    piece_before = board_before[fr][fc]
    piece_after = board_after[dr][dc]
    if not piece_before or not piece_after:
        return False
    return len(piece_before) == 1 and len(piece_after) == 2


def checkDraw(*, no_progress_count: int, repetition_count: int):
    if no_progress_count >= 40:
        return {"status": "draw", "reason": "no_progress"}
    if repetition_count >= 3:
        return {"status": "draw", "reason": "repetition"}
    return None


def executeTurn(
    board,
    move,
    currentPlayer: str,
    noProgressCount: int = 0,
    repetitionCounts: dict[str, int] | None = None,
):
    """Apply a move and return the updated turn state."""
    opponent_key = "red" if currentPlayer == "blue" else "blue"
    old_counts = countPieces(board)
    repetition_counts = dict(repetitionCounts or {})

    new_board = applyMove(board, move)

    new_counts = countPieces(new_board)
    capture_count = old_counts[opponent_key] - new_counts[opponent_key]
    promoted = _did_promote(board, new_board, move)
    next_no_progress_count = 0 if capture_count > 0 or promoted else (noProgressCount + 1)

    board_key = serializeBoard(new_board)
    next_repetition_count = repetition_counts.get(board_key, 0) + 1
    repetition_counts[board_key] = next_repetition_count

    next_player = switchTurn(currentPlayer)
    winner = checkWin(new_board, next_player)
    draw = None if winner else checkDraw(
        no_progress_count=next_no_progress_count,
        repetition_count=next_repetition_count,
    )

    return {
        "newBoard": new_board,
        "nextPlayer": next_player,
        "winner": winner,
        "status": "draw" if draw else ("win" if winner else "ongoing"),
        "reason": draw["reason"] if draw else None,
        "captureCount": capture_count,
        "noProgressCount": next_no_progress_count,
        "repetitionCounts": repetition_counts,
    }
