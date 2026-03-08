"""
Human vs Human – tournament setup screen.

Shows two player cards, a brief rules reminder, and a Start button
that launches a Human vs Human game on the Game screen.
"""
from __future__ import annotations
import pygame
from client.screens.base_screen import BaseScreen
from client.ui.colors import *
from client.ui.fonts import get_font
from client.ui.widgets import (
    Button, draw_rounded_rect,
    render_text_centered, render_text_left,
)
from config import WINDOW_WIDTH, WINDOW_HEIGHT


class TournamentHumanScreen(BaseScreen):
    def __init__(self, app):
        super().__init__(app)
        cx = WINDOW_WIDTH // 2

        # ── Back button ───────────────────────────────────────────────
        self.btn_back = Button(
            pygame.Rect(30, 30, 80, 30),
            "← Back", bg=WHITE, hover_bg=BLUE_50, text_color=BLUE_600,
            font_name="sm_b",
            callback=lambda: self.app.switch("tournament_mode"),
            border=1, border_color=BLUE_200,
        )

        # ── Player cards (visual only) ────────────────────────────────
        cw, ch = 340, 280
        gap = 60
        self.card_p1 = pygame.Rect(cx - cw - gap // 2, 200, cw, ch)
        self.card_p2 = pygame.Rect(cx + gap // 2, 200, cw, ch)

        # ── Rules reminder ────────────────────────────────────────────
        self._rules = [
            "Pieces move diagonally on dark squares.",
            "Captures are mandatory – you must jump.",
            "Multi-jumps must be completed in one turn.",
            "Reaching the back row promotes a piece to King.",
            "A player with no legal moves loses the game.",
        ]

        # ── Start button ──────────────────────────────────────────────
        self.btn_start = Button(
            pygame.Rect(cx - 130, 680, 260, 52),
            "▶  Start Human vs Human",
            bg=EMERALD_500, hover_bg=(10, 160, 110), text_color=WHITE,
            font_name="lg_b", callback=self._start,
        )

    # ── actions ───────────────────────────────────────────────────────
    def _start(self):
        self.app.screens["game"].start_game("hvh")
        self.app.switch("game")

    # ── events ────────────────────────────────────────────────────────
    def handle_event(self, ev):
        self.btn_back.handle_event(ev)
        self.btn_start.handle_event(ev)

    # ── draw ──────────────────────────────────────────────────────────
    def draw(self, surf: pygame.Surface):
        surf.fill(BG_BLUE_50)
        cx = WINDOW_WIDTH // 2

        # Back
        self.btn_back.draw(surf)

        # Title
        render_text_centered(surf, "Human vs Human",
                             get_font("5xl_b"), SLATE_900, (cx, 110))
        render_text_centered(surf,
                             "Two players share the same keyboard and mouse.",
                             get_font("base"), SLATE_500, (cx, 158))

        # ── Player 1 card ─────────────────────────────────────────────
        draw_rounded_rect(surf, WHITE, self.card_p1, 16,
                          border=2, border_color=BLUE_200)
        pcx = self.card_p1.centerx
        pygame.draw.circle(surf, BLUE_500, (pcx, self.card_p1.y + 64), 36)
        render_text_centered(surf, "P1", get_font("2xl_b"),
                             WHITE, (pcx, self.card_p1.y + 64))
        render_text_centered(surf, "Player 1", get_font("2xl_b"),
                             SLATE_900, (pcx, self.card_p1.y + 122))
        render_text_centered(surf, "Plays Blue pieces",
                             get_font("sm"), SLATE_500,
                             (pcx, self.card_p1.y + 152))
        render_text_centered(surf, "Moves downward  ↓",
                             get_font("sm_b"), BLUE_600,
                             (pcx, self.card_p1.y + 178))

        # controls hint
        hint_r = pygame.Rect(self.card_p1.x + 20,
                             self.card_p1.y + 210,
                             self.card_p1.w - 40, 48)
        draw_rounded_rect(surf, BLUE_50, hint_r, 8)
        render_text_centered(surf, "Click piece → click destination",
                             get_font("xs"), BLUE_700, hint_r.center)

        # ── Player 2 card ─────────────────────────────────────────────
        draw_rounded_rect(surf, WHITE, self.card_p2, 16,
                          border=2, border_color=RED_500)
        pcx2 = self.card_p2.centerx
        pygame.draw.circle(surf, RED_500, (pcx2, self.card_p2.y + 64), 36)
        render_text_centered(surf, "P2", get_font("2xl_b"),
                             WHITE, (pcx2, self.card_p2.y + 64))
        render_text_centered(surf, "Player 2", get_font("2xl_b"),
                             SLATE_900, (pcx2, self.card_p2.y + 122))
        render_text_centered(surf, "Plays Red pieces",
                             get_font("sm"), SLATE_500,
                             (pcx2, self.card_p2.y + 152))
        render_text_centered(surf, "Moves upward  ↑",
                             get_font("sm_b"), RED_500,
                             (pcx2, self.card_p2.y + 178))

        hint_r2 = pygame.Rect(self.card_p2.x + 20,
                              self.card_p2.y + 210,
                              self.card_p2.w - 40, 48)
        draw_rounded_rect(surf, (255, 240, 240), hint_r2, 8)
        render_text_centered(surf, "Click piece → click destination",
                             get_font("xs"), RED_500, hint_r2.center)

        # ── Rules card ────────────────────────────────────────────────
        rules_r = pygame.Rect(cx - 380, 510, 760, 148)
        draw_rounded_rect(surf, WHITE, rules_r, 12,
                          border=1, border_color=SLATE_200)
        render_text_centered(surf, "Quick Rules",
                             get_font("lg_b"), SLATE_800,
                             (cx, rules_r.y + 20))
        for i, line in enumerate(self._rules):
            render_text_centered(surf, f"• {line}",
                                 get_font("xs"), SLATE_500,
                                 (cx, rules_r.y + 46 + i * 20))

        # Start button
        self.btn_start.draw(surf)
