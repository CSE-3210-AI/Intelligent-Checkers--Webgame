"""Main Agent Adiba service: phase detection → fuzzy filtering → MCTS → explanation."""

from __future__ import annotations

from game.moveGenerator import getLegalMoves

from services.agentAdiba.explanation_engine import generate_explanation
from services.agentAdiba.fuzzy_logic import (
    evaluate_move_fuzzy,
    filter_weak_moves,
    move_signature,
)
from services.agentAdiba.mcts import run_mcts
from services.agentAdiba.phase_detector import detect_game_phase, get_adaptive_parameters


def _fallback_choice(filtered_moves: list[dict]) -> dict:
    return sorted(filtered_moves, key=lambda item: item["fuzzy_score"], reverse=True)[0]


def get_agent_adiba_move(board, player: str = "red") -> dict:
    legal_moves = getLegalMoves(board, player)
    phase = detect_game_phase(board)
    params = get_adaptive_parameters(phase)

    if not legal_moves:
        return {
            "move": None,
            "phase": phase,
            "win_probability": 0.0,
            "explanation": "No legal moves available; the position is lost.",
        }

    scored = [
        evaluate_move_fuzzy(board, mv, player, float(params["risk_tolerance"]))
        for mv in legal_moves
    ]

    filtered = filter_weak_moves(scored, str(params["fuzzy_filtering"]))

    priors = {move_signature(item["move"]): item["fuzzy_score"] for item in filtered}

    mcts_result = run_mcts(
        board=board,
        player=player,
        simulations=int(params["mcts_simulations"]),
        priors_by_signature=priors,
        uct_c=float(params["uct_c"]),
        time_budget_ms=900,
    )

    selected_move = mcts_result.get("move")
    win_probability = float(mcts_result.get("win_probability", 0.5))

    if selected_move is None:
        fallback = _fallback_choice(filtered)
        selected_move = fallback["move"]
        win_probability = max(0.0, min(1.0, 0.45 + 0.4 * fallback["fuzzy_score"]))
        fuzzy_meta = fallback
    else:
        sig = move_signature(selected_move)
        fuzzy_meta = next((item for item in scored if move_signature(item["move"]) == sig), None)
        if fuzzy_meta is None:
            fuzzy_meta = _fallback_choice(filtered)

    explanation = generate_explanation(
        move=selected_move,
        fuzzy_meta=fuzzy_meta,
        phase=phase,
        win_probability=win_probability,
        strategy=str(params["strategy"]),
    )

    return {
        "move": selected_move,
        "phase": phase,
        "win_probability": round(max(0.0, min(1.0, win_probability)), 3),
        "explanation": explanation,
    }
