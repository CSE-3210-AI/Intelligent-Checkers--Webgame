"""
Reusable pygame UI widgets that mirror the shadcn/ui + Tailwind look
from the React frontend.

All widgets follow the same pattern:
  - handle_event(event) → bool   (True if the event was consumed)
  - update(dt)                   (optional per-frame logic)
  - draw(surface)                (render onto the given surface)
"""
from __future__ import annotations
import pygame
from client.ui.colors import *
from client.ui.fonts import get_font


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────
def draw_rounded_rect(surf: pygame.Surface, color, rect: pygame.Rect,
                      radius: int = 12, border: int = 0,
                      border_color=None):
    """Draw a rounded rectangle, optionally with a border."""
    pygame.draw.rect(surf, color, rect, border_radius=radius)
    if border and border_color:
        pygame.draw.rect(surf, border_color, rect, width=border,
                         border_radius=radius)


def render_text_centered(surf, text, font, color, center_pos):
    ts = font.render(text, True, color)
    tr = ts.get_rect(center=center_pos)
    surf.blit(ts, tr)


def render_text_left(surf, text, font, color, pos):
    ts = font.render(text, True, color)
    surf.blit(ts, pos)


def word_wrap(text: str, font: pygame.font.Font, max_width: int) -> list[str]:
    """Break *text* into lines that fit within *max_width* pixels."""
    words = text.split()
    lines: list[str] = []
    current = ""
    for w in words:
        test = f"{current} {w}".strip()
        if font.size(test)[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


# ─────────────────────────────────────────────────────────────────────
# TextInput
# ─────────────────────────────────────────────────────────────────────
class TextInput:
    """Single-line text field (optionally password-masked)."""

    def __init__(self, rect: pygame.Rect, placeholder: str = "",
                 password: bool = False, font_name: str = "base"):
        self.rect = rect
        self.placeholder = placeholder
        self.password = password
        self.text = ""
        self.active = False
        self.font = get_font(font_name)
        self.cursor_visible = True
        self.cursor_timer = 0.0

    def handle_event(self, ev: pygame.event.Event) -> bool:
        if ev.type == pygame.MOUSEBUTTONDOWN:
            self.active = self.rect.collidepoint(ev.pos)
            return self.active
        if ev.type == pygame.KEYDOWN and self.active:
            if ev.key == pygame.K_BACKSPACE:
                self.text = self.text[:-1]
            elif ev.key in (pygame.K_RETURN, pygame.K_TAB):
                pass  # handled externally
            else:
                self.text += ev.unicode
            return True
        return False

    def update(self, dt: float):
        self.cursor_timer += dt
        if self.cursor_timer >= 0.53:
            self.cursor_visible = not self.cursor_visible
            self.cursor_timer = 0.0

    def draw(self, surf: pygame.Surface):
        bg = BLUE_50 if not self.active else (220, 235, 255)
        border_col = BLUE_400 if self.active else BLUE_200
        draw_rounded_rect(surf, bg, self.rect, radius=6,
                          border=2, border_color=border_col)
        display = "*" * len(self.text) if self.password else self.text
        if display:
            ts = self.font.render(display, True, BLACK)
        else:
            ts = self.font.render(self.placeholder, True, SLATE_400)
        clip = self.rect.inflate(-16, -4)
        surf.set_clip(clip)
        surf.blit(ts, (self.rect.x + 12,
                       self.rect.y + (self.rect.h - ts.get_height()) // 2))
        if self.active and self.cursor_visible:
            cx = self.rect.x + 12
            if display:
                cx += self.font.size(display)[0] + 2
            cy = self.rect.y + 8
            pygame.draw.line(surf, BLACK, (cx, cy),
                             (cx, cy + self.rect.h - 16), 2)
        surf.set_clip(None)


# ─────────────────────────────────────────────────────────────────────
# Button
# ─────────────────────────────────────────────────────────────────────
class Button:
    """Clickable button with gradient-style fill."""

    def __init__(self, rect: pygame.Rect, text: str, *,
                 bg=BLUE_600, hover_bg=BLUE_700, text_color=WHITE,
                 font_name: str = "base_b", callback=None,
                 border_radius: int = 8, border: int = 0,
                 border_color=None, outline: bool = False):
        self.rect = rect
        self.text = text
        self.bg = bg
        self.hover_bg = hover_bg
        self.text_color = text_color
        self.font = get_font(font_name)
        self.callback = callback
        self.hovered = False
        self.border_radius = border_radius
        self.border = border
        self.border_color = border_color
        self.outline = outline

    def handle_event(self, ev: pygame.event.Event) -> bool:
        if ev.type == pygame.MOUSEMOTION:
            self.hovered = self.rect.collidepoint(ev.pos)
        if ev.type == pygame.MOUSEBUTTONDOWN and self.rect.collidepoint(ev.pos):
            if self.callback:
                self.callback()
            return True
        return False

    def draw(self, surf: pygame.Surface):
        col = self.hover_bg if self.hovered else self.bg
        if self.outline:
            draw_rounded_rect(surf, WHITE, self.rect, self.border_radius,
                              border=2, border_color=SLATE_300)
        else:
            draw_rounded_rect(surf, col, self.rect, self.border_radius,
                              border=self.border,
                              border_color=self.border_color)
        render_text_centered(surf, self.text, self.font, self.text_color,
                             self.rect.center)


# ─────────────────────────────────────────────────────────────────────
# AgentCard
# ─────────────────────────────────────────────────────────────────────
class AgentCard:
    """Card showing an AI agent with avatar, name, method, description."""

    def __init__(self, rect: pygame.Rect, letter: str, name: str,
                 method: str, description: str, *,
                 accent=BLUE_500, border_color=BLUE_200,
                 selected: bool = False, selectable: bool = False,
                 on_click=None):
        self.rect = rect
        self.letter = letter
        self.name = name
        self.method = method
        self.description = description
        self.accent = accent
        self.border_color = border_color
        self.selected = selected
        self.selectable = selectable
        self.on_click = on_click
        self.hovered = False

    def handle_event(self, ev) -> bool:
        if ev.type == pygame.MOUSEMOTION:
            self.hovered = self.rect.collidepoint(ev.pos)
        if ev.type == pygame.MOUSEBUTTONDOWN and self.rect.collidepoint(ev.pos):
            if self.on_click:
                self.on_click()
            return True
        return False

    def draw(self, surf: pygame.Surface):
        bc = self.accent if self.selected else self.border_color
        bw = 3 if self.selected else 2
        draw_rounded_rect(surf, WHITE, self.rect, 16, border=bw,
                          border_color=bc)
        if self.selected:
            overlay = pygame.Surface((self.rect.w, self.rect.h), pygame.SRCALPHA)
            overlay.fill((*self.accent, 18))
            surf.blit(overlay, self.rect.topleft)

        cx = self.rect.centerx
        y = self.rect.y + 28

        # Avatar circle
        pygame.draw.circle(surf, self.accent, (cx, y + 28), 32)
        render_text_centered(surf, self.letter, get_font("2xl_b"),
                             WHITE, (cx, y + 28))
        y += 72

        # Name
        color = BLUE_800 if self.accent == BLUE_500 else SLATE_800
        render_text_centered(surf, self.name, get_font("2xl_b"), color,
                             (cx, y))
        y += 32

        # Method badge
        mf = get_font("xs_b")
        tw = mf.size(self.method)[0] + 24
        badge_rect = pygame.Rect(cx - tw // 2, y, tw, 26)
        badge_bg = BLUE_100 if self.accent == BLUE_500 else SLATE_200
        badge_tc = BLUE_800 if self.accent == BLUE_500 else SLATE_800
        draw_rounded_rect(surf, badge_bg, badge_rect, 13)
        render_text_centered(surf, self.method, mf, badge_tc,
                             badge_rect.center)
        y += 40

        # Strategy heading
        render_text_centered(surf, "Strategy Overview", get_font("sm_b"),
                             SLATE_700, (cx, y))
        y += 24

        # Description (word-wrapped)
        df = get_font("sm")
        for line in word_wrap(self.description, df, self.rect.w - 40):
            render_text_centered(surf, line, df, SLATE_600, (cx, y))
            y += 20


# ─────────────────────────────────────────────────────────────────────
# DifficultyCard
# ─────────────────────────────────────────────────────────────────────
class DifficultyCard:
    """Card for selecting AI difficulty."""

    def __init__(self, rect: pygame.Rect, diff_id: str, name: str,
                 desc: str, badge_text: str, accent, *,
                 selected: bool = False, on_click=None):
        self.rect = rect
        self.diff_id = diff_id
        self.name = name
        self.desc = desc
        self.badge_text = badge_text
        self.accent = accent
        self.selected = selected
        self.on_click = on_click
        self.hovered = False

    def handle_event(self, ev) -> bool:
        if ev.type == pygame.MOUSEMOTION:
            self.hovered = self.rect.collidepoint(ev.pos)
        if ev.type == pygame.MOUSEBUTTONDOWN and self.rect.collidepoint(ev.pos):
            if self.on_click:
                self.on_click()
            return True
        return False

    def draw(self, surf: pygame.Surface):
        bc = self.accent if self.selected else SLATE_200
        bw = 3 if self.selected else 1
        draw_rounded_rect(surf, WHITE, self.rect, 16, border=bw,
                          border_color=bc)
        cx = self.rect.centerx
        y = self.rect.y + 24

        icon_rect = pygame.Rect(cx - 32, y, 64, 64)
        draw_rounded_rect(surf, self.accent, icon_rect, 14)
        render_text_centered(surf, self.name[0], get_font("2xl_b"),
                             WHITE, icon_rect.center)
        y += 80

        render_text_centered(surf, self.name, get_font("2xl_b"),
                             SLATE_900, (cx, y))
        y += 30
        render_text_centered(surf, self.desc, get_font("base"),
                             SLATE_500, (cx, y))
        y += 32

        bf = get_font("xs")
        tw = bf.size(self.badge_text)[0] + 20
        br = pygame.Rect(cx - tw // 2, y, tw, 24)
        draw_rounded_rect(surf, SLATE_100, br, 12)
        render_text_centered(surf, self.badge_text, bf, SLATE_600,
                             br.center)


# ─────────────────────────────────────────────────────────────────────
# TournamentCard
# ─────────────────────────────────────────────────────────────────────
class TournamentCard:
    """Card for choosing tournament type."""

    def __init__(self, rect: pygame.Rect, title: str, desc: str,
                 tags: list[str], accent, *, on_click=None):
        self.rect = rect
        self.title = title
        self.desc = desc
        self.tags = tags
        self.accent = accent
        self.on_click = on_click
        self.hovered = False

    def handle_event(self, ev) -> bool:
        if ev.type == pygame.MOUSEMOTION:
            self.hovered = self.rect.collidepoint(ev.pos)
        if ev.type == pygame.MOUSEBUTTONDOWN and self.rect.collidepoint(ev.pos):
            if self.on_click:
                self.on_click()
            return True
        return False

    def draw(self, surf: pygame.Surface):
        bc = self.accent if self.hovered else BLUE_200
        draw_rounded_rect(surf, WHITE, self.rect, 16, border=2,
                          border_color=bc)
        cx = self.rect.centerx
        y = self.rect.y + 28

        ir = pygame.Rect(cx - 28, y, 56, 56)
        draw_rounded_rect(surf, self.accent, ir, 14)
        render_text_centered(surf, self.title[0], get_font("xl_b"),
                             WHITE, ir.center)
        y += 72

        render_text_centered(surf, self.title, get_font("2xl_b"),
                             SLATE_900, (cx, y))
        y += 32

        df = get_font("sm")
        for line in word_wrap(self.desc, df, self.rect.w - 40):
            render_text_centered(surf, line, df, SLATE_500, (cx, y))
            y += 20
        y += 12

        tf = get_font("xs")
        total_w = sum(tf.size(t)[0] + 24 for t in self.tags) + 8 * (len(self.tags) - 1)
        tx = cx - total_w // 2
        for tag in self.tags:
            tw = tf.size(tag)[0] + 24
            tr = pygame.Rect(tx, y, tw, 24)
            draw_rounded_rect(surf, SLATE_100, tr, 12)
            render_text_centered(surf, tag, tf, SLATE_600, tr.center)
            tx += tw + 8
