"""
Tournament Mode Selection – mirrors TournamentModeSelection.jsx.
"""
from __future__ import annotations
import pygame
from client.screens.base_screen import BaseScreen
from client.ui.colors import *
from client.ui.fonts import get_font
from client.ui.widgets import TournamentCard, Button, render_text_centered
from config import WINDOW_WIDTH, WINDOW_HEIGHT


class TournamentModeScreen(BaseScreen):
    def __init__(self, app):
        super().__init__(app)
        cx = WINDOW_WIDTH // 2
        cw, ch = 380, 320
        gap = 40

        self.btn_back = Button(
            pygame.Rect(30, 30, 80, 30),
            "← Back", bg=WHITE, hover_bg=BLUE_50, text_color=BLUE_600,
            font_name="sm_b", callback=lambda: self.app.switch("home"),
            border=1, border_color=BLUE_200,
        )

        self.card_internal = TournamentCard(
            pygame.Rect(cx - cw - gap // 2, 220, cw, ch),
            "Internal AI Tournament",
            "Benchmark our in-house AI agents against each other for "
            "algorithmic comparison and research evaluation.",
            ["Algorithm Comparison", "Research Evaluation"],
            BLUE_500,
            on_click=lambda: self.app.switch("tournament_internal"),
        )
        self.card_online = TournamentCard(
            pygame.Rect(cx + gap // 2, 220, cw, ch),
            "Online Benchmark Tournament",
            "Compete with a selected internal AI agent against an external "
            "AI from public repositories for cross-system benchmarking.",
            ["External AI", "Cross-Benchmark"],
            SLATE_600,
            on_click=lambda: self.app.switch("tournament_online"),
        )

    def handle_event(self, ev):
        self.btn_back.handle_event(ev)
        self.card_internal.handle_event(ev)
        self.card_online.handle_event(ev)

    def draw(self, surf):
        surf.fill(BG_BLUE_50)
        self.btn_back.draw(surf)
        render_text_centered(surf, "Tournament Mode Selection",
                             get_font("5xl_b"), SLATE_900,
                             (WINDOW_WIDTH // 2, 120))
        self.card_internal.draw(surf)
        self.card_online.draw(surf)
