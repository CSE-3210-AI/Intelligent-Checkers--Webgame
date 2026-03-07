"""
Move generation, legal-move queries, and move application.

Standard American checkers rules:
* Regular pieces move forward diagonally by one square.
* Kings move diagonally in any direction.
* Captures (jumps) are mandatory.
* Multi-jumps must be completed.
* A piece reaching the opposite back row is promoted to king.
"""
from __future__ import annotations
import copy


# ── Internal helpers ──────────────────────────────────────────────────

def _in_bounds(r: int, c: int) -> bool:
    return 0 <= r < 8 and 0 <= c < 8


def _forward_dirs(color: str) -> list[tuple[int, int]]:
    """Forward diagonal directions for a given colour."""
    if color == "blue":
        return [(1, -1), (1, 1)]   # blue moves down
    return [(-1, -1), (-1, 1)]     # red moves up


def _all_dirs() -> list[tuple[int, int]]:
    return [(-1, -1), (-1, 1), (1, -1), (1, 1)]


# ── Single-piece queries ─────────────────────────────────────────────

def get_simple_moves(board, row: int, col: int) -> list[tuple[int, int]]:
    """Non-capturing diagonal steps for the piece at (row, col)."""
    piece = board[row][col]
    if not piece:
        return []
    dirs = _all_dirs() if piece["isKing"] else _forward_dirs(piece["color"])
    moves = []
    for dr, dc in dirs:
        nr, nc = row + dr, col + dc
        if _in_bounds(nr, nc) and board[nr][nc] is None:
            moves.append((nr, nc))
    return moves


def get_jumps(board, row: int, col: int, *, continued: bool = False) -> list[list[tuple]]:
    """
    Return all possible jump sequences from (row, col).

    Each sequence is a list of (row, col) landing positions.
    Multi-jumps are recursively expanded.
    """
    piece = board[row][col]
    if not piece:
        return []
    dirs = _all_dirs() if piece["isKing"] else _forward_dirs(piece["color"])
    sequences: list[list[tuple]] = []
    for dr, dc in dirs:
        mr, mc = row + dr, col + dc           # middle (captured) square
        lr, lc = row + 2 * dr, col + 2 * dc   # landing square
        if not _in_bounds(lr, lc):
            continue
        mid = board[mr][mc]
        if mid and mid["color"] != piece["color"] and board[lr][lc] is None:
            # Perform the jump on a copy and recurse
            new_board = copy.deepcopy(board)
            new_board[lr][lc] = new_board[row][col]
            new_board[row][col] = None
            new_board[mr][mc] = None
            # King promotion mid-chain
            if (piece["color"] == "blue" and lr == 7) or \
               (piece["color"] == "red" and lr == 0):
                new_board[lr][lc]["isKing"] = True
            further = get_jumps(new_board, lr, lc, continued=True)
            if further:
                for seq in further:
                    sequences.append([(lr, lc)] + seq)
            else:
                sequences.append([(lr, lc)])
    return sequences


# ── All-moves for a colour ────────────────────────────────────────────

def get_all_moves(board, color: str) -> list[dict]:
    """
    Return every legal move for *color*.

    Each move is::

        {
            "from": (r, c),
            "to": [(r, c), ...],   # length 1 for simple, ≥1 for jumps
            "is_jump": bool,
        }

    If any jump exists, only jumps are returned (mandatory capture).
    """
    jumps = []
    simples = []
    for r in range(8):
        for c in range(8):
            p = board[r][c]
            if not p or p["color"] != color:
                continue
            for seq in get_jumps(board, r, c):
                jumps.append({"from": (r, c), "to": seq, "is_jump": True})
            if not jumps:
                for dest in get_simple_moves(board, r, c):
                    simples.append({"from": (r, c), "to": [dest], "is_jump": False})
    return jumps if jumps else simples


def get_legal_destinations(board, row: int, col: int) -> list[tuple[int, int]]:
    """
    For UI highlighting: given a selected piece, return all squares it
    can reach (first step of any legal move).
    """
    piece = board[row][col]
    if not piece:
        return []
    all_moves = get_all_moves(board, piece["color"])
    dests = set()
    for m in all_moves:
        if m["from"] == (row, col):
            dests.add(m["to"][0])
    return list(dests)


# ── Applying a move ──────────────────────────────────────────────────

def apply_move(board, move: dict) -> list[list]:
    """
    Apply *move* (as returned by get_all_moves) and return a NEW board.
    """
    b = copy.deepcopy(board)
    fr, fc = move["from"]
    piece = b[fr][fc]
    b[fr][fc] = None

    prev_r, prev_c = fr, fc
    for nr, nc in move["to"]:
        if move["is_jump"]:
            # Remove captured piece
            mr = (prev_r + nr) // 2
            mc = (prev_c + nc) // 2
            b[mr][mc] = None
        prev_r, prev_c = nr, nc

    # Place piece at final destination
    b[prev_r][prev_c] = piece
    # King promotion
    if piece["color"] == "blue" and prev_r == 7:
        b[prev_r][prev_c]["isKing"] = True
    if piece["color"] == "red" and prev_r == 0:
        b[prev_r][prev_c]["isKing"] = True
    return b
