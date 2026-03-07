"""
Game Page – mirrors GamePage.jsx.

Dark-themed screen with:
  • 8×8 interactive checkers board (with tab-switching between preset states)
  • Player info sidebar
  • Game status sidebar
  • Action buttons (New Game, Undo, Resign)

All game-logic calls now go through the game/ package
(no more monolithic game_logic module).
"""
from __future__ import annotations
import pygame
import time
from client.screens.base_screen import BaseScreen
from client.ui.colors import *
from client.ui.fonts import get_font
from client.ui.widgets import Button, draw_rounded_rect, render_text_centered, render_text_left
from client.ui.components import draw_board, SQUARE_SIZE, BOARD_PX, BOARD_PADDING
from config import WINDOW_WIDTH, WINDOW_HEIGHT

# Game logic – split across game.board, game.moves, game.game_logic
from game.board import (
    initial_board, midgame_board, endgame_board, another_board, count_pieces,
)
from game.moves import get_all_moves, get_legal_destinations, apply_move
from game.game_logic import check_winner


# Board presets (same tabs as React)
_PRESETS = {
    "initial": ("Initial",  initial_board,  []),
    "midgame": ("Mid Game", midgame_board,  [(6, 7)]),
    "endgame": ("End Game", endgame_board,  []),
    "another": ("Another",  another_board,  [(1, 3), (1, 5), (2, 2), (2, 6)]),
}


