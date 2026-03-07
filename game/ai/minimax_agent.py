"""
Agent Megha – Minimax with Alpha-Beta Pruning.
"""
from __future__ import annotations
import copy
from game.board import count_pieces
from game.moves import get_all_moves, apply_move
from game.game_logic import check_winner


def _evaluate(board, ai_color: str) -> float:
    """Basic heuristic: piece count + kings worth 1.5."""
    score = 0.0
    for r in range(8):
        for c in range(8):
            p = board[r][c]
            if p:
                val = 1.5 if p["isKing"] else 1.0
                if p["color"] == ai_color:
                    score += val
                else:
                    score -= val
    return score


def _minimax(board, depth: int, alpha: float, beta: float,
             maximising: bool, ai_color: str,
             current_color: str) -> tuple[float, dict | None]:
    """Minimax with alpha-beta pruning."""
    winner = check_winner(board, current_color)
    if winner:
        return (1000.0 if winner == ai_color else -1000.0), None
    if depth == 0:
        return _evaluate(board, ai_color), None

    moves = get_all_moves(board, current_color)
    if not moves:
        return _evaluate(board, ai_color), None

    best_move = None
    opp = "red" if current_color == "blue" else "blue"

    if maximising:
        max_eval = float("-inf")
        for m in moves:
            new_b = apply_move(board, m)
            ev, _ = _minimax(new_b, depth - 1, alpha, beta,
                             False, ai_color, opp)
            if ev > max_eval:
                max_eval = ev
                best_move = m
            alpha = max(alpha, ev)
            if beta <= alpha:
                break
        return max_eval, best_move
    else:
        min_eval = float("inf")
        for m in moves:
            new_b = apply_move(board, m)
            ev, _ = _minimax(new_b, depth - 1, alpha, beta,
                             True, ai_color, opp)
            if ev < min_eval:
                min_eval = ev
                best_move = m
            beta = min(beta, ev)
            if beta <= alpha:
                break
        return min_eval, best_move


def get_move(board, color: str, depth: int = 4) -> dict | None:
    """Choose the best move for *color* using Minimax + Alpha-Beta."""
    _, move = _minimax(board, depth, float("-inf"), float("inf"),
                       True, color, color)
    return move
