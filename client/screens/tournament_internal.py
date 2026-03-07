"""
Internal AI Tournament – mirrors TournamentInternal.jsx.
"""
from __future__ import annotations
import pygame
from client.screens.base_screen import BaseScreen
from client.ui.colors import *
from client.ui.fonts import get_font
from client.ui.widgets import AgentCard, Button, render_text_centered
from config import WINDOW_WIDTH, WINDOW_HEIGHT
from client.screens.meet_agents import MEGHA_DESC, ADIBA_DESC


class TournamentInternalScreen(BaseScreen):
    def __init__(self, app):
        super().__init__(app)
        cx = WINDOW_WIDTH // 2
        cw, ch = 380, 360
        gap = 40

        self.btn_back = Button(
            pygame.Rect(30, 30, 80, 30),
            "← Back", bg=WHITE, hover_bg=BLUE_50, text_color=BLUE_600,
            font_name="sm_b",
            callback=lambda: self.app.switch("tournament_mode"),
            border=1, border_color=BLUE_200,
        )
        self.card_megha = AgentCard(
            pygame.Rect(cx - cw - gap // 2, 220, cw, ch),
            "M", "Agent Megha", "Minimax + Alpha-Beta Pruning",
            MEGHA_DESC, accent=BLUE_500, border_color=BLUE_200,
        )
        self.card_adiba = AgentCard(
            pygame.Rect(cx + gap // 2, 220, cw, ch),
            "A", "Agent Adiba", "Monte Carlo Simulation + Fuzzy Logic",
            ADIBA_DESC, accent=SLATE_600, border_color=SLATE_400,
        )
        self.btn_start = Button(
            pygame.Rect(cx - 80, 620, 160, 50),
            "Start Match", bg=BLUE_600, hover_bg=BLUE_700,
            font_name="lg_b", callback=lambda: self.app.switch("game"),
        )

    def handle_event(self, ev):
        self.btn_back.handle_event(ev)
        self.btn_start.handle_event(ev)

    def draw(self, surf):
        surf.fill(BG_BLUE_50)
        self.btn_back.draw(surf)
        render_text_centered(surf, "Internal AI Tournament",
                             get_font("5xl_b"), SLATE_900,
                             (WINDOW_WIDTH // 2, 120))
        self.card_megha.draw(surf)
        self.card_adiba.draw(surf)
        self.btn_start.draw(surf)
