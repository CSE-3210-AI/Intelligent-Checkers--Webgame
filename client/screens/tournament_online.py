"""
Online Benchmark Tournament – mirrors TournamentOnline.jsx.
"""
from __future__ import annotations
import pygame
from client.screens.base_screen import BaseScreen
from client.ui.colors import *
from client.ui.fonts import get_font
from client.ui.widgets import AgentCard, Button, render_text_centered
from config import WINDOW_WIDTH, WINDOW_HEIGHT
from client.screens.meet_agents import MEGHA_DESC, ADIBA_DESC


class TournamentOnlineScreen(BaseScreen):
    def __init__(self, app):
        super().__init__(app)
        self.selected = "megha"
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
            pygame.Rect(cx - cw - gap // 2, 260, cw, ch),
            "M", "Agent Megha", "Minimax + Alpha-Beta Pruning",
            MEGHA_DESC, accent=BLUE_500, border_color=BLUE_200,
            selected=True, selectable=True,
            on_click=lambda: self._select("megha"),
        )
        self.card_adiba = AgentCard(
            pygame.Rect(cx + gap // 2, 260, cw, ch),
            "A", "Agent Adiba", "Monte Carlo Simulation + Fuzzy Logic",
            ADIBA_DESC, accent=SLATE_600, border_color=SLATE_400,
            selectable=True,
            on_click=lambda: self._select("adiba"),
        )
        self.btn_start = Button(
            pygame.Rect(cx - 100, 660, 200, 50),
            "Start Benchmark", bg=BLUE_600, hover_bg=BLUE_700,
            font_name="lg_b", callback=lambda: self.app.switch("game"),
        )

    def _select(self, agent_id):
        self.selected = agent_id
        self.card_megha.selected = agent_id == "megha"
        self.card_adiba.selected = agent_id == "adiba"

    def handle_event(self, ev):
        self.btn_back.handle_event(ev)
        self.card_megha.handle_event(ev)
        self.card_adiba.handle_event(ev)
        self.btn_start.handle_event(ev)

    def draw(self, surf):
        surf.fill(BG_BLUE_50)
        self.btn_back.draw(surf)
        cx = WINDOW_WIDTH // 2
        render_text_centered(surf, "Online Benchmark Tournament",
                             get_font("5xl_b"), SLATE_900, (cx, 100))
        render_text_centered(surf, "Select Your Internal Agent",
                             get_font("2xl_b"), SLATE_800, (cx, 170))
        self.card_megha.draw(surf)
        self.card_adiba.draw(surf)
        self.btn_start.draw(surf)
