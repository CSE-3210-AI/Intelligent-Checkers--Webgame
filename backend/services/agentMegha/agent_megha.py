"""Agent Megha: stronger alpha-beta engine with rule-safe move generation."""

from __future__ import annotations

from dataclasses import dataclass
from math import exp
from time import perf_counter
from typing import Any

from game.gameState import applyMove, checkWin
from game.moveGenerator import getLegalMoves
from game.rules import switchTurn
from services.agentAdiba.phase_detector import detect_game_phase


class _SearchTimeout(Exception):
    pass


@dataclass
class _TTEntry:
    depth: int
    score: float
    flag: str  # exact | lower | upper
    best_move: dict[str, Any] | None


def _piece_color(piece: str | None) -> str | None:
    if not piece:
        return None
    return "blue" if piece[0] == "b" else "red"


def _piece_value(piece: str) -> float:
    return 2.1 if piece in ("bk", "rk") else 1.0


def _is_promotion_square(player: str, row: int) -> bool:
    return (player == "blue" and row == 7) or (player == "red" and row == 0)


def _move_sig(move: dict[str, Any]) -> str:
    return f"{move.get('from')}|{move.get('to')}|{move.get('captures', [])}"


def _format_move(move: dict[str, Any] | None) -> str:
    if not move:
        return "no move"
    fr = move.get("from", [0, 0])
    to_path = move.get("to", [])
    tr, tc = to_path[-1] if to_path else fr
    coord = lambda r, c: f"{chr(65 + c)}{8 - r}"
    return f"{coord(fr[0], fr[1])} -> {coord(tr, tc)}"


def _board_key(board, player_to_move: str) -> tuple[Any, ...]:
    return tuple(tuple(r) for r in board), player_to_move


def _evaluate_material_position(board, ai_player: str) -> float:
    material = 0.0
    advancement = 0.0
    center = 0.0
    back_rank_guard = 0.0

    for r in range(8):
        for c in range(8):
            p = board[r][c]
            if not p:
                continue

            color = _piece_color(p)
            sign = 1.0 if color == ai_player else -1.0

            material += sign * _piece_value(p)

            if p not in ("bk", "rk"):
                adv = (r / 7.0) if color == "blue" else ((7 - r) / 7.0)
                advancement += sign * (0.28 * adv)

            if 2 <= r <= 5 and 2 <= c <= 5:
                center += sign * 0.10

            if color == "blue" and r == 0:
                back_rank_guard += sign * 0.08
            elif color == "red" and r == 7:
                back_rank_guard += sign * 0.08

    return material + advancement + center + back_rank_guard


def _evaluate(board, ai_player: str) -> float:
    opp = switchTurn(ai_player)
    base = _evaluate_material_position(board, ai_player)

    my_moves = getLegalMoves(board, ai_player)
    opp_moves = getLegalMoves(board, opp)

    mobility = 0.07 * (len(my_moves) - len(opp_moves))
    my_caps = sum(len(m.get("captures", [])) for m in my_moves)
    opp_caps = sum(len(m.get("captures", [])) for m in opp_moves)
    capture_pressure = 0.11 * (my_caps - opp_caps)

    return base + mobility + capture_pressure


def _evaluate_from_side_to_move(board, player_to_move: str, ai_player: str) -> float:
    base = _evaluate(board, ai_player)
    return base if player_to_move == ai_player else -base


def _order_score(
    board,
    player: str,
    move: dict[str, Any],
    ply: int,
    tt_move: dict[str, Any] | None,
    killer_moves: dict[int, set[str]],
    history: dict[str, int],
) -> float:
    sig = _move_sig(move)
    if tt_move is not None and _move_sig(tt_move) == sig:
        return 100000.0

    captures = len(move.get("captures", []))
    is_jump = 1.0 if move.get("isJump") else 0.0
    from_r, from_c = move.get("from", [0, 0])
    to_path = move.get("to", [])
    tr, tc = to_path[-1] if to_path else (from_r, from_c)

    piece = board[from_r][from_c] if 0 <= from_r < 8 and 0 <= from_c < 8 else None
    king_move = 1.0 if piece in ("bk", "rk") else 0.0
    center = 1.0 if 2 <= tr <= 5 and 2 <= tc <= 5 else 0.0
    promotion = 1.0 if _is_promotion_square(player, tr) and piece in ("b", "r") else 0.0
    killer = 1.0 if sig in killer_moves.get(ply, set()) else 0.0
    hist = float(history.get(sig, 0)) * 0.01

    return captures * 14.0 + is_jump * 6.0 + promotion * 4.0 + king_move * 1.5 + center * 0.6 + killer * 2.0 + hist


def _ordered_moves(
    board,
    player: str,
    ply: int,
    tt_move: dict[str, Any] | None,
    killer_moves: dict[int, set[str]],
    history: dict[str, int],
) -> list[dict[str, Any]]:
    moves = getLegalMoves(board, player)
    return sorted(
        moves,
        key=lambda mv: _order_score(board, player, mv, ply, tt_move, killer_moves, history),
        reverse=True,
    )


