from __future__ import annotations

from math import floor

from game.moveGenerator import getLegalMoves

from services.externalAgent.adapter import from_external_move, to_external_state
from services.externalAgent.core.state import State, Turn


class ExternalAgent:
	def __init__(self, depth: int = 4):
		self.depth = max(1, int(depth))

	def get_move(self, game_state):
		board, player = self._extract_internal_state(game_state)
		legal_moves = getLegalMoves(board, player)
		if not legal_moves:
			return None

		external_state = to_external_state({"board": board, "currentPlayer": player})
		external_best = self._select_best_external_move(external_state)
		if external_best is None:
			return legal_moves[0]

		translated = from_external_move(external_best)
		return self._resolve_to_internal_legal_move(legal_moves, translated)

	def _extract_internal_state(self, game_state):
		if isinstance(game_state, dict):
			board = game_state.get("board")
			player = game_state.get("currentPlayer") or game_state.get("player")
		else:
			board = getattr(game_state, "board", None)
			player = getattr(game_state, "currentPlayer", None) or getattr(game_state, "player", None)

		if board is None:
			raise ValueError("game_state must provide board")
		if player not in ("blue", "red"):
			raise ValueError("game_state must provide current player as 'blue' or 'red'")

		return board, player

	def _select_best_external_move(self, state: State):
		successors = state.get_states()
		if not successors:
			return None

		maximizing = state.turn == Turn.BLACK
		best_score = -10000 if maximizing else 10000
		best_move = None

		for successor in successors:
			next_state = self._advance_turn(successor)
			score = self._alpha_beta(
				next_state,
				depth=self.depth - 1,
				alpha=-10000,
				beta=10000,
				maximizing_player=(next_state.turn == Turn.BLACK),
			)

			if maximizing and score > best_score:
				best_score = score
				best_move = successor.move
			elif (not maximizing) and score < best_score:
				best_score = score
				best_move = successor.move

		return best_move

	def _alpha_beta(self, state: State, depth: int, alpha: float, beta: float, maximizing_player: bool):
		if depth <= 0 or state.is_terminal_state():
			return self._heuristic_value(state)

		children = state.get_states()
		if not children:
			return self._heuristic_value(state)

		if maximizing_player:
			value = -10000
			for child in children:
				next_state = self._advance_turn(child)
				value = max(
					value,
					self._alpha_beta(next_state, depth - 1, alpha, beta, False),
				)
				alpha = max(alpha, value)
				if alpha >= beta:
					break
			return value

		value = 10000
		for child in children:
			next_state = self._advance_turn(child)
			value = min(
				value,
				self._alpha_beta(next_state, depth - 1, alpha, beta, True),
			)
			beta = min(beta, value)
			if beta <= alpha:
				break
		return value

	def _advance_turn(self, state: State) -> State:
		cloned = State(state.board.copy(), state.turn, state.move)
		cloned.change_turn()
		return cloned

	def _heuristic_value(self, state: State) -> float:
		# Deterministic evaluator adapted from external core/evaluation.py.
		board = state.board
		value = 0.0
		b2 = 0

		for i in range(63, -1, -1):
			if b2 == 8:
				b2 = 0

			piece = board[i]
			if piece == "-":
				b2 += 1
				if b2 == 8:
					b2 = 0
				continue

			b1 = floor(i / 8)
			if piece == "w":
				value -= 5 + 7 - b1 + abs(b2 - 4 + abs(b1 - 4))
			elif piece == "b":
				value += 5 + b1 + abs(b2 - 4) + abs(b1 - 4)
			elif piece == "W":
				value -= 14 + abs(b2 - 4) + abs(b1 - 4)
			elif piece == "B":
				value += 14 + abs(b2 - 4) + abs(b1 - 4)
			b2 += 1

		return value

	def _resolve_to_internal_legal_move(self, legal_moves: list[dict], translated_move: dict):
		fr = translated_move["from"]
		first_dest = translated_move["to"][0]

		exact: list[dict] = []
		same_source: list[dict] = []
		for move in legal_moves:
			if move["from"] == fr:
				same_source.append(move)
				if move["to"] and move["to"][0] == first_dest:
					exact.append(move)

		if exact:
			return max(exact, key=lambda m: len(m.get("captures", [])))

		if same_source:
			return max(same_source, key=lambda m: len(m.get("captures", [])))

		return legal_moves[0]