class GameScreen(BaseScreen):
    def __init__(self, app):
        super().__init__(app)

        # ── Board layout constants ────────────────────────────────────
        self.board_ox = 60
        self.board_oy = 110

        # ── State ─────────────────────────────────────────────────────
        self.board = initial_board()
        self.turn: str = "blue"       # blue starts
        self.selected: tuple | None = None
        self.highlights: list[tuple] = []
        self.move_count = 0
        self.captures = {"blue": 0, "red": 0}
        self.winner: str | None = None
        self.active_tab = "initial"
        self.preset_mode = True   # True = viewing presets; False = playing

        # ── Timer ─────────────────────────────────────────────────────
        self.start_time = time.time()

        # ── Sidebar X ─────────────────────────────────────────────────
        sx = self.board_ox + BOARD_PX + BOARD_PADDING * 2 + 30
        sw = WINDOW_WIDTH - sx - 30

        # ── Tabs ──────────────────────────────────────────────────────
        tab_names = list(_PRESETS.keys())
        tw = (BOARD_PX + BOARD_PADDING * 2) // len(tab_names)
        self.tab_rects: dict[str, pygame.Rect] = {}
        for i, key in enumerate(tab_names):
            self.tab_rects[key] = pygame.Rect(
                self.board_ox - BOARD_PADDING + i * tw,
                self.board_oy - 50, tw, 36,
            )

        # ── Header buttons ────────────────────────────────────────────
        self.btn_home = Button(
            pygame.Rect(30, 20, 100, 40),
            "Home", bg=(255, 255, 255, 25), hover_bg=(255, 255, 255, 50),
            text_color=WHITE, font_name="sm_b",
            callback=lambda: self.app.switch("home"),
            border=1, border_color=DARK_BORDER,
        )

        # ── Sidebar action buttons ────────────────────────────────────
        self.btn_new = Button(
            pygame.Rect(sx, 540, sw, 42), "New Game",
            bg=AMBER_500, hover_bg=(220, 140, 10), text_color=WHITE,
            font_name="base_b", callback=self._new_game,
        )
        self.btn_undo = Button(
            pygame.Rect(sx, 592, sw, 42), "Undo Move",
            outline=True, text_color=WHITE, font_name="base_b",
            callback=self._undo,
        )
        self.btn_resign = Button(
            pygame.Rect(sx, 644, sw, 42), "Resign",
            outline=True, text_color=WHITE, font_name="base_b",
            callback=self._resign,
        )

        self.history: list = []  # for undo

    # ── actions ───────────────────────────────────────────────────────
    def _new_game(self):
        self.board = initial_board()
        self.turn = "blue"
        self.selected = None
        self.highlights = []
        self.move_count = 0
        self.captures = {"blue": 0, "red": 0}
        self.winner = None
        self.preset_mode = False
        self.history = []
        self.start_time = time.time()

    def _undo(self):
        if self.history:
            state = self.history.pop()
            self.board = state["board"]
            self.turn = state["turn"]
            self.move_count = state["move_count"]
            self.captures = state["captures"]
            self.winner = None
            self.selected = None
            self.highlights = []

    def _resign(self):
        self.winner = "red" if self.turn == "blue" else "blue"

    # ── events ────────────────────────────────────────────────────────
    def handle_event(self, ev):
        self.btn_home.handle_event(ev)
        self.btn_new.handle_event(ev)
        self.btn_undo.handle_event(ev)
        self.btn_resign.handle_event(ev)

        if ev.type == pygame.MOUSEBUTTONDOWN:
            # Tab clicks
            for key, rect in self.tab_rects.items():
                if rect.collidepoint(ev.pos):
                    self.active_tab = key
                    label, factory, hl = _PRESETS[key]
                    self.board = factory()
                    self.highlights = list(hl)
                    self.selected = None
                    self.preset_mode = True
                    self.winner = None
                    return

            # Board clicks (only when playing)
            if not self.preset_mode and not self.winner:
                mx, my = ev.pos
                col = (mx - self.board_ox) // SQUARE_SIZE
                row = (my - self.board_oy) // SQUARE_SIZE
                if 0 <= row < 8 and 0 <= col < 8:
                    self._handle_board_click(row, col)

    def _handle_board_click(self, row: int, col: int):
        piece = self.board[row][col]

        # If clicking a highlighted (legal) destination → make the move
        if self.selected and (row, col) in self.highlights:
            all_moves = get_all_moves(self.board, self.turn)
            for m in all_moves:
                if m["from"] == self.selected and (row, col) in [m["to"][0]]:
                    # Save state for undo
                    self.history.append({
                        "board": [r[:] for r in self.board],
                        "turn": self.turn,
                        "move_count": self.move_count,
                        "captures": dict(self.captures),
                    })
                    # Count captures
                    old_counts = count_pieces(self.board)
                    self.board = apply_move(self.board, m)
                    new_counts = count_pieces(self.board)
                    opp = "red" if self.turn == "blue" else "blue"
                    captured = old_counts[opp] - new_counts[opp]
                    self.captures[self.turn] += captured
                    self.move_count += 1
                    self.selected = None
                    self.highlights = []
                    # Check winner
                    self.turn = "red" if self.turn == "blue" else "blue"
                    self.winner = check_winner(self.board, self.turn)
                    break
            return

        # Selecting own piece
        if piece and piece["color"] == self.turn:
            self.selected = (row, col)
            self.highlights = get_legal_destinations(self.board, row, col)
        else:
            self.selected = None
            self.highlights = []

    # ── draw ──────────────────────────────────────────────────────────
    def draw(self, surf):
        surf.fill(DARK_BG)

        # ── Header ────────────────────────────────────────────────────
        self.btn_home.draw(surf)
        render_text_left(surf, "Checkers Game", get_font("4xl_b"),
                         WHITE, (150, 16))

        # Timer pill
        elapsed = int(time.time() - self.start_time)
        mins, secs = divmod(elapsed, 60)
        timer_text = f"{mins:02d}:{secs:02d}"
        tr = pygame.Rect(WINDOW_WIDTH - 260, 20, 90, 36)
        draw_rounded_rect(surf, DARK_CARD, tr, 8, border=1,
                          border_color=DARK_BORDER)
        render_text_centered(surf, f"T {timer_text}", get_font("sm_b"),
                             WHITE, tr.center)

        # "vs AI" pill
        vr = pygame.Rect(WINDOW_WIDTH - 155, 20, 110, 36)
        draw_rounded_rect(surf, DARK_CARD, vr, 8, border=1,
                          border_color=DARK_BORDER)
        render_text_centered(surf, "vs AI", get_font("sm_b"),
                             WHITE, vr.center)

        # ── Tabs ──────────────────────────────────────────────────────
        for key, rect in self.tab_rects.items():
            active = key == self.active_tab
            bg = WHITE if active else DARK_CARD
            tc = SLATE_900 if active else SLATE_400
            draw_rounded_rect(surf, bg, rect, 6)
            label = _PRESETS[key][0]
            render_text_centered(surf, label, get_font("sm_b"), tc,
                                 rect.center)

        # ── Board ─────────────────────────────────────────────────────
        card_r = pygame.Rect(
            self.board_ox - BOARD_PADDING - 14,
            self.board_oy - BOARD_PADDING - 14,
            BOARD_PX + BOARD_PADDING * 2 + 28,
            BOARD_PX + BOARD_PADDING * 2 + 28,
        )
        draw_rounded_rect(surf, DARK_CARD, card_r, 12, border=1,
                          border_color=DARK_BORDER)

        draw_board(surf, self.board_ox, self.board_oy, self.board,
                   self.highlights, self.selected)

        # ── Sidebar ───────────────────────────────────────────────────
        sx = card_r.right + 24
        sw = WINDOW_WIDTH - sx - 24
        self.btn_new.rect.x = sx
        self.btn_new.rect.width = sw
        self.btn_undo.rect.x = sx
        self.btn_undo.rect.width = sw
        self.btn_resign.rect.x = sx
        self.btn_resign.rect.width = sw

        # Players card
        py = 110
        pr = pygame.Rect(sx, py, sw, 160)
        draw_rounded_rect(surf, DARK_CARD, pr, 12, border=1,
                          border_color=DARK_BORDER)
        # Player 1
        pygame.draw.circle(surf, BLUE_500, (sx + 30, py + 36), 18)
        render_text_left(surf, "Player 1", get_font("base_b"), WHITE,
                         (sx + 56, py + 20))
        render_text_left(surf, "Blue Pieces", get_font("xs"),
                         SLATE_400, (sx + 56, py + 42))
        bcount = count_pieces(self.board)["blue"]
        bc_r = pygame.Rect(sx + sw - 48, py + 24, 36, 26)
        draw_rounded_rect(surf, BLUE_500, bc_r, 6)
        render_text_centered(surf, str(bcount), get_font("sm_b"),
                             WHITE, bc_r.center)
        # Separator
        pygame.draw.line(surf, DARK_BORDER, (sx + 16, py + 76),
                         (sx + sw - 16, py + 76), 1)
        # AI Opponent
        pygame.draw.circle(surf, RED_500, (sx + 30, py + 112), 18)
        render_text_left(surf, "AI Opponent", get_font("base_b"), WHITE,
                         (sx + 56, py + 96))
        render_text_left(surf, "Red Pieces", get_font("xs"),
                         SLATE_400, (sx + 56, py + 118))
        rcount = count_pieces(self.board)["red"]
        rc_r = pygame.Rect(sx + sw - 48, py + 100, 36, 26)
        draw_rounded_rect(surf, RED_500, rc_r, 6)
        render_text_centered(surf, str(rcount), get_font("sm_b"),
                             WHITE, rc_r.center)

        # Game Status card
        sy = py + 180
        sr = pygame.Rect(sx, sy, sw, 170)
        draw_rounded_rect(surf, DARK_CARD, sr, 12, border=1,
                          border_color=DARK_BORDER)
        render_text_left(surf, "Game Status", get_font("lg_b"), WHITE,
                         (sx + 16, sy + 14))
        # Current turn
        render_text_left(surf, "Current Turn", get_font("sm"),
                         SLATE_400, (sx + 16, sy + 52))
        turn_label = "Player 1" if self.turn == "blue" else "AI"
        tbg = BLUE_500 if self.turn == "blue" else RED_500
        tl_r = pygame.Rect(sx + sw - 80, sy + 48, 68, 24)
        draw_rounded_rect(surf, tbg, tl_r, 6)
        render_text_centered(surf, turn_label, get_font("xs_b"), WHITE,
                             tl_r.center)
        # Move count
        render_text_left(surf, "Move Count", get_font("sm"),
                         SLATE_400, (sx + 16, sy + 88))
        render_text_left(surf, str(self.move_count), get_font("sm_b"),
                         WHITE, (sx + sw - 40, sy + 88))
        # Captures
        render_text_left(surf, "Captures", get_font("sm"),
                         SLATE_400, (sx + 16, sy + 120))
        cap_text = f"{self.captures['blue']} - {self.captures['red']}"
        render_text_left(surf, cap_text, get_font("sm_b"), WHITE,
                         (sx + sw - 50, sy + 120))

        # Action buttons
        self.btn_new.rect.y = sy + 190
        self.btn_undo.rect.y = sy + 242
        self.btn_resign.rect.y = sy + 294
        self.btn_new.draw(surf)
        self.btn_undo.draw(surf)
        self.btn_resign.draw(surf)

        # Winner overlay
        if self.winner:
            overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 140))
            surf.blit(overlay, (0, 0))
            msg = f"{'Player 1 (Blue)' if self.winner == 'blue' else 'AI (Red)'} Wins!"
            render_text_centered(surf, msg, get_font("5xl_b"), WHITE,
                                 (WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2 - 20))
            render_text_centered(surf, "Click 'New Game' to play again",
                                 get_font("lg"), SLATE_300,
                                 (WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2 + 40))

        # Info bar at bottom
        info_r = pygame.Rect(30, WINDOW_HEIGHT - 54, WINDOW_WIDTH - 60, 40)
        draw_rounded_rect(surf, DARK_CARD, info_r, 8, border=1,
                          border_color=DARK_BORDER)
        render_text_centered(
            surf,
            "A pixel-perfect implementation of a Checkers game board using Pygame. "
            "Switch between different game states to see various board configurations.",
            get_font("xs"), SLATE_400, info_r.center,
        )