def _negamax(
    board,
    player_to_move: str,
    ai_player: str,
    depth: int,
    alpha: float,
    beta: float,
    deadline: float,
    tt: dict[tuple[Any, ...], _TTEntry],
    killer_moves: dict[int, set[str]],
    history: dict[str, int],
    ply: int,
) -> tuple[float, dict[str, Any] | None]:
    if perf_counter() >= deadline:
        raise _SearchTimeout()

    alpha_orig = alpha
    key = _board_key(board, player_to_move)
    tt_entry = tt.get(key)

    if tt_entry and tt_entry.depth >= depth:
        if tt_entry.flag == "exact":
            return tt_entry.score, tt_entry.best_move
        if tt_entry.flag == "lower":
            alpha = max(alpha, tt_entry.score)
        elif tt_entry.flag == "upper":
            beta = min(beta, tt_entry.score)
        if alpha >= beta:
            return tt_entry.score, tt_entry.best_move

    winner = checkWin(board, player_to_move)
    if winner is not None:
        if winner == player_to_move:
            return 100000.0 - ply, None
        return -100000.0 + ply, None

    if depth <= 0:
        return _evaluate_from_side_to_move(board, player_to_move, ai_player), None

    tt_move = tt_entry.best_move if tt_entry else None
    moves = _ordered_moves(board, player_to_move, ply, tt_move, killer_moves, history)
    if not moves:
        return -100000.0 + ply, None

    best_score = -1e18
    best_move: dict[str, Any] | None = None

    for mv in moves:
        child_board = applyMove(board, mv)
        child_score, _ = _negamax(
            child_board,
            switchTurn(player_to_move),
            ai_player,
            depth - 1,
            -beta,
            -alpha,
            deadline,
            tt,
            killer_moves,
            history,
            ply + 1,
        )
        score = -child_score

        if score > best_score:
            best_score = score
            best_move = mv

        if score > alpha:
            alpha = score
        if alpha >= beta:
            sig = _move_sig(mv)
            killer_moves.setdefault(ply, set()).add(sig)
            history[sig] = history.get(sig, 0) + depth * depth
            break

    flag = "exact"
    if best_score <= alpha_orig:
        flag = "upper"
    elif best_score >= beta:
        flag = "lower"

    tt[key] = _TTEntry(depth=depth, score=best_score, flag=flag, best_move=best_move)
    return best_score, best_move


def _score_to_probability(score: float) -> float:
    x = max(-12.0, min(12.0, score / 8.0))
    return 1.0 / (1.0 + exp(-x))


def _adaptive_limits(phase: str, max_depth: int, time_budget_ms: int) -> tuple[int, int]:
    depth = max_depth
    budget = time_budget_ms
    if phase == "Opening":
        depth = max(depth, 10)
        budget = max(budget, 1800)
    elif phase == "Midgame":
        depth = max(depth, 12)
        budget = max(budget, 2400)
    else:
        depth = max(depth, 14)
        budget = max(budget, 3200)
    return depth, budget


def _build_explanation(move: dict[str, Any], phase: str, depth: int, score: float, win_prob: float) -> str:
    caps = len(move.get("captures", []))
    to_path = move.get("to", [])
    tr = to_path[-1][0] if to_path else move.get("from", [0, 0])[0]
    fr = move.get("from", [0, 0])[0]

    tactical_bits: list[str] = []
    if caps > 0:
        tactical_bits.append(f"captures {caps} piece{'s' if caps != 1 else ''}")
    if abs(tr - fr) >= 2:
        tactical_bits.append("forces tactical jumps")
    if 2 <= tr <= 5:
        tactical_bits.append("improves central control")

    details = ", ".join(tactical_bits) if tactical_bits else "improves positional stability"
    return (
        f"Alpha-Beta ({phase}) searched to depth {depth} and selected {_format_move(move)}. "
        f"It {details}; evaluation score {score:.2f} (win chance {round(win_prob * 100)}%)."
    )


def get_agent_megha_move(
    board,
    player: str = "red",
    max_depth: int = 12,
    time_budget_ms: int = 2200,
) -> dict[str, Any]:
    # Rule compliance is guaranteed by game engine move generator + applyMove/checkWin.
    legal = getLegalMoves(board, player)
    phase = detect_game_phase(board)

    if not legal:
        return {
            "move": None,
            "phase": phase,
            "win_probability": 0.0,
            "explanation": "No legal moves available; the position is lost.",
            "searched_depth": 0,
            "score": -100000.0,
        }

    max_depth, time_budget_ms = _adaptive_limits(phase, max_depth, time_budget_ms)

    fallback = legal[0]
    best_move = fallback
    best_score = _evaluate(applyMove(board, fallback), player)
    reached_depth = 0

    deadline = perf_counter() + (time_budget_ms / 1000.0)
    tt: dict[tuple[Any, ...], _TTEntry] = {}
    killer_moves: dict[int, set[str]] = {}
    history: dict[str, int] = {}

    for depth in range(1, max_depth + 1):
        try:
            score, move = _negamax(
                board,
                player,
                player,
                depth,
                -1e18,
                1e18,
                deadline,
                tt,
                killer_moves,
                history,
                0,
            )
        except _SearchTimeout:
            break

        if move is not None:
            best_move = move
            best_score = score
            reached_depth = depth

        if abs(best_score) > 90000:
            break

    win_probability = max(0.0, min(1.0, _score_to_probability(best_score)))
    explanation = _build_explanation(best_move, phase, reached_depth, best_score, win_probability)

    return {
        "move": best_move,
        "phase": phase,
        "win_probability": round(win_probability, 3),
        "explanation": explanation,
        "searched_depth": reached_depth,
        "score": round(best_score, 3),
    }
