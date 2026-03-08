"""
Unit tests for the checkers rules engine and GameController.

Run with:  python -m pytest tests/ -v
"""
import pytest

from game.board import initial_board, empty_board, count_pieces
from game.moves import (
    get_simple_moves, get_jumps, get_all_moves,
    get_legal_destinations, apply_move,
)
from game.game_logic import check_winner
from game.controller import GameController


# ═══════════════════════════════════════════════════════════════════════
# Board setup
# ═══════════════════════════════════════════════════════════════════════


class TestBoardSetup:
    def test_initial_piece_count(self):
        board = initial_board()
        counts = count_pieces(board)
        assert counts["blue"] == 12
        assert counts["red"] == 12

    def test_pieces_on_dark_squares_only(self):
        board = initial_board()
        for r in range(8):
            for c in range(8):
                if board[r][c] is not None:
                    assert (r + c) % 2 == 1, f"Piece on light square ({r},{c})"

    def test_empty_board_is_empty(self):
        board = empty_board()
        for r in range(8):
            for c in range(8):
                assert board[r][c] is None


# ═══════════════════════════════════════════════════════════════════════
# Simple (non-capturing) moves
# ═══════════════════════════════════════════════════════════════════════


class TestSimpleMoves:
    def test_red_man_moves_up(self):
        board = empty_board()
        board[5][2] = {"color": "red", "isKing": False}
        dests = get_simple_moves(board, 5, 2)
        assert set(dests) == {(4, 1), (4, 3)}

    def test_blue_man_moves_down(self):
        board = empty_board()
        board[2][3] = {"color": "blue", "isKing": False}
        dests = get_simple_moves(board, 2, 3)
        assert set(dests) == {(3, 2), (3, 4)}

    def test_king_moves_all_four_diagonals(self):
        board = empty_board()
        board[3][4] = {"color": "red", "isKing": True}
        dests = get_simple_moves(board, 3, 4)
        assert set(dests) == {(2, 3), (2, 5), (4, 3), (4, 5)}

    def test_blocked_by_own_piece(self):
        board = empty_board()
        board[5][2] = {"color": "red", "isKing": False}
        board[4][1] = {"color": "red", "isKing": False}
        dests = get_simple_moves(board, 5, 2)
        assert (4, 1) not in dests
        assert (4, 3) in dests

    def test_edge_piece_has_one_move(self):
        board = empty_board()
        board[5][0] = {"color": "red", "isKing": False}
        assert get_simple_moves(board, 5, 0) == [(4, 1)]


# ═══════════════════════════════════════════════════════════════════════
# Captures (jumps)
# ═══════════════════════════════════════════════════════════════════════


class TestCaptures:
    def test_single_jump(self):
        board = empty_board()
        board[4][3] = {"color": "red", "isKing": False}
        board[3][2] = {"color": "blue", "isKing": False}
        seqs = get_jumps(board, 4, 3)
        assert seqs == [[(2, 1)]]

    def test_double_jump(self):
        board = empty_board()
        board[6][1] = {"color": "red", "isKing": False}
        board[5][2] = {"color": "blue", "isKing": False}
        board[3][4] = {"color": "blue", "isKing": False}
        seqs = get_jumps(board, 6, 1)
        assert [(4, 3), (2, 5)] in seqs

    def test_mandatory_capture_rule(self):
        """When any capture exists, only jumps are returned."""
        board = empty_board()
        board[5][0] = {"color": "red", "isKing": False}
        board[4][1] = {"color": "blue", "isKing": False}
        board[5][4] = {"color": "red", "isKing": False}  # has simple moves only
        moves = get_all_moves(board, "red")
        assert all(m["is_jump"] for m in moves)

    def test_cannot_jump_own_piece(self):
        board = empty_board()
        board[4][3] = {"color": "red", "isKing": False}
        board[3][2] = {"color": "red", "isKing": False}
        assert get_jumps(board, 4, 3) == []

    def test_king_captures_backwards(self):
        board = empty_board()
        board[2][3] = {"color": "red", "isKing": True}
        board[3][4] = {"color": "blue", "isKing": False}
        seqs = get_jumps(board, 2, 3)
        assert [(4, 5)] in seqs


# ═══════════════════════════════════════════════════════════════════════
# King promotion
# ═══════════════════════════════════════════════════════════════════════


class TestKingPromotion:
    def test_red_promotes_at_row_0(self):
        board = empty_board()
        board[1][2] = {"color": "red", "isKing": False}
        move = {"from": (1, 2), "to": [(0, 1)], "is_jump": False}
        new_b = apply_move(board, move)
        assert new_b[0][1]["isKing"] is True

    def test_blue_promotes_at_row_7(self):
        board = empty_board()
        board[6][3] = {"color": "blue", "isKing": False}
        move = {"from": (6, 3), "to": [(7, 2)], "is_jump": False}
        new_b = apply_move(board, move)
        assert new_b[7][2]["isKing"] is True

    def test_no_promotion_mid_board(self):
        board = empty_board()
        board[3][2] = {"color": "red", "isKing": False}
        move = {"from": (3, 2), "to": [(2, 1)], "is_jump": False}
        new_b = apply_move(board, move)
        assert new_b[2][1]["isKing"] is False


