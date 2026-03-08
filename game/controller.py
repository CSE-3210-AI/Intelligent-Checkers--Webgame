"""
Game Controller – central game-state manager.

Owns the board, turn, history, captures, and winner state.
Completely agnostic about *who* is making the moves (human, AI, network).

Any player just calls ``legal_moves()``, picks one, and calls
``execute_move()``.
"""
from __future__ import annotations
import copy

from game.board import initial_board, count_pieces
from game.moves import get_all_moves, get_legal_destinations, apply_move
from game.game_logic import check_winner


def _opponent(color: str) -> str:
    """Return the other colour."""
    return "red" if color == "blue" else "blue"


class GameController:
    """Manages a single checkers game from start to finish."""

    def __init__(self) -> None:
        self.reset()

    # ── lifecycle ─────────────────────────────────────────────────────

    def reset(self) -> None:
        """Start (or restart) a fresh game."""
        self.board: list[list] = initial_board()
        self.turn: str = "blue"
        self.move_count: int = 0
        self.captures: dict[str, int] = {"blue": 0, "red": 0}
        self.winner: str | None = None
        self._history: list[dict] = []

    # ── queries ───────────────────────────────────────────────────────

    @property
    def is_over(self) -> bool:
        """True when a winner has been decided."""
        return self.winner is not None

    def legal_moves(self) -> list[dict]:
        """All legal moves for the side to move."""
        if self.is_over:
            return []
        return get_all_moves(self.board, self.turn)

    def piece_destinations(self, row: int, col: int) -> list[tuple[int, int]]:
        """First-step squares the piece at *(row, col)* can reach."""
        if self.is_over:
            return []
        piece = self.board[row][col]
        if not piece or piece["color"] != self.turn:
            return []
        return get_legal_destinations(self.board, row, col)

    def find_move(self, from_pos: tuple, to_pos: tuple) -> dict | None:
        """Return a legal move from *from_pos* whose first step is *to_pos*."""
        for m in self.legal_moves():
            if m["from"] == from_pos and m["to"][0] == to_pos:
                return m
        return None

    @property
    def can_undo(self) -> bool:
        return len(self._history) > 0

    # ── mutations ─────────────────────────────────────────────────────

    def execute_move(self, move: dict) -> int:
        """Apply *move*, update all state.  Returns number of pieces captured."""
        # snapshot for undo
        self._history.append({
            "board": copy.deepcopy(self.board),
            "turn": self.turn,
            "move_count": self.move_count,
            "captures": dict(self.captures),
        })

        old_counts = count_pieces(self.board)
        self.board = apply_move(self.board, move)
        new_counts = count_pieces(self.board)

        opp = _opponent(self.turn)
        captured = old_counts[opp] - new_counts[opp]
        self.captures[self.turn] += captured
        self.move_count += 1

        # switch turn & check end-of-game
        self.turn = opp
        self.winner = check_winner(self.board, self.turn)
        return captured

    def undo(self) -> bool:
        """Undo the last move.  Returns *True* on success."""
        if not self._history:
            return False
        snap = self._history.pop()
        self.board = snap["board"]
        self.turn = snap["turn"]
        self.move_count = snap["move_count"]
        self.captures = snap["captures"]
        self.winner = None
        return True

    def resign(self) -> None:
        """The side to move resigns; the opponent wins."""
        self.winner = _opponent(self.turn)
