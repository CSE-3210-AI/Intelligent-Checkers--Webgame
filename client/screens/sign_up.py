"""
Sign-Up screen – mirrors SignUp.jsx.
Now uses backend.auth_service and backend.profile_service directly
(no Express / network.py).
"""
from __future__ import annotations
import pygame
from client.screens.base_screen import BaseScreen
from client.ui.colors import *
from client.ui.fonts import get_font
from client.ui.widgets import (
    TextInput, Button, draw_rounded_rect, render_text_centered,
)
from config import WINDOW_WIDTH, WINDOW_HEIGHT
from backend.auth_service import sign_up as auth_sign_up
from backend.profile_service import create_profile


class SignUpScreen(BaseScreen):
    def __init__(self, app):
        super().__init__(app)
        self.panel = None
        self.username_entry = None
        self.email_entry = None
        self.password_entry = None
        self.confirm_entry = None
        self.submit_btn = None
        self.back_btn = None
        self.error_label = None
        self.signin_label = None

    def create_ui(self):
        cx = WINDOW_WIDTH // 2
        cy = WINDOW_HEIGHT // 2
        card_w, card_h = 420, 500
        panel_rect = pygame.Rect(cx - card_w // 2, cy - card_h // 2,
                                 card_w, card_h)
        self.panel = pygame_gui.elements.UIPanel(
            relative_rect=panel_rect,
            starting_layer_height=1,
            manager=self.app.manager,
        )
        self.ui_elements.append(self.panel)

        inp_w = card_w - 80
        self.username_entry = pygame_gui.elements.UITextEntryLine(
            relative_rect=pygame.Rect(40, 80, inp_w, 40),
            manager=self.app.manager,
            container=self.panel,
        )
        self.username_entry.set_placeholder_text("Choose a username")
        self.ui_elements.append(self.username_entry)

        self.email_entry = pygame_gui.elements.UITextEntryLine(
            relative_rect=pygame.Rect(40, 140, inp_w, 40),
            manager=self.app.manager,
            container=self.panel,
        )
        self.email_entry.set_placeholder_text("Enter your email")
        self.ui_elements.append(self.email_entry)

        self.password_entry = pygame_gui.elements.UITextEntryLine(
            relative_rect=pygame.Rect(40, 200, inp_w, 40),
            manager=self.app.manager,
            container=self.panel,
        )
        self.password_entry.set_placeholder_text("Create a password")
        self.password_entry.set_text_hidden(True)
        self.ui_elements.append(self.password_entry)

        self.confirm_entry = pygame_gui.elements.UITextEntryLine(
            relative_rect=pygame.Rect(40, 260, inp_w, 40),
            manager=self.app.manager,
            container=self.panel,
        )
        self.confirm_entry.set_placeholder_text("Confirm your password")
        self.confirm_entry.set_text_hidden(True)
        self.ui_elements.append(self.confirm_entry)

        self.submit_btn = pygame_gui.elements.UIButton(
            relative_rect=pygame.Rect(40, 320, inp_w, 50),
            text="Sign Up",
            manager=self.app.manager,
            container=self.panel,
            object_id="#primary_button",
        )
        self.ui_elements.append(self.submit_btn)

        self.back_btn = pygame_gui.elements.UIButton(
            relative_rect=pygame.Rect(panel_rect.x + 12,
                                       panel_rect.y + 12, 80, 30),
            text="← Back",
            manager=self.app.manager,
            object_id="#back_button",
        )
        self.ui_elements.append(self.back_btn)

        self.signin_label = pygame_gui.elements.UILabel(
            relative_rect=pygame.Rect((panel_rect.centerx - 90) - panel_rect.x,
                                       380, 180, 24),
            text="Already have an account?",
            manager=self.app.manager,
            container=self.panel,
        )
        self.ui_elements.append(self.signin_label)

        self.error_label = pygame_gui.elements.UILabel(
            relative_rect=pygame.Rect(40, 360, inp_w, 24),
            text="",
            manager=self.app.manager,
            container=self.panel,
        )
        self.ui_elements.append(self.error_label)

    def _on_submit(self):
        uname = self.username_entry.get_text().strip()
        email = self.email_entry.get_text().strip()
        pwd = self.password_entry.get_text().strip()
        confirm = self.confirm_entry.get_text().strip()
        if not all([uname, email, pwd, confirm]):
            self.error_label.set_text("Please fill in all fields")
            return
        if pwd != confirm:
            self.error_label.set_text("Passwords do not match")
            return
        try:
            result = auth_sign_up(email, pwd, uname)
            user = result["user"]
            create_profile(user.id, email, uname)
            self.app.session.login({"email": email, "username": uname})
            self.error_label.set_text("")
            self.app.switch("home")
        except Exception as e:
            self.error_label.set_text(str(e))

    def handle_event(self, ev):
        if ev.type == pygame_gui.UI_BUTTON_PRESSED:
            if ev.ui_element == self.submit_btn:
                self._on_submit()
            elif ev.ui_element == self.back_btn:
                self.app.switch("home")
        if ev.type == pygame_gui.UI_TEXT_ENTRY_FINISHED:
            if ev.ui_element == self.confirm_entry:
                self._on_submit()
        if ev.type == pygame.MOUSEBUTTONDOWN:
            if ev.ui_element == self.signin_label:
                self.app.switch("sign_in")

    def update(self, dt):
        pass

    def draw(self, surf):
        surf.fill(BG_BLUE_50)
