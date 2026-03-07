"""
Font helpers – loads system fonts once at startup.
"""
import pygame

_fonts: dict[str, pygame.font.Font] = {}


def init_fonts():
    """Call once after pygame.init()."""
    global _fonts
    _fonts = {
        "xs":       pygame.font.SysFont("segoeui", 13),
        "sm":       pygame.font.SysFont("segoeui", 15),
        "base":     pygame.font.SysFont("segoeui", 17),
        "lg":       pygame.font.SysFont("segoeui", 20),
        "xl":       pygame.font.SysFont("segoeui", 24),
        "2xl":      pygame.font.SysFont("segoeui", 28),
        "3xl":      pygame.font.SysFont("segoeui", 34),
        "4xl":      pygame.font.SysFont("segoeui", 42),
        "5xl":      pygame.font.SysFont("segoeui", 50),
        "6xl":      pygame.font.SysFont("segoeui", 60),

        "xs_b":     pygame.font.SysFont("segoeui", 13, bold=True),
        "sm_b":     pygame.font.SysFont("segoeui", 15, bold=True),
        "base_b":   pygame.font.SysFont("segoeui", 17, bold=True),
        "lg_b":     pygame.font.SysFont("segoeui", 20, bold=True),
        "xl_b":     pygame.font.SysFont("segoeui", 24, bold=True),
        "2xl_b":    pygame.font.SysFont("segoeui", 28, bold=True),
        "3xl_b":    pygame.font.SysFont("segoeui", 34, bold=True),
        "4xl_b":    pygame.font.SysFont("segoeui", 42, bold=True),
        "5xl_b":    pygame.font.SysFont("segoeui", 50, bold=True),
        "6xl_b":    pygame.font.SysFont("segoeui", 60, bold=True),
    }


def get_font(name: str = "base") -> pygame.font.Font:
    return _fonts.get(name, _fonts["base"])
