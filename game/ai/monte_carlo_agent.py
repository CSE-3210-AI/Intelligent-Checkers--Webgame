"""
Agent Adiba – Monte-Carlo Simulation with simple heuristic.
"""
from __future__ import annotations
import copy
import random
from game.board import count_pieces
from game.moves import get_all_moves, apply_move
from game.game_logic import check_winner


def _evaluate(board, ai_color: str) -> float:
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


def _random_playout(board, current_color: str, ai_color: str,
                    max_moves: int = 80) -> float:
    """Play random moves until game over or *max_moves*."""
    b = copy.deepcopy(board)
    turn = current_color
    for _ in range(max_moves):
        winner = check_winner(b, turn)
        if winner:
            return 1.0 if winner == ai_color else -1.0
        moves = get_all_moves(b, turn)
        if not moves:
            return -1.0 if turn == ai_color else 1.0
        m = random.choice(moves)
        b = apply_move(b, m)
        turn = "red" if turn == "blue" else "blue"
    return _evaluate(b, ai_color) / 20.0


def get_move(board, color: str, simulations: int = 200) -> dict | None:
    """Choose the best move for *color* using Monte-Carlo rollouts."""
    moves = get_all_moves(board, color)
    if not moves:
        return None
    best_score = float("-inf")
    best_move = moves[0]
    opp = "red" if color == "blue" else "blue"
    sims_per_move = max(simulations // len(moves), 1)
    for m in moves:
        new_b = apply_move(board, m)
        total = sum(_random_playout(new_b, opp, color)
                    for _ in range(sims_per_move))
        avg = total / sims_per_move
        if avg > best_score:
            best_score = avg
            best_move = m
    return best_move
