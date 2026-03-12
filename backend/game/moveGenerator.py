"""
moveGenerator.py – Legal move generation.
"""

from __future__ import annotations

from game.board import cloneBoard
from game.rules import PROMOTION_ROW, getMoveDirs, isPiece


def inBounds(r: int, c: int) -> bool:
    return 0 <= r < 8 and 0 <= c < 8


def isOpponent(piece: str | None, player: str) -> bool:
    if not piece:
        return False
    return piece in ("r", "rk") if player == "blue" else piece in ("b", "bk")


def getSimpleMoves(board, row: int, col: int):
    piece = board[row][col]
    if not piece:
        return []
    dirs = getMoveDirs(piece)
    moves = []

    for dr, dc in dirs:
        nr, nc = row + dr, col + dc
        if inBounds(nr, nc) and board[nr][nc] is None:
            moves.append(
                {
                    "from": [row, col],
                    "to": [[nr, nc]],
                    "isJump": False,
                    "captures": [],
                }
            )
    return moves


def getJumpSequences(board, row: int, col: int, alreadyCaptured: set[str] | None = None):
    if alreadyCaptured is None:
        alreadyCaptured = set()

    piece = board[row][col]
    if not piece:
        return []

    player = "blue" if piece[0] == "b" else "red"
    dirs = getMoveDirs(piece)
    sequences = []

    for dr, dc in dirs:
        mr, mc = row + dr, col + dc
        lr, lc = row + 2 * dr, col + 2 * dc

        if not inBounds(lr, lc):
            continue

        mid = board[mr][mc]
        mid_key = f"{mr},{mc}"

        if mid and isOpponent(mid, player) and board[lr][lc] is None and mid_key not in alreadyCaptured:
            nb = cloneBoard(board)
            nb[lr][lc] = nb[row][col]
            nb[row][col] = None
            nb[mr][mc] = None

            if nb[lr][lc] == "b" and lr == PROMOTION_ROW["blue"]:
                nb[lr][lc] = "bk"
            if nb[lr][lc] == "r" and lr == PROMOTION_ROW["red"]:
                nb[lr][lc] = "rk"

            new_captured = set(alreadyCaptured)
            new_captured.add(mid_key)

            further = getJumpSequences(nb, lr, lc, new_captured)

            if further:
                for seq in further:
                    sequences.append(
                        {
                            "to": [[lr, lc], *seq["to"]],
                            "captures": [[mr, mc], *seq["captures"]],
                        }
                    )
            else:
                sequences.append({"to": [[lr, lc]], "captures": [[mr, mc]]})

    return sequences


# ── Public API ────────────────────────────────────────────────────────────

def getPieceMoves(board, position):
    row, col = position
    piece = board[row][col]
    if not piece:
        return []

    jump_seqs = getJumpSequences(board, row, col)
    if jump_seqs:
        return [
            {
                "from": [row, col],
                "to": seq["to"],
                "isJump": True,
                "captures": seq["captures"],
            }
            for seq in jump_seqs
        ]

    return getSimpleMoves(board, row, col)


def getLegalMoves(board, player: str):
    jumps = []
    simples = []

    # Pass 1: jumps
    for r in range(8):
        for c in range(8):
            if not isPiece(board[r][c], player):
                continue
            seqs = getJumpSequences(board, r, c)
            for seq in seqs:
                jumps.append(
                    {
                        "from": [r, c],
                        "to": seq["to"],
                        "isJump": True,
                        "captures": seq["captures"],
                    }
                )

    if jumps:
        return jumps

    # Pass 2: simple moves
    for r in range(8):
        for c in range(8):
            if not isPiece(board[r][c], player):
                continue
            simples.extend(getSimpleMoves(board, r, c))

    return simples


def getLegalDestinations(board, player: str, position):
    all_moves = getLegalMoves(board, player)
    row, col = position
    dests = set()

    for m in all_moves:
        if m["from"][0] == row and m["from"][1] == col:
            dr, dc = m["to"][0]
            dests.add(f"{dr},{dc}")

    return [[int(v) for v in s.split(",")] for s in dests]
