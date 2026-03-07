"""
Meet the Agents screen – mirrors MeetAgents.jsx.
Shows the two AI agents side-by-side with a "Start Match" button.
"""
from __future__ import annotations
import pygame
from client.screens.base_screen import BaseScreen
from client.ui.colors import *
from client.ui.fonts import get_font
from client.ui.widgets import AgentCard, Button, render_text_centered
from config import WINDOW_WIDTH, WINDOW_HEIGHT

MEGHA_DESC = (
    "Uses a planning-based approach to evaluate future board states, "
    "efficiently pruning suboptimal moves. Excels at deep tactical "
    "foresight and optimal decision making under deterministic conditions."
)
ADIBA_DESC = (
    "Leverages probabilistic simulations and fuzzy logic to explore a "
    "wide range of possible outcomes, adapting dynamically to uncertainty "
    "and non-deterministic scenarios."
)


class MeetAgentsScreen(BaseScreen):
    def __init__(self, app):
        super().__init__(app)
        cx = WINDOW_WIDTH // 2
        cw, ch = 380, 360
        gap = 40
        self.card_megha = AgentCard(
            pygame.Rect(cx - cw - gap // 2, 200, cw, ch),
            "M", "Agent Megha", "Minimax + Alpha-Beta Pruning",
            MEGHA_DESC, accent=BLUE_500, border_color=BLUE_200,
        )
        self.card_adiba = AgentCard(
            pygame.Rect(cx + gap // 2, 200, cw, ch),
            "A", "Agent Adiba", "Monte Carlo Simulation + Fuzzy Logic",
            ADIBA_DESC, accent=SLATE_600, border_color=SLATE_400,
        )
        self.btn_start = Button(
            pygame.Rect(cx - 100, 600, 200, 50),
            "Start Match", bg=BLUE_600, hover_bg=BLUE_700,
            font_name="lg_b", callback=lambda: self.app.switch("game"),
        )

    def handle_event(self, ev):
        self.btn_start.handle_event(ev)

    def draw(self, surf):
        surf.fill(BG_BLUE_50)
        render_text_centered(surf, "Meet the Agents",
                             get_font("5xl_b"), SLATE_900,
                             (WINDOW_WIDTH // 2, 120))
        self.card_megha.draw(surf)
        self.card_adiba.draw(surf)
        self.btn_start.draw(surf)
