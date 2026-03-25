"""Fuzzy-logic move scoring and pre-MCTS filtering for Agent Adiba."""

from __future__ import annotations

from game.gameState import applyMove
from game.moveGenerator import getLegalMoves


CENTER_SQUARES = {
    (2, 2), (2, 3), (2, 4), (2, 5),
    (3, 2), (3, 3), (3, 4), (3, 5),
    (4, 2), (4, 3), (4, 4), (4, 5),
    (5, 2), (5, 3), (5, 4), (5, 5),
}


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def _opponent(player: str) -> str:
    return "red" if player == "blue" else "blue"


def _landing_square(move: dict) -> tuple[int, int]:
    lr, lc = move["to"][-1]
    return int(lr), int(lc)


def _capture_count(move: dict) -> int:
    captures = move.get("captures", [])
    if captures:
        return len(captures)
    return len(move.get("to", [])) if move.get("isJump") else 0


def _threat_count(board_after, row: int, col: int, player: str) -> int:
    threats = 0
    enemy_moves = getLegalMoves(board_after, _opponent(player))
    for mv in enemy_moves:
        if not mv.get("isJump"):
            continue
        for cap_r, cap_c in mv.get("captures", []):
            if cap_r == row and cap_c == col:
                threats += 1
                break
    return threats


def _promotion_prevention_score(board_after, player: str) -> float:
    opp = _opponent(player)
    enemy_positions: list[tuple[int, int]] = []

    for r in range(8):
        for c in range(8):
            piece = board_after[r][c]
            if not piece:
                continue
            if opp == "blue" and piece == "b":
                enemy_positions.append((r, c))
            if opp == "red" and piece == "r":
                enemy_positions.append((r, c))

    if not enemy_positions:
        return 0.0

    pressured = 0
    for r, _ in enemy_positions:
        if opp == "blue" and r >= 5:
            pressured += 1
        if opp == "red" and r <= 2:
            pressured += 1

    return _clamp01(pressured / max(1, len(enemy_positions)))


def evaluate_move_fuzzy(board, move: dict, player: str, risk_tolerance: float) -> dict:
    board_after = applyMove(board, move)
    to_r, to_c = _landing_square(move)

    piece = board_after[to_r][to_c]
    my_moves = len(getLegalMoves(board_after, player))
    opp_moves = len(getLegalMoves(board_after, _opponent(player)))

    threat = _threat_count(board_after, to_r, to_c, player)
    threat_score = _clamp01(threat / 3.0)

    capture_opportunity = _clamp01(_capture_count(move) / 3.0)
    king_safety = _clamp01(1.0 - threat_score) if piece in ("bk", "rk") else 0.5
    center_control = 1.0 if (to_r, to_c) in CENTER_SQUARES else 0.35
    flank_protection = 0.75 if to_c <= 1 or to_c >= 6 else 0.45
    promotion_prevention = _promotion_prevention_score(board_after, player)
    mobility_advantage = _clamp01((my_moves - opp_moves + 12.0) / 24.0)

    safety_score = _clamp01(
        0.36 * king_safety
        + 0.28 * flank_protection
        + 0.20 * (1.0 - threat_score)
        + 0.16 * promotion_prevention
    )

    attack_score = _clamp01(
        0.45 * capture_opportunity
        + 0.23 * center_control
        + 0.17 * mobility_advantage
        + 0.15 * promotion_prevention
    )

    risk_score = _clamp01(0.65 * threat_score + 0.35 * (1.0 - safety_score))

    fuzzy_score = _clamp01(
        (1.0 - risk_tolerance) * (0.6 * safety_score + 0.4 * attack_score)
        + risk_tolerance * (0.7 * attack_score + 0.3 * (1.0 - risk_score))
    )

    classification = "Safe"
    if attack_score > 0.7 and risk_score > 0.45:
        classification = "Aggressive"
    elif risk_score > 0.62:
        classification = "Risky"

    return {
        "move": move,
        "safety_score": round(safety_score, 3),
        "attack_score": round(attack_score, 3),
        "risk_score": round(risk_score, 3),
        "mobility_score": round(mobility_advantage, 3),
        "fuzzy_score": round(fuzzy_score, 3),
        "classification": classification,
        "features": {
            "capture_opportunity": capture_opportunity,
            "king_safety": king_safety,
            "center_control": center_control,
            "flank_protection": flank_protection,
            "promotion_prevention": promotion_prevention,
            "mobility_advantage": mobility_advantage,
        },
    }


def filter_weak_moves(scored_moves: list[dict], filtering_strength: str) -> list[dict]:
    if len(scored_moves) <= 2:
        return scored_moves

    ranked = sorted(scored_moves, key=lambda m: m["fuzzy_score"], reverse=True)

    if filtering_strength == "strong":
        keep_count = max(2, int(len(ranked) * 0.45 + 0.999))
    elif filtering_strength == "weak":
        keep_count = max(2, int(len(ranked) * 0.85 + 0.999))
    else:
        keep_count = max(2, int(len(ranked) * 0.65 + 0.999))

    threshold = ranked[keep_count - 1]["fuzzy_score"]
    filtered = [m for m in ranked if m["fuzzy_score"] >= threshold]
    return filtered if filtered else ranked[:2]


def move_signature(move: dict) -> tuple:
    return (
        tuple(move.get("from", [])),
        tuple(tuple(x) for x in move.get("to", [])),
        bool(move.get("isJump", False)),
        tuple(tuple(x) for x in move.get("captures", [])),
    )
