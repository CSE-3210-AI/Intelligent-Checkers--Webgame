"""
Local user session – persists login state to a JSON file so the user
stays logged in between desktop-app runs.

Mirrors the localStorage-based UserContext.jsx from the React app.
"""
from __future__ import annotations
import json
import os

_SESSION_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", ".session.json"
)


class UserSession:
    def __init__(self):
        self.user: dict | None = None   # {"email": ..., "username": ...}
        self._load()

    # ── public API ────────────────────────────────────────────────────
    def login(self, user_data: dict):
        self.user = user_data
        self._save()

    def logout(self):
        self.user = None
        if os.path.exists(_SESSION_FILE):
            os.remove(_SESSION_FILE)

    @property
    def is_logged_in(self) -> bool:
        return self.user is not None

    @property
    def username(self) -> str:
        return self.user.get("username", "") if self.user else ""

    @property
    def email(self) -> str:
        return self.user.get("email", "") if self.user else ""

    # ── persistence ───────────────────────────────────────────────────
    def _save(self):
        with open(_SESSION_FILE, "w") as f:
            json.dump(self.user, f)

    def _load(self):
        if os.path.exists(_SESSION_FILE):
            try:
                with open(_SESSION_FILE) as f:
                    self.user = json.load(f)
            except (json.JSONDecodeError, OSError):
                self.user = None