# ═══════════════════════════════════════════════════════════════════════
# apply_move
# ═══════════════════════════════════════════════════════════════════════


class TestApplyMove:
    def test_simple_move_updates_board(self):
        board = empty_board()
        board[5][2] = {"color": "red", "isKing": False}
        move = {"from": (5, 2), "to": [(4, 3)], "is_jump": False}
        new_b = apply_move(board, move)
        assert new_b[5][2] is None
        assert new_b[4][3]["color"] == "red"

    def test_capture_removes_jumped_piece(self):
        board = empty_board()
        board[4][3] = {"color": "red", "isKing": False}
        board[3][2] = {"color": "blue", "isKing": False}
        move = {"from": (4, 3), "to": [(2, 1)], "is_jump": True}
        new_b = apply_move(board, move)
        assert new_b[4][3] is None
        assert new_b[3][2] is None   # captured piece removed
        assert new_b[2][1]["color"] == "red"

    def test_apply_does_not_mutate_original(self):
        board = empty_board()
        board[5][2] = {"color": "red", "isKing": False}
        move = {"from": (5, 2), "to": [(4, 3)], "is_jump": False}
        apply_move(board, move)
        assert board[5][2] is not None  # original unchanged


# ═══════════════════════════════════════════════════════════════════════
# Win / game-over detection
# ═══════════════════════════════════════════════════════════════════════


class TestWinDetection:
    def test_no_pieces_means_loss(self):
        board = empty_board()
        board[0][1] = {"color": "blue", "isKing": False}
        assert check_winner(board, "red") == "blue"

    def test_no_moves_means_loss(self):
        board = empty_board()
        board[0][1] = {"color": "red", "isKing": False}
        board[1][0] = {"color": "blue", "isKing": False}
        board[1][2] = {"color": "blue", "isKing": False}
        assert check_winner(board, "red") == "blue"

    def test_game_continues(self):
        assert check_winner(initial_board(), "blue") is None


# ═══════════════════════════════════════════════════════════════════════
# Opening-position sanity
# ═══════════════════════════════════════════════════════════════════════


class TestOpeningPosition:
    def test_blue_has_opening_moves(self):
        moves = get_all_moves(initial_board(), "blue")
        assert len(moves) == 7  # standard opening: 7 simple moves
        assert all(not m["is_jump"] for m in moves)

    def test_red_has_opening_moves(self):
        moves = get_all_moves(initial_board(), "red")
        assert len(moves) == 7
        assert all(not m["is_jump"] for m in moves)


# ═══════════════════════════════════════════════════════════════════════
# GameController
# ═══════════════════════════════════════════════════════════════════════


class TestGameController:
    def test_initial_state(self):
        ctrl = GameController()
        assert ctrl.turn == "blue"
        assert ctrl.move_count == 0
        assert not ctrl.is_over
        assert ctrl.winner is None

    def test_execute_move_switches_turn(self):
        ctrl = GameController()
        move = ctrl.legal_moves()[0]
        ctrl.execute_move(move)
        assert ctrl.turn == "red"
        assert ctrl.move_count == 1

    def test_undo_restores_state(self):
        ctrl = GameController()
        move = ctrl.legal_moves()[0]
        ctrl.execute_move(move)
        assert ctrl.undo()
        assert ctrl.turn == "blue"
        assert ctrl.move_count == 0

    def test_undo_on_empty_history(self):
        ctrl = GameController()
        assert not ctrl.undo()

    def test_resign(self):
        ctrl = GameController()
        ctrl.resign()  # blue resigns → red wins
        assert ctrl.winner == "red"
        assert ctrl.is_over

    def test_reset_clears_everything(self):
        ctrl = GameController()
        ctrl.execute_move(ctrl.legal_moves()[0])
        ctrl.reset()
        assert ctrl.turn == "blue"
        assert ctrl.move_count == 0
        assert not ctrl.is_over

    def test_find_move(self):
        ctrl = GameController()
        m = ctrl.legal_moves()[0]
        found = ctrl.find_move(m["from"], m["to"][0])
        assert found is not None
        assert found["from"] == m["from"]

    def test_piece_destinations(self):
        ctrl = GameController()
        # blue piece at (2,1) should have legal destinations
        dests = ctrl.piece_destinations(2, 1)
        assert len(dests) > 0

    def test_no_moves_after_game_over(self):
        ctrl = GameController()
        ctrl.resign()
        assert ctrl.legal_moves() == []
        assert ctrl.piece_destinations(2, 1) == []
