"""Human-readable explanation generation for Agent Adiba decisions."""

from __future__ import annotations


def generate_explanation(
    move: dict,
    fuzzy_meta: dict,
    phase: str,
    win_probability: float,
    strategy: str,
) -> str:
    reasons: list[str] = []

    features = fuzzy_meta.get("features", {})

    if move.get("isJump"):
        reasons.append("Aggressive capture selected due to favorable simulation outcomes.")

    if features.get("promotion_prevention", 0.0) > 0.6:
        reasons.append("Jump selected to prevent opponent King promotion.")

    if fuzzy_meta.get("safety_score", 0.0) > 0.7 and features.get("flank_protection", 0.0) > 0.65:
        reasons.append("Defensive move chosen to protect the vulnerable flank.")

    if features.get("center_control", 0.0) > 0.8:
        reasons.append("Central control move selected to improve board dominance.")

    if not reasons:
        label = fuzzy_meta.get("classification", "Safe")
        if label == "Safe":
            reasons.append("Safe positional move selected to preserve king safety and mobility.")
        elif label == "Aggressive":
            reasons.append("Aggressive line preferred because the search found strong continuation pressure.")
        else:
            reasons.append("Balanced tactical move selected after fuzzy filtering and Monte Carlo validation.")

    reasons.append(
        f"Estimated win probability: {round(win_probability * 100)}% during {phase.lower()} ({strategy})."
    )

    return " ".join(reasons)
