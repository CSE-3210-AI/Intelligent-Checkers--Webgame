/**
 * board.js – Board representation and initialization.
 *
 * Board: 8×8 array-of-arrays.  Each cell is:
 *   null  – empty
 *   "b"   – blue piece   (moves downward, row++)
 *   "r"   – red piece    (moves upward,   row--)
 *   "bk"  – blue king
 *   "rk"  – red king
 *
 * Pieces occupy dark squares only: (row + col) % 2 === 1
 * Blue starts rows 0–2; Red starts rows 5–7.
 *
 * The compact string format is used throughout the backend and is what
 * the API transports.  The React frontend converts it to its own display
 * format via gameApi.js::toDisplayBoard().
 */

// ── Initialization ──────────────────────────────────────────────────────

/**
 * initializeBoard() – Standard opening position.
 * 12 blue pieces (top) + 12 red pieces (bottom).
 */
export function initializeBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));

  // Blue pieces – rows 0-2, dark squares
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) board[r][c] = 'b';

  // Red pieces – rows 5-7, dark squares
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) board[r][c] = 'r';

  return board;
}

// ── Cloning (critical for AI simulations) ──────────────────────────────

/**
 * cloneBoard(board) – Shallow-clone each row (cells are primitives).
 * Used throughout applyMove() and getJumpSequences() so the original
 * board is never mutated.  Minimax will call this on every simulated turn.
 */
export function cloneBoard(board) {
  return board.map(row => [...row]);
}

// ── Piece counting ──────────────────────────────────────────────────────

/**
 * countPieces(board) – Returns { blue: n, red: n }.
 * Kings count as regular pieces for win detection.
 */
export function countPieces(board) {
  let blue = 0, red = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p === 'b' || p === 'bk') blue++;
      else if (p === 'r' || p === 'rk') red++;
    }
  return { blue, red };
}

// ── Serialization (Supabase JSONB / HTTP transport) ─────────────────────

/** Serialize board to a JSON string. */
export function serializeBoard(board) {
  return JSON.stringify(board);
}

/** Deserialize board from a JSON string. */
export function deserializeBoard(str) {
  return JSON.parse(str);
}
