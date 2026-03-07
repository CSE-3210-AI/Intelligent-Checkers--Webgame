"""
Home / landing page – mirrors Home.jsx.

Header bar, hero section with "Select Game Mode", action card, and footer.
"""
from __future__ import annotations
import pygame
from client.screens.base_screen import BaseScreen
from client.ui.colors import *
from client.ui.fonts import get_font
from client.ui.widgets import (
    Button, draw_rounded_rect, render_text_centered, render_text_left,
)
from config import WINDOW_WIDTH, WINDOW_HEIGHT


class HomeScreen(BaseScreen):
    def __init__(self, app):
        super().__init__(app)
        self.selected_mode = "ai1-ai2"
        self.show_dropdown = False

        # ── Header buttons ────────────────────────────────────────────
        self._btn_how = pygame.Rect(480, 15, 130, 36)
        self._btn_tournaments = pygame.Rect(620, 15, 150, 36)
        self._btn_rankings = pygame.Rect(950, 15, 100, 36)
        self._btn_signin = pygame.Rect(1070, 15, 90, 36)
        self._btn_user = pygame.Rect(1050, 12, 170, 40)
        self._btn_logout = pygame.Rect(1070, 56, 140, 36)

        # ── Main CTA ─────────────────────────────────────────────────
        self._btn_continue = Button(
            pygame.Rect(WINDOW_WIDTH // 2 - 130, 560, 260, 50),
            "Continue to Benchmark",
            bg=BLUE_600, hover_bg=BLUE_700, text_color=WHITE,
            font_name="base_b",
            callback=self._on_continue,
        )

    # ── navigation ────────────────────────────────────────────────────
    def _on_continue(self):
        if self.selected_mode == "our-vs-online":
            self.app.switch("select_internal_agent")
        else:
            self.app.switch("meet_agents")

    # ── events ────────────────────────────────────────────────────────
    def handle_event(self, ev: pygame.event.Event):
        self._btn_continue.handle_event(ev)

        if ev.type == pygame.MOUSEBUTTONDOWN:
            # Header: Tournaments
            if self._btn_tournaments.collidepoint(ev.pos):
                self.app.switch("tournament_mode")
                return
            # Sign In
            if not self.app.session.is_logged_in:
                if self._btn_signin.collidepoint(ev.pos):
                    self.app.switch("sign_in")
                    return
            else:
                if self._btn_user.collidepoint(ev.pos):
                    self.show_dropdown = not self.show_dropdown
                    return
                if self.show_dropdown and self._btn_logout.collidepoint(ev.pos):
                    self.app.session.logout()
                    self.show_dropdown = False
                    return

    # ── draw ──────────────────────────────────────────────────────────
    def draw(self, surf: pygame.Surface):
        # Background
        surf.fill(BG_BLUE_50)

        # ── Header bar ────────────────────────────────────────────────
        pygame.draw.rect(surf, WHITE, (0, 0, WINDOW_WIDTH, 60))
        pygame.draw.line(surf, SLATE_200, (0, 60), (WINDOW_WIDTH, 60), 1)

        # Logo
        logo_rect = pygame.Rect(30, 10, 40, 40)
        draw_rounded_rect(surf, BLUE_600, logo_rect, 10)
        render_text_centered(surf, "S", get_font("xl_b"), WHITE, logo_rect.center)
        render_text_left(surf, "StellarCheckers", get_font("xl_b"), BLACK, (80, 16))

        # Nav buttons
        for rect, label in [(self._btn_how, "How to Play"),
                            (self._btn_tournaments, "Tournaments"),
                            (self._btn_rankings, "Rankings")]:
            hovered = rect.collidepoint(pygame.mouse.get_pos())
            if hovered:
                draw_rounded_rect(surf, (230, 240, 250), rect, 6)
            render_text_centered(surf, label, get_font("sm_b"), BLACK, rect.center)

        # Sign in / user area
        if self.app.session.is_logged_in:
            draw_rounded_rect(surf, WHITE, self._btn_user, 6,
                              border=1, border_color=BLUE_200)
            render_text_centered(surf, self.app.session.username,
                                 get_font("sm_b"), BLUE_700, self._btn_user.center)
            if self.show_dropdown:
                draw_rounded_rect(surf, WHITE, self._btn_logout, 8,
                                  border=1, border_color=SLATE_200)
                render_text_centered(surf, "Logout", get_font("sm"),
                                     RED_500, self._btn_logout.center)
        else:
            draw_rounded_rect(surf, WHITE, self._btn_signin, 6,
                              border=1, border_color=SLATE_300)
            render_text_centered(surf, "Sign In", get_font("sm_b"),
                                 BLACK, self._btn_signin.center)

        # ── Hero section ──────────────────────────────────────────────
        cx = WINDOW_WIDTH // 2

        # Badge
        badge_r = pygame.Rect(cx - 75, 130, 150, 30)
        draw_rounded_rect(surf, BLUE_50, badge_r, 15,
                          border=1, border_color=BLUE_200)
        render_text_centered(surf, "Ready for Battle", get_font("xs_b"),
                             BLUE_700, badge_r.center)

        # Title
        render_text_centered(surf, "Select Game Mode", get_font("6xl_b"),
                             SLATE_900, (cx, 220))

        # Subtitle
        render_text_centered(
            surf,
            "Choose your challenge. Whether it's a friendly match or a test",
            get_font("lg"), SLATE_500, (cx, 290),
        )
        render_text_centered(
            surf,
            "against our advanced AI, the board awaits your first move.",
            get_font("lg"), SLATE_500, (cx, 316),
        )

        # ── Selected mode card ────────────────────────────────────────
        card_r = pygame.Rect(cx - 280, 380, 240, 100)
        draw_rounded_rect(surf, WHITE, card_r, 12, border=1,
                          border_color=SLATE_200)
        render_text_centered(surf, "Selected Mode", get_font("xs"),
                             SLATE_500, (card_r.centerx, card_r.y + 28))
        mode_label = "AI1 vs AI2" if self.selected_mode == "ai1-ai2" \
                     else "Our AI vs Online AI"
        render_text_centered(surf, mode_label, get_font("xl_b"),
                             SLATE_900, (card_r.centerx, card_r.y + 62))

        # CTA button
        self._btn_continue.rect.x = cx + 10
        self._btn_continue.rect.y = card_r.y + 25
        self._btn_continue.draw(surf)

        # ── Footer ────────────────────────────────────────────────────
        fy = WINDOW_HEIGHT - 50
        pygame.draw.line(surf, SLATE_200, (40, fy - 10), (WINDOW_WIDTH - 40, fy - 10), 1)
        render_text_centered(surf, "© 2026 StellarCheckers. All rights reserved.",
                             get_font("xs"), SLATE_500, (cx, fy + 10))
