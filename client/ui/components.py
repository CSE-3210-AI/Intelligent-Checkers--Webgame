"""
Board & Piece rendering – mirrors Board.jsx, Piece.jsx, Square.jsx.
"""
from __future__ import annotations
import pygame
import math
from client.ui.colors import *


SQUARE_SIZE = 80          # 640 / 8
BOARD_PADDING = 6
BOARD_PX = SQUARE_SIZE * 8


def draw_piece(surf: pygame.Surface, cx: int, cy: int, color: str,
               is_king: bool, size: int = SQUARE_SIZE):
    """Draw a single checker piece (circle + optional king star)."""
    radius = int(size * 0.35)
    fill = PIECE_BLUE if color == "blue" else PIECE_RED
    pygame.draw.circle(surf, PIECE_OUTLINE, (cx, cy), radius + 3)
    pygame.draw.circle(surf, fill, (cx, cy), radius)
    if is_king:
        _draw_star(surf, cx, cy, int(radius * 0.55), BLACK)


def _draw_star(surf, cx, cy, r, color):
    """5-pointed star used as king indicator."""
    points = []
    for i in range(10):
        angle = math.radians(-90 + i * 36)
        rad = r if i % 2 == 0 else r * 0.4
        points.append((cx + rad * math.cos(angle),
                       cy + rad * math.sin(angle)))
    pygame.draw.polygon(surf, color, points)


def draw_board(surf: pygame.Surface, ox: int, oy: int,
               pieces: list[list], highlights: list[tuple] | None = None,
               selected: tuple | None = None,
               moveable: set | None = None):
    """
    Render the full 8×8 board at offset (ox, oy).

    Parameters
    ----------
    pieces    : 8×8 list – each cell is None or dict(color, isKing)
    highlights: (row, col) squares the selected piece can reach
    selected  : (row, col) of the currently selected piece
    moveable  : set of (row, col) of pieces the active player can move
    """
    hl_set  = set(highlights) if highlights else set()
    mv_set  = set(moveable)   if moveable  else set()

    border = pygame.Rect(ox - BOARD_PADDING, oy - BOARD_PADDING,
                         BOARD_PX + BOARD_PADDING * 2,
                         BOARD_PX + BOARD_PADDING * 2)
    pygame.draw.rect(surf, BLACK, border, border_radius=4)

    for r in range(8):
        for c in range(8):
            x  = ox + c * SQUARE_SIZE
            y  = oy + r * SQUARE_SIZE
            sq = pygame.Rect(x, y, SQUARE_SIZE, SQUARE_SIZE)
            cx = x + SQUARE_SIZE // 2
            cy = y + SQUARE_SIZE // 2

            # ── 1. Base square ────────────────────────────────────────
            is_dark  = (r + c) % 2 == 1
            sq_color = BOARD_DARK if is_dark else BOARD_LIGHT
            pygame.draw.rect(surf, sq_color, sq)

            # ── 2. Selected square: cyan tint + bright border ─────────
            if selected == (r, c):
                tint = pygame.Surface((SQUARE_SIZE, SQUARE_SIZE),
                                      pygame.SRCALPHA)
                tint.fill((80, 190, 255, 110))
                surf.blit(tint, (x, y))
                pygame.draw.rect(surf, (80, 210, 255), sq, 3)

            # ── 3. Legal-move destination: green semi-transparent dot ──
            if (r, c) in hl_set:
                dot = pygame.Surface((SQUARE_SIZE, SQUARE_SIZE),
                                     pygame.SRCALPHA)
                pygame.draw.circle(dot, (70, 220, 100, 210),
                                   (SQUARE_SIZE // 2, SQUARE_SIZE // 2), 16)
                surf.blit(dot, (x, y))

            # ── 4. Piece ──────────────────────────────────────────────
            piece = pieces[r][c]
            if piece:
                draw_piece(surf, cx, cy, piece["color"], piece["isKing"])

            # ── 5. Moveable ring (drawn OVER piece so it's always seen) ─
            if (r, c) in mv_set and selected != (r, c):
                pygame.draw.circle(surf, (255, 225, 50),
                                   (cx, cy),
                                   int(SQUARE_SIZE * 0.38), 2)
