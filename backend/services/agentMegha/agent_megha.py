"""Agent Megha: strong alpha-beta checkers agent with iterative deepening."""

from __future__ import annotations

from dataclasses import dataclass
from math import exp
from time import perf_counter
from typing import Any

from game.gameState import applyMove, checkWin
from game.moveGenerator import getLegalMoves
from game.rules import evaluateBoard, switchTurn
from services.agentAdiba.phase_detector import detect_game_phase


class _SearchTimeout(Exception):
    pass


@dataclass
class _SearchResult:
    score: float
    move: dict[str, Any] | None


def _eval_for_player(board, player: str) -> float:
    # evaluateBoard() is from blue perspective
    base = float(evaluateBoard(board))
    return base if player == 'blue' else -base


def _heuristic(board, ai_player: str) -> float:
    score = _eval_for_player(board, ai_player)

    my_player = ai_player
    opp_player = switchTurn(ai_player)

    my_moves = getLegalMoves(board, my_player)
    opp_moves = getLegalMoves(board, opp_player)

    mobility = 0.08 * (len(my_moves) - len(opp_moves))

    my_jumps = sum(1 for m in my_moves if m.get('isJump'))
    opp_jumps = sum(1 for m in opp_moves if m.get('isJump'))
    tactical = 0.16 * (my_jumps - opp_jumps)

    return score + mobility + tactical


def _move_order_score(board, player: str, move: dict[str, Any]) -> float:
    captures = len(move.get('captures', []))
    jump_bonus = 2.0 if move.get('isJump') else 0.0

    to = move.get('to', [])
    tr, tc = to[-1] if to else move.get('from', [0, 0])
    center_bonus = 0.35 if 2 <= tr <= 5 and 2 <= tc <= 5 else 0.0

    promotion_bonus = 0.0
    if player == 'blue' and tr == 7:
        promotion_bonus = 1.25
    elif player == 'red' and tr == 0:
        promotion_bonus = 1.25

    piece = board[move['from'][0]][move['from'][1]] if move.get('from') else None
    king_move_bonus = 0.3 if piece in ('bk', 'rk') else 0.0

    return captures * 4.0 + jump_bonus + center_bonus + promotion_bonus + king_move_bonus


def _ordered_moves(board, player: str) -> list[dict[str, Any]]:
    moves = getLegalMoves(board, player)
    return sorted(moves, key=lambda m: _move_order_score(board, player, m), reverse=True)


def _board_key(board, player: str, depth: int) -> tuple[Any, ...]:
    packed = tuple(tuple(row) for row in board)
    return packed, player, depth


def _alpha_beta(
    board,
    player_to_move: str,
    ai_player: str,
    depth: int,
    alpha: float,
    beta: float,
    deadline: float,
    tt: dict[tuple[Any, ...], _SearchResult],
) -> _SearchResult:
    if perf_counter() >= deadline:
        raise _SearchTimeout()

    winner = checkWin(board, player_to_move)
    if winner is not None:
        if winner == ai_player:
            return _SearchResult(score=10_000 + depth, move=None)
        return _SearchResult(score=-10_000 - depth, move=None)

    if depth == 0:
        return _SearchResult(score=_heuristic(board, ai_player), move=None)

    key = _board_key(board, player_to_move, depth)
    cached = tt.get(key)
    if cached is not None:
        return cached

    legal_moves = _ordered_moves(board, player_to_move)
    if not legal_moves:
        losing_score = -10_000 - depth if player_to_move == ai_player else 10_000 + depth
        res = _SearchResult(score=losing_score, move=None)
        tt[key] = res
        return res

    best_move: dict[str, Any] | None = None
    best_score = -1e18

    for move in legal_moves:
        child_board = applyMove(board, move)
        child = _alpha_beta(
            child_board,
            switchTurn(player_to_move),
            ai_player,
            depth - 1,
            -beta,
            -alpha,
            deadline,
            tt,
        )
        score = -child.score

        if score > best_score:
            best_score = score
            best_move = move

        if score > alpha:
            alpha = score
        if alpha >= beta:
            break

    res = _SearchResult(score=best_score, move=best_move)
    tt[key] = res
    return res


def _score_to_probability(score: float) -> float:
    x = max(-12.0, min(12.0, score / 3.5))
    return 1.0 / (1.0 + exp(-x))


def get_agent_megha_move(
    board,
    player: str = 'red',
    max_depth: int = 10,
    time_budget_ms: int = 1400,
) -> dict[str, Any]:
    legal = getLegalMoves(board, player)
    phase = detect_game_phase(board)

    if not legal:
        return {
            'move': None,
            'phase': phase,
            'win_probability': 0.0,
            'explanation': 'No legal moves available; the position is lost.',
            'searched_depth': 0,
        }

    fallback = _ordered_moves(board, player)[0]

    deadline = perf_counter() + (time_budget_ms / 1000.0)
    tt: dict[tuple[Any, ...], _SearchResult] = {}

    best_move = fallback
    best_score = _heuristic(applyMove(board, fallback), player)
    reached_depth = 0

    for depth in range(1, max_depth + 1):
        try:
            result = _alpha_beta(
                board=board,
                player_to_move=player,
                ai_player=player,
                depth=depth,
                alpha=-1e18,
                beta=1e18,
                deadline=deadline,
                tt=tt,
            )
            if result.move is not None:
                best_move = result.move
                best_score = result.score
                reached_depth = depth
        except _SearchTimeout:
            break

    win_probability = max(0.0, min(1.0, _score_to_probability(best_score)))

    return {
        'move': best_move,
        'phase': phase,
        'win_probability': round(win_probability, 3),
        'explanation': f'Alpha-Beta selected this move after iterative deepening to depth {reached_depth}.',
        'searched_depth': reached_depth,
    }
