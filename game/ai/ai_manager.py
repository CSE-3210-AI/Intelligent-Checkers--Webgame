"""
AI manager – select and dispatch to the appropriate agent.
"""
from __future__ import annotations
from game.ai import minimax_agent, monte_carlo_agent


AGENTS = {
    "megha": minimax_agent,
    "adiba": monte_carlo_agent,
}


def get_ai_move(board, color: str, agent_name: str = "megha",
                **kwargs) -> dict | None:
    """
    Return the chosen move for *color* using the named agent.

    Parameters
    ----------
    agent_name : "megha" | "adiba"
    **kwargs : forwarded to the agent (depth, simulations, etc.)
    """
    agent = AGENTS.get(agent_name, minimax_agent)
    return agent.get_move(board, color, **kwargs)
