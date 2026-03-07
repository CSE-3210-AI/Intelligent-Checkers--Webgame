"""
High-level game-state helpers: winner detection, evaluation.
"""
from __future__ import annotations
from game.board import count_pieces
from game.moves import get_all_moves


def check_winner(board, current_turn: str) -> str | None:
    """
    Returns "blue", "red" if one side won, or None if the game continues.
    A player loses if they have no pieces or no legal moves on their turn.
    """
    counts = count_pieces(board)
    if counts["blue"] == 0:
        return "red"
    if counts["red"] == 0:
        return "blue"
    if not get_all_moves(board, current_turn):
        return "red" if current_turn == "blue" else "blue"
    return None
