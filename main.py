"""
StellarCheckers – Pygame Desktop Client
========================================
Entry point.  Manages the screen stack (like React Router) and the
main game loop.

    pip install -r requirements.txt
    python main.py
"""
from __future__ import annotations
import sys
import os

# Ensure the project root is on sys.path so absolute imports
# like  ``from backend.auth_service import ...``  always resolve.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pygame
import pygame_gui
from config import WINDOW_WIDTH, WINDOW_HEIGHT, FPS, APP_TITLE
from client.ui.fonts import init_fonts
from backend.user_session import UserSession

# ── Screen imports ────────────────────────────────────────────────────
from client.screens.home import HomeScreen
from client.screens.sign_in import SignInScreen
from client.screens.sign_up import SignUpScreen
from client.screens.ai_selection import AISelectionScreen
from client.screens.meet_agents import MeetAgentsScreen
from client.screens.select_internal_agent import SelectInternalAgentScreen
from client.screens.tournament_mode import TournamentModeScreen
from client.screens.tournament_internal import TournamentInternalScreen
from client.screens.tournament_online import TournamentOnlineScreen
from client.screens.game_page import GameScreen


class Application:
    """
    Top-level application object.

    Screens are registered by name.  ``switch(name)`` sets the active
    screen – exactly like ``navigate('/path')`` in React Router.
    """

    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption(APP_TITLE)
        self.clock = pygame.time.Clock()
        init_fonts()

        # pygame_gui manager (shared across screens)
        self.manager = pygame_gui.UIManager((WINDOW_WIDTH, WINDOW_HEIGHT))

        self.session = UserSession()

        # Register every screen (mirrors App.jsx <Routes>)
        self.screens: dict[str, object] = {
            "home":                   HomeScreen(self),
            "sign_in":                SignInScreen(self),
            "sign_up":                SignUpScreen(self),
            "ai_selection":           AISelectionScreen(self),
            "meet_agents":            MeetAgentsScreen(self),
            "select_internal_agent":  SelectInternalAgentScreen(self),
            "tournament_mode":        TournamentModeScreen(self),
            "tournament_internal":    TournamentInternalScreen(self),
            "tournament_online":      TournamentOnlineScreen(self),
            "game":                   GameScreen(self),
        }
        self.current_screen = self.screens["home"]
        self._history: list[str] = ["home"]

        # call on_enter for initial screen so it can build its UI
        self.current_screen.on_enter()

    def switch(self, name: str):
        """Navigate to a different screen (like useNavigate in React)."""
        if name in self.screens:
            # cleanup old screen UI
            self.current_screen.on_exit()
            self.current_screen = self.screens[name]
            self._history.append(name)
            # initialize new screen UI
            self.current_screen.on_enter()

    def go_back(self):
        """Navigate to the previous screen (like navigate(-1))."""
        if len(self._history) > 1:
            self._history.pop()
            self.current_screen = self.screens[self._history[-1]]

    def run(self):
        running = True
        while running:
            dt = self.clock.tick(FPS) / 1000.0

            for ev in pygame.event.get():
                # feed event to GUI manager first
                self.manager.process_events(ev)
                if ev.type == pygame.QUIT:
                    running = False
                elif ev.type == pygame.KEYDOWN and ev.key == pygame.K_ESCAPE:
                    self.go_back()
                else:
                    self.current_screen.handle_event(ev)

            if hasattr(self.current_screen, "update"):
                self.current_screen.update(dt)
            # update GUI manager regardless of screen
            self.manager.update(dt)

            self.current_screen.draw(self.screen)
            # draw GUI elements on top
            self.manager.draw_ui(self.screen)
            pygame.display.flip()

        pygame.quit()
        sys.exit()


def main():
    app = Application()
    app.run()


if __name__ == "__main__":
    main()
