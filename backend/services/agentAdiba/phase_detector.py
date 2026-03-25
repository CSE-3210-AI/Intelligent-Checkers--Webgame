"""Game phase detection and adaptive parameter selection for Agent Adiba."""

from __future__ import annotations

from game.board import countPieces


def detect_game_phase(board) -> str:
    counts = countPieces(board)
    total = counts["blue"] + counts["red"]
    if total > 16:
        return "Opening"
    if total >= 8:
        return "Midgame"
    return "Endgame"


def get_adaptive_parameters(phase: str) -> dict[str, object]:
    if phase == "Opening":
        return {
            "risk_tolerance": 0.25,
            "mcts_simulations": 200,
            "fuzzy_filtering": "strong",
            "strategy": "Opening Strategy",
            "uct_c": 1.25,
        }
    if phase == "Endgame":
        return {
            "risk_tolerance": 0.78,
            "mcts_simulations": 700,
            "fuzzy_filtering": "weak",
            "strategy": "Endgame Aggression",
            "uct_c": 1.45,
        }
    return {
        "risk_tolerance": 0.5,
        "mcts_simulations": 400,
        "fuzzy_filtering": "medium",
        "strategy": "Midgame Tactical Play",
        "uct_c": 1.35,
    }
