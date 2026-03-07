"""
AI difficulty selection – mirrors AISelection.jsx.
"""
from __future__ import annotations
import pygame
from client.screens.base_screen import BaseScreen
from client.ui.colors import *
from client.ui.fonts import get_font
from client.ui.widgets import (
    Button, DifficultyCard, draw_rounded_rect, render_text_centered,
)
from config import WINDOW_WIDTH, WINDOW_HEIGHT


_DIFFICULTIES = [
    {"id": "easy",   "name": "Easy",   "desc": "Perfect for beginners",
     "badge": "Recommended for beginners", "accent": EMERALD_500},
    {"id": "medium", "name": "Medium", "desc": "Balanced challenge",
     "badge": "Most popular",              "accent": AMBER_500},
    {"id": "hard",   "name": "Hard",   "desc": "Advanced tactics",
     "badge": "Challenging",               "accent": ORANGE_500},
    {"id": "expert", "name": "Expert", "desc": "Grandmaster level",
     "badge": "For pros only",             "accent": RED_500},
]


class AISelectionScreen(BaseScreen):
    def __init__(self, app):
        super().__init__(app)
        self.selected = "medium"
        self._build_cards()
        self._btn_back = Button(
            pygame.Rect(WINDOW_WIDTH // 2 - 220, 680, 180, 46),
            "← Back", outline=True, text_color=SLATE_900,
            font_name="base_b",
            callback=lambda: self.app.switch("home"),
        )
        self._btn_start = Button(
            pygame.Rect(WINDOW_WIDTH // 2 + 40, 680, 180, 46),
            "Start Game", bg=BLUE_600, hover_bg=BLUE_700,
            callback=lambda: self.app.switch("game"),
        )

    def _build_cards(self):
        cx = WINDOW_WIDTH // 2
        card_w, card_h = 280, 240
        gap = 24
        cols = 2
        total_w = cols * card_w + (cols - 1) * gap
        start_x = cx - total_w // 2
        self.cards: list[DifficultyCard] = []
        for i, d in enumerate(_DIFFICULTIES):
            row, col = divmod(i, 2)
            x = start_x + col * (card_w + gap)
            y = 280 + row * (card_h + gap)
            card = DifficultyCard(
                pygame.Rect(x, y, card_w, card_h),
                d["id"], d["name"], d["desc"], d["badge"], d["accent"],
                selected=(d["id"] == self.selected),
                on_click=lambda did=d["id"]: self._select(did),
            )
            self.cards.append(card)

    def _select(self, diff_id: str):
        self.selected = diff_id
        for c in self.cards:
            c.selected = (c.diff_id == diff_id)

    def handle_event(self, ev):
        for c in self.cards:
            c.handle_event(ev)
        self._btn_back.handle_event(ev)
        self._btn_start.handle_event(ev)

    def draw(self, surf):
        surf.fill(BG_BLUE_50)
        cx = WINDOW_WIDTH // 2

        # Badge
        badge_r = pygame.Rect(cx - 60, 80, 120, 30)
        draw_rounded_rect(surf, BLUE_50, badge_r, 15,
                          border=1, border_color=BLUE_200)
        render_text_centered(surf, "AI Opponent", get_font("xs_b"),
                             BLUE_700, badge_r.center)

        # Title
        render_text_centered(surf, "Select AI Difficulty",
                             get_font("5xl_b"), SLATE_900, (cx, 160))
        render_text_centered(
            surf,
            "Choose your challenge level and test your skills against our intelligent AI",
            get_font("lg"), SLATE_500, (cx, 220),
        )

        for c in self.cards:
            c.draw(surf)
        self._btn_back.draw(surf)
        self._btn_start.draw(surf)
