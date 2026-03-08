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
from game.controller import GameController


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

        # ── Game controller ───────────────────────────────────────────
        self.ctrl = GameController()
        self.game_mode: str = "hvh"   # "hvh" | "hvai"

        # ── UI-only state ─────────────────────────────────────────────
        self.selected: tuple | None = None
        self.highlights: list[tuple] = []
        self.active_tab = "initial"
        self.preset_mode = False  # True = viewing demo presets; False = playing
        self._preview_board: list[list] = initial_board()

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

        # ── Demo boards toggle (shown only in play mode) ──────────────
        demo_x = self.board_ox - BOARD_PADDING
        demo_w = BOARD_PX + BOARD_PADDING * 2
        self.btn_demo = Button(
            pygame.Rect(demo_x + demo_w - 152, self.board_oy - 50, 152, 36),
            "Demo Boards",
            bg=DARK_CARD, hover_bg=(50, 65, 100),
            text_color=SLATE_300, font_name="sm_b",
            callback=self._show_demos,
            border=1, border_color=DARK_BORDER,
        )
        # ── Play button (shown only in demo mode) ─────────────────────
        self.btn_play = Button(
            pygame.Rect(demo_x + demo_w - 152, self.board_oy - 50, 152, 36),
            "▶  Play Game",
            bg=EMERALD_500, hover_bg=(10, 160, 110), text_color=WHITE,
            font_name="sm_b", callback=self._new_game,
        )

    # ── public entry point (called before app.switch("game")) ────────
    def start_game(self, mode: str = "hvh") -> None:
        """Reset everything and configure who is playing."""
        self.game_mode = mode
        self.ctrl.reset()
        self.selected = None
        self.highlights = []
        self.preset_mode = False
        self.start_time = time.time()

    # ── actions ───────────────────────────────────────────────────────
    def _new_game(self):
        self.ctrl.reset()
        self.selected = None
        self.highlights = []
        self.preset_mode = False
        self.start_time = time.time()

    def _undo(self):
        if self.ctrl.undo():
            self.selected = None
            self.highlights = []

    def _resign(self):
        if not self.ctrl.is_over:
            self.ctrl.resign()

    def _show_demos(self):
        """Switch to demo/preset viewing mode."""
        self.preset_mode = True
        self.selected = None
        self.highlights = []

    # ── events ────────────────────────────────────────────────────────
    def handle_event(self, ev):
        self.btn_home.handle_event(ev)
        self.btn_new.handle_event(ev)
        self.btn_undo.handle_event(ev)
        self.btn_resign.handle_event(ev)
        # toggle buttons – only the relevant one is active
        if self.preset_mode:
            self.btn_play.handle_event(ev)
        else:
            self.btn_demo.handle_event(ev)

        if ev.type == pygame.MOUSEBUTTONDOWN:
            # Tab clicks – only in demo mode
            if self.preset_mode:
                for key, rect in self.tab_rects.items():
                    if rect.collidepoint(ev.pos):
                        self.active_tab = key
                        label, factory, hl = _PRESETS[key]
                        self._preview_board = factory()
                        self.highlights = list(hl)
                        self.selected = None
                        return

            # Board clicks (only when playing)
            if not self.preset_mode and not self.ctrl.is_over:
                mx, my = ev.pos
                col = (mx - self.board_ox) // SQUARE_SIZE
                row = (my - self.board_oy) // SQUARE_SIZE
                if 0 <= row < 8 and 0 <= col < 8:
                    self._handle_board_click(row, col)

    def _handle_board_click(self, row: int, col: int):
        board = self.ctrl.board
        piece = board[row][col]

        # If clicking a highlighted (legal) destination → make the move
        if self.selected and (row, col) in self.highlights:
            move = self.ctrl.find_move(self.selected, (row, col))
            if move:
                self.ctrl.execute_move(move)
                self.selected = None
                self.highlights = []
            return

        # Selecting own piece
        if piece and piece["color"] == self.ctrl.turn:
            self.selected = (row, col)
            self.highlights = self.ctrl.piece_destinations(row, col)
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

        # Mode pill
        mode_label = "vs Human" if self.game_mode == "hvh" else "vs AI"
        vr = pygame.Rect(WINDOW_WIDTH - 155, 20, 110, 36)
        draw_rounded_rect(surf, DARK_CARD, vr, 8, border=1,
                          border_color=DARK_BORDER)
        render_text_centered(surf, mode_label, get_font("sm_b"),
                             WHITE, vr.center)

        # ── Tabs (demo mode) or game-mode banner (play mode) ─────────
        if self.preset_mode:
            for key, rect in self.tab_rects.items():
                active = key == self.active_tab
                bg = WHITE if active else DARK_CARD
                tc = SLATE_900 if active else SLATE_400
                draw_rounded_rect(surf, bg, rect, 6)
                label = _PRESETS[key][0]
                render_text_centered(surf, label, get_font("sm_b"), tc,
                                     rect.center)
            self.btn_play.draw(surf)
        else:
            # Playing-mode banner
            banner_x = self.board_ox - BOARD_PADDING
            banner_y = self.board_oy - 50
            mode_text = (
                "Human vs Human"
                if self.game_mode == "hvh" else "Human vs AI"
            )
            accent = EMERALD_500 if self.game_mode == "hvh" else BLUE_500
            pill_r = pygame.Rect(banner_x, banner_y, 200, 36)
            draw_rounded_rect(surf, accent, pill_r, 8)
            render_text_centered(surf, mode_text, get_font("sm_b"),
                                 WHITE, pill_r.center)
            # whose-turn mini indicator next to the pill
            who = "Blue's turn" if self.ctrl.turn == "blue" else "Red's turn"
            who_col = PIECE_BLUE if self.ctrl.turn == "blue" else PIECE_RED
            render_text_left(surf, who, get_font("sm_b"), who_col,
                             (banner_x + 210, banner_y + 8))
            self.btn_demo.draw(surf)

        # ── Board ─────────────────────────────────────────────────────
        card_r = pygame.Rect(
            self.board_ox - BOARD_PADDING - 14,
            self.board_oy - BOARD_PADDING - 14,
            BOARD_PX + BOARD_PADDING * 2 + 28,
            BOARD_PX + BOARD_PADDING * 2 + 28,
        )
        draw_rounded_rect(surf, DARK_CARD, card_r, 12, border=1,
                          border_color=DARK_BORDER)

        board = self._preview_board if self.preset_mode else self.ctrl.board
        # Pieces the active player can legally move – shown with yellow ring
        moveable: set = set()
        if not self.preset_mode and not self.ctrl.is_over:
            moveable = {m["from"] for m in self.ctrl.legal_moves()}
        draw_board(surf, self.board_ox, self.board_oy, board,
                   self.highlights, self.selected, moveable)

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

        # Active-player glow strip
        is_playing = not self.preset_mode and not self.ctrl.is_over
        if is_playing:
            if self.ctrl.turn == "blue":
                glow_r = pygame.Rect(sx, py, sw, 76)
                glow_col = (*BLUE_500, 30)
            else:
                glow_r = pygame.Rect(sx, py + 76, sw, 84)
                glow_col = (*RED_500, 30)
            glow_surf = pygame.Surface((glow_r.w, glow_r.h), pygame.SRCALPHA)
            glow_surf.fill(glow_col)
            surf.blit(glow_surf, glow_r.topleft)

        # Player 1 row
        p1_dot_col = PIECE_BLUE if (is_playing and self.ctrl.turn == "blue") else BLUE_500
        pygame.draw.circle(surf, p1_dot_col, (sx + 30, py + 36), 18)
        if is_playing and self.ctrl.turn == "blue":
            pygame.draw.circle(surf, (80, 210, 255), (sx + 30, py + 36), 22, 2)
        render_text_left(surf, "Player 1", get_font("base_b"), WHITE,
                         (sx + 56, py + 20))
        render_text_left(surf, "Blue Pieces", get_font("xs"),
                         SLATE_400, (sx + 56, py + 42))
        bcount = count_pieces(board)["blue"]
        bc_r = pygame.Rect(sx + sw - 48, py + 24, 36, 26)
        draw_rounded_rect(surf, BLUE_500, bc_r, 6)
        render_text_centered(surf, str(bcount), get_font("sm_b"),
                             WHITE, bc_r.center)

        # Separator
        pygame.draw.line(surf, DARK_BORDER, (sx + 16, py + 76),
                         (sx + sw - 16, py + 76), 1)

        # Player 2 / AI row
        p2_label = "Player 2" if self.game_mode == "hvh" else "AI Opponent"
        p2_dot_col = PIECE_RED if (is_playing and self.ctrl.turn == "red") else RED_500
        pygame.draw.circle(surf, p2_dot_col, (sx + 30, py + 112), 18)
        if is_playing and self.ctrl.turn == "red":
            pygame.draw.circle(surf, (255, 130, 130), (sx + 30, py + 112), 22, 2)
        render_text_left(surf, p2_label, get_font("base_b"), WHITE,
                         (sx + 56, py + 96))
        render_text_left(surf, "Red Pieces", get_font("xs"),
                         SLATE_400, (sx + 56, py + 118))
        rcount = count_pieces(board)["red"]
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
        if self.ctrl.turn == "blue":
            turn_label = "Player 1"
        else:
            turn_label = "Player 2" if self.game_mode == "hvh" else "AI"
        tbg = BLUE_500 if self.ctrl.turn == "blue" else RED_500
        tl_r = pygame.Rect(sx + sw - 80, sy + 48, 68, 24)
        draw_rounded_rect(surf, tbg, tl_r, 6)
        render_text_centered(surf, turn_label, get_font("xs_b"), WHITE,
                             tl_r.center)
        # Move count
        render_text_left(surf, "Move Count", get_font("sm"),
                         SLATE_400, (sx + 16, sy + 88))
        render_text_left(surf, str(self.ctrl.move_count), get_font("sm_b"),
                         WHITE, (sx + sw - 40, sy + 88))
        # Captures
        render_text_left(surf, "Captures", get_font("sm"),
                         SLATE_400, (sx + 16, sy + 120))
        cap_text = f"{self.ctrl.captures['blue']} - {self.ctrl.captures['red']}"
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
        if self.ctrl.winner:
            overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 140))
            surf.blit(overlay, (0, 0))
            if self.ctrl.winner == "blue":
                msg = "Player 1 (Blue) Wins!"
            else:
                msg = "Player 2 (Red) Wins!" if self.game_mode == "hvh" else "AI (Red) Wins!"
            render_text_centered(surf, msg, get_font("5xl_b"), WHITE,
                                 (WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2 - 20))
            render_text_centered(surf, "Click 'New Game' to play again",
                                 get_font("lg"), SLATE_300,
                                 (WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2 + 40))

        # Info bar at bottom
        info_r = pygame.Rect(30, WINDOW_HEIGHT - 54, WINDOW_WIDTH - 60, 40)
        draw_rounded_rect(surf, DARK_CARD, info_r, 8, border=1,
                          border_color=DARK_BORDER)
        info_msg = (
            "DEMO MODE – Click a tab to preview board states.  "
            "Click '\u25b6  Play Game' to start a real match."
            if self.preset_mode else
            "PLAYING – Click a piece to select it, "
            "then click a highlighted square to move.  "
            "Captures are mandatory.  Multi-jumps are completed in one turn."
        )
        render_text_centered(surf, info_msg, get_font("xs"), SLATE_400,
                             info_r.center)
