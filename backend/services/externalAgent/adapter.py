from __future__ import annotations

from services.externalAgent.core.state import State, Turn


_PIECE_TO_EXTERNAL = {
	None: "-",
	"b": "w",
	"bk": "W",
	"r": "b",
	"rk": "B",
}


def _extract_board_and_player(game_state):
	if isinstance(game_state, dict):
		board = game_state.get("board")
		player = game_state.get("currentPlayer") or game_state.get("player")
	else:
		board = getattr(game_state, "board", None)
		player = getattr(game_state, "currentPlayer", None) or getattr(game_state, "player", None)

	if board is None:
		raise ValueError("game_state must contain a board")
	if player not in ("blue", "red"):
		raise ValueError("game_state must contain current player as 'blue' or 'red'")

	return board, player


def _to_external_index(row: int, col: int) -> int:
	# Mirror columns so playable parity aligns with the external engine's indexing model.
	return row * 8 + (7 - col)


def _from_external_index(index: int) -> tuple[int, int]:
	row = index // 8
	mirrored_col = index % 8
	return row, 7 - mirrored_col


def to_external_state(game_state):
	board_2d, player = _extract_board_and_player(game_state)

	flat_board: list[str] = ["-"] * 64
	for row in range(8):
		for col in range(8):
			piece = board_2d[row][col]
			if piece not in _PIECE_TO_EXTERNAL:
				raise ValueError(f"Unsupported piece encoding at ({row}, {col}): {piece}")
			flat_board[_to_external_index(row, col)] = _PIECE_TO_EXTERNAL[piece]

	turn = Turn.BLACK if player == "red" else Turn.WHITE
	return State(flat_board, turn, [])


def from_external_move(move):
	if not isinstance(move, (list, tuple)) or len(move) != 2:
		raise ValueError("External move must be [from_index, to_index]")

	src = int(move[0])
	dst = int(move[1])
	fr, fc = _from_external_index(src)
	tr, tc = _from_external_index(dst)

	is_jump = abs(fr - tr) == 2 and abs(fc - tc) == 2
	captures = [[(fr + tr) // 2, (fc + tc) // 2]] if is_jump else []

	return {
		"from": [fr, fc],
		"to": [[tr, tc]],
		"isJump": is_jump,
		"captures": captures,
	}
