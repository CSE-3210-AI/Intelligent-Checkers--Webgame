"""
Abstract base for every screen / page.
"""
from __future__ import annotations
import pygame
import pygame_gui


class BaseScreen:
    """Every screen implements these three methods and manages its GUI.

    Screens can override ``create_ui()`` to build their pygame_gui widgets
    and should call ``super().on_enter()`` / ``super().on_exit()`` when
    switching in or out.  The base class keeps track of elements so they can
    be cleaned up automatically.
    """

    def __init__(self, app):
        """
        *app* is the top-level Application instance so screens can call
        ``self.app.switch("screen_name")`` to navigate.
        """
        self.app = app
        self.ui_elements: list[pygame_gui.UIElement] = []

    # lifecycle helpers --------------------------------------------------
    def create_ui(self):
        """Called when the screen becomes active.  Override in subclasses."""
        pass

    def on_enter(self):
        """Setup UI when this screen is shown."""
        self.create_ui()

    def on_exit(self):
        """Cleanup all UI elements when leaving the screen."""
        for el in self.ui_elements:
            try:
                el.kill()
            except Exception:
                pass
        self.ui_elements.clear()

    # existing hooks remain available for subclasses to implement ----------
    def handle_event(self, ev: pygame.event.Event):
        raise NotImplementedError

    def update(self, dt: float):
        pass

    def draw(self, surf: pygame.Surface):
        raise NotImplementedError
