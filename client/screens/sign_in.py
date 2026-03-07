"""
Sign-In screen – mirrors SignIn.jsx.
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
from backend.auth_service import sign_in as auth_sign_in
from backend.profile_service import fetch_profile


class SignInScreen(BaseScreen):
    def __init__(self, app):
        super().__init__(app)
        # placeholders for GUI elements
        self.panel = None
        self.email_entry = None
        self.password_entry = None
        self.submit_btn = None
        self.back_btn = None
        self.error_label = None
        self.signup_label = None

    def create_ui(self):
        # build a centered panel to host the login form
        cx = WINDOW_WIDTH // 2
        cy = WINDOW_HEIGHT // 2
        card_w, card_h = 420, 380
        panel_rect = pygame.Rect(cx - card_w // 2, cy - card_h // 2,
                                 card_w, card_h)
        self.panel = pygame_gui.elements.UIPanel(
            relative_rect=panel_rect,
            starting_layer_height=1,
            manager=self.app.manager,
        )
        self.ui_elements.append(self.panel)

        # email and password inputs
        inp_w = card_w - 80
        self.email_entry = pygame_gui.elements.UITextEntryLine(
            relative_rect=pygame.Rect(40, 80, inp_w, 40),
            manager=self.app.manager,
            container=self.panel,
        )
        self.email_entry.set_text("")
        self.email_entry.set_placeholder_text("Enter your email")
        self.ui_elements.append(self.email_entry)

        self.password_entry = pygame_gui.elements.UITextEntryLine(
            relative_rect=pygame.Rect(40, 140, inp_w, 40),
            manager=self.app.manager,
            container=self.panel,
        )
        self.password_entry.set_text("")
        self.password_entry.set_placeholder_text("Enter your password")
        self.password_entry.set_text_hidden(True)
        self.ui_elements.append(self.password_entry)

        # submit button
        self.submit_btn = pygame_gui.elements.UIButton(
            relative_rect=pygame.Rect(40, 200, inp_w, 50),
            text="Sign In",
            manager=self.app.manager,
            container=self.panel,
            object_id="#primary_button",
        )
        self.ui_elements.append(self.submit_btn)

        # back button (outside panel to keep top-left)
        self.back_btn = pygame_gui.elements.UIButton(
            relative_rect=pygame.Rect(panel_rect.x + 12,
                                       panel_rect.y + 12, 80, 30),
            text="← Back",
            manager=self.app.manager,
            object_id="#back_button",
        )
        self.ui_elements.append(self.back_btn)

        # sign up link label
        self.signup_label = pygame_gui.elements.UILabel(
            relative_rect=pygame.Rect((panel_rect.centerx - 60) - panel_rect.x,
                                       280, 120, 24),
            text="Create Account",
            manager=self.app.manager,
            container=self.panel,
        )
        self.ui_elements.append(self.signup_label)

        # error message label (initially empty)
        self.error_label = pygame_gui.elements.UILabel(
            relative_rect=pygame.Rect(40, 260, inp_w, 24),
            text="",
            manager=self.app.manager,
            container=self.panel,
        )
        self.ui_elements.append(self.error_label)

    def _on_submit(self):
        email = self.email_entry.get_text().strip()
        pwd = self.password_entry.get_text().strip()
        if not email or not pwd:
            self.error_label.set_text("Please fill in all fields")
            return
        try:
            result = auth_sign_in(email, pwd)
            user = result["user"]
            username = (user.user_metadata or {}).get("username", email)
            profile = fetch_profile(email)
            if profile:
                username = profile.get("username", username)
            self.app.session.login({"email": email, "username": username})
            self.error_label.set_text("")
            self.app.switch("home")
        except Exception as e:
            self.error_label.set_text(str(e))

    def handle_event(self, ev):
        # pygame_gui events for button presses
        if ev.type == pygame_gui.UI_BUTTON_PRESSED:
            if ev.ui_element == self.submit_btn:
                self._on_submit()
            elif ev.ui_element == self.back_btn:
                self.app.switch("home")
        if ev.type == pygame_gui.UI_TEXT_ENTRY_FINISHED:
            if ev.ui_element == self.password_entry:
                self._on_submit()
        if ev.type == pygame.MOUSEBUTTONDOWN:
            # clicking sign-up label behaves like link
            if ev.ui_element == self.signup_label:
                self.app.switch("sign_up")

    def update(self, dt):
        # no per-frame logic required; GUI manager handles widget updates
        pass

    def draw(self, surf):
        surf.fill(BG_BLUE_50)
        # panel background is drawn by pygame_gui itself
        # Title
        cx = self.card_rect.centerx
        render_text_centered(surf, "Sign In", get_font("2xl_b"),
                             BLUE_900, (cx, self.card_rect.y + 80))
        # Inputs
        self.email.draw(surf)
        self.password.draw(surf)
        self.btn_submit.draw(surf)
        # Error
        if self.error_msg:
            render_text_centered(surf, self.error_msg, get_font("xs"),
                                 RED_500, (cx, self.card_rect.y + 300))
        # Sign-up link
        render_text_centered(surf, "Create Account", get_font("sm"),
                             BLUE_700, self.link_signup.center)
