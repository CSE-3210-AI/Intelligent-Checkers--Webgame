"""Monte Carlo Tree Search implementation for Agent Adiba."""

from __future__ import annotations

import math
import random
import time

from game.gameState import applyMove, checkWin
from game.moveGenerator import getLegalMoves
from game.rules import isPiece, switchTurn

from services.agentAdiba.fuzzy_logic import move_signature


def _opponent(player: str) -> str:
    return "red" if player == "blue" else "blue"


def _quick_piece_value(board, ai_player: str) -> float:
    ai_count = 0
    opp_count = 0

    for r in range(8):
        for c in range(8):
            piece = board[r][c]
            if not piece:
                continue
            if piece[0] == ai_player[0]:
                ai_count += 1
            else:
                opp_count += 1

    raw = (ai_count - opp_count + 12) / 24
    return max(0.0, min(1.0, raw))


def _is_move_legal(board, player: str, move: dict) -> bool:
    fr = move.get("from", [])
    if len(fr) != 2:
        return False

    sr, sc = fr
    if not (0 <= sr < 8 and 0 <= sc < 8):
        return False

    if not isPiece(board[sr][sc], player):
        return False

    legal = getLegalMoves(board, player)
    key = move_signature(move)
    return any(move_signature(m) == key for m in legal)


class MCTSNode:
    def __init__(
        self,
        board,
        player: str,
        ai_player: str,
        move: dict | None = None,
        parent: "MCTSNode | None" = None,
        prior: float = 0.5,
    ):
        self.board = board
        self.player = player
        self.ai_player = ai_player
        self.move = move
        self.parent = parent
        self.prior = prior

        self.children: list[MCTSNode] = []
        self.visits = 0
        self.wins = 0.0
        self.untried_moves = getLegalMoves(board, player)

    def is_terminal(self) -> bool:
        return checkWin(self.board, self.player) is not None

    def fully_expanded(self) -> bool:
        return len(self.untried_moves) == 0


def _uct_score(parent_visits: int, child: MCTSNode, c: float) -> float:
    if child.visits == 0:
        return float("inf")
    exploit = child.wins / child.visits
    explore = c * math.sqrt(math.log(max(1, parent_visits)) / child.visits)
    fuzzy_bias = 0.25 * child.prior / (1 + child.visits)
    return exploit + explore + fuzzy_bias


def _selection(root: MCTSNode, c: float) -> MCTSNode:
    node = root
    while not node.is_terminal() and node.fully_expanded() and node.children:
        node = max(node.children, key=lambda child: _uct_score(node.visits, child, c))
    return node


def _expansion(node: MCTSNode, priors_by_signature: dict[tuple, float]) -> MCTSNode:
    if not node.untried_moves:
        return node

    idx = random.randrange(len(node.untried_moves))
    move = node.untried_moves.pop(idx)

    if not _is_move_legal(node.board, node.player, move):
        return node

    board_after = applyMove(node.board, move)
    next_player = switchTurn(node.player)
    prior = priors_by_signature.get(move_signature(move), 0.5)

    child = MCTSNode(
        board=board_after,
        player=next_player,
        ai_player=node.ai_player,
        move=move,
        parent=node,
        prior=prior,
    )
    node.children.append(child)
    return child


def _simulation(node: MCTSNode, max_plies: int = 80) -> float:
    board = node.board
    player = node.player

    for _ in range(max_plies):
        winner = checkWin(board, player)
        if winner:
            return 1.0 if winner == node.ai_player else 0.0

        moves = getLegalMoves(board, player)
        if not moves:
            return 0.0 if player == node.ai_player else 1.0

        move = random.choice(moves)
        if not _is_move_legal(board, player, move):
            continue

        board = applyMove(board, move)
        player = _opponent(player)

    return _quick_piece_value(board, node.ai_player)


def _backpropagation(node: MCTSNode, result: float) -> None:
    cur = node
    while cur is not None:
        cur.visits += 1
        cur.wins += result
        cur = cur.parent


def run_mcts(
    board,
    player: str,
    simulations: int,
    priors_by_signature: dict[tuple, float] | None = None,
    uct_c: float = 1.35,
    time_budget_ms: int = 900,
) -> dict:
    priors_by_signature = priors_by_signature or {}

    root = MCTSNode(board=board, player=player, ai_player=player)
    root.untried_moves = [m for m in root.untried_moves if _is_move_legal(board, player, m)]

    if not root.untried_moves:
        return {
            "move": None,
            "win_probability": 0.0,
            "iterations": 0,
        }

    start = time.perf_counter()
    iterations = 0

    while iterations < simulations:
        elapsed_ms = (time.perf_counter() - start) * 1000
        if elapsed_ms >= time_budget_ms:
            break

        node = _selection(root, c=uct_c)
        if not node.is_terminal():
            node = _expansion(node, priors_by_signature)

        result = _simulation(node)
        _backpropagation(node, result)
        iterations += 1

    if not root.children:
        fallback = root.untried_moves[0]
        return {
            "move": fallback,
            "win_probability": 0.5,
            "iterations": iterations,
        }

    best_child = sorted(
        root.children,
        key=lambda c: (c.visits, c.wins / max(1, c.visits)),
        reverse=True,
    )[0]

    win_prob = best_child.wins / max(1, best_child.visits)
    return {
        "move": best_child.move,
        "win_probability": round(max(0.0, min(1.0, win_prob)), 3),
        "iterations": iterations,
    }
