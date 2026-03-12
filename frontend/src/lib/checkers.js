/**
 * checkers.js – JavaScript port of the Python game logic from game/
 *
 * Mirrors:
 *   game/board.py      → initialBoard, countPieces
 *   game/moves.py      → getAllMoves, getLegalDestinations, applyMove
 *   game/game_logic.py → checkWinner
 *   game/controller.py → used directly in GamePage state management
 *
 * Board representation
 * --------------------
 * An 8×8 array-of-arrays. Each cell is either null or an object:
 *   { color: "blue"|"red", isKing: boolean }
 *
 * Blue pieces start at the top (rows 0–2), red at the bottom (rows 5–7).
 * Pieces live on dark squares only – where (row + col) % 2 === 1.
 *
 * Standard American checkers rules:
 *   - Regular pieces move forward diagonally one square.
 *   - Kings move diagonally in any direction.
 *   - Captures (jumps) are mandatory – if any capture is available, the
 *     player must capture.
 *   - Multi-jumps must be completed in one turn.
 *   - A piece reaching the opposite back row is promoted to king.
 */

// ── Helpers ────────────────────────────────────────────────────────────

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

/** Forward diagonal directions for each colour. */
function forwardDirs(color) {
  // blue moves down (increasing row), red moves up (decreasing row)
  return color === 'blue' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
}

const ALL_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

// ── Board helpers ──────────────────────────────────────────────────────

/** Standard opening position – mirrors initial_board() in board.py. */
export function initialBoard() {
  const b = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) b[r][c] = { color: 'blue', isKing: false };
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) b[r][c] = { color: 'red', isKing: false };
  return b;
}

/** Count pieces for each colour – mirrors count_pieces() in board.py. */
export function countPieces(board) {
  const counts = { blue: 0, red: 0 };
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) counts[p.color]++;
    }
  return counts;
}

// ── Single-piece queries ───────────────────────────────────────────────

/** Non-capturing diagonal steps – mirrors get_simple_moves(). */
function getSimpleMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const dirs = piece.isKing ? ALL_DIRS : forwardDirs(piece.color);
  const moves = [];
  for (const [dr, dc] of dirs) {
    const nr = row + dr, nc = col + dc;
    if (inBounds(nr, nc) && board[nr][nc] === null) moves.push([nr, nc]);
  }
  return moves;
}

/**
 * All possible jump sequences from (row, col) – mirrors get_jumps().
 *
 * Each sequence is an array of [row, col] landing positions.
 * Multi-jumps are recursively expanded.
 */
function getJumps(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const dirs = piece.isKing ? ALL_DIRS : forwardDirs(piece.color);
  const sequences = [];

  for (const [dr, dc] of dirs) {
    const mr = row + dr, mc = col + dc;       // middle (captured) square
    const lr = row + 2 * dr, lc = col + 2 * dc; // landing square

    if (!inBounds(lr, lc)) continue;
    const mid = board[mr][mc];
    if (mid && mid.color !== piece.color && board[lr][lc] === null) {
      // Perform the jump on a copy and recurse
      const newBoard = deepCopy(board);
      newBoard[lr][lc] = newBoard[row][col];
      newBoard[row][col] = null;
      newBoard[mr][mc] = null;
      // King promotion mid-chain (for further jump direction checking)
      if ((piece.color === 'blue' && lr === 7) || (piece.color === 'red' && lr === 0)) {
        newBoard[lr][lc].isKing = true;
      }
      const further = getJumps(newBoard, lr, lc);
      if (further.length > 0) {
        for (const seq of further) sequences.push([[lr, lc], ...seq]);
      } else {
        sequences.push([[lr, lc]]);
      }
    }
  }
  return sequences;
}

// ── All-moves for a colour ─────────────────────────────────────────────

/**
 * Every legal move for the given colour – mirrors get_all_moves().
 *
 * Each move:  { from: [r,c], to: [[r,c],...], isJump: bool }
 *
 * If any jump exists, only jumps are returned (mandatory capture rule).
 */
export function getAllMoves(board, color) {
  const jumps = [];
  const simples = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;

      for (const seq of getJumps(board, r, c)) {
        jumps.push({ from: [r, c], to: seq, isJump: true });
      }
      // Only accumulate simple moves while no jump has been found anywhere
      if (jumps.length === 0) {
        for (const dest of getSimpleMoves(board, r, c)) {
          simples.push({ from: [r, c], to: [dest], isJump: false });
        }
      }
    }
  }
  return jumps.length > 0 ? jumps : simples;
}

/**
 * First-step squares the piece at (row, col) can reach – for UI highlighting.
 * Mirrors get_legal_destinations().
 */
export function getLegalDestinations(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const allMoves = getAllMoves(board, piece.color);
  const dests = new Set();
  for (const m of allMoves) {
    if (m.from[0] === row && m.from[1] === col) {
      dests.add(`${m.to[0][0]},${m.to[0][1]}`);
    }
  }
  return [...dests].map(s => s.split(',').map(Number));
}

// ── Applying a move ────────────────────────────────────────────────────

/**
 * Apply move and return a NEW board – mirrors apply_move().
 *
 * move: { from: [r,c], to: [[r,c],...], isJump: bool }
 */
export function applyMove(board, move) {
  const b = deepCopy(board);
  const [fr, fc] = move.from;
  const piece = b[fr][fc];
  b[fr][fc] = null;

  let prevR = fr, prevC = fc;
  for (const [nr, nc] of move.to) {
    if (move.isJump) {
      const mr = (prevR + nr) / 2;
      const mc = (prevC + nc) / 2;
      b[mr][mc] = null;
    }
    prevR = nr;
    prevC = nc;
  }

  // Place piece at final destination
  b[prevR][prevC] = piece;
  // King promotion
  if (piece.color === 'blue' && prevR === 7) b[prevR][prevC] = { ...piece, isKing: true };
  if (piece.color === 'red'  && prevR === 0) b[prevR][prevC] = { ...piece, isKing: true };
  return b;
}

// ── Winner detection ───────────────────────────────────────────────────

/**
 * Returns "blue", "red" if one side won, or null if the game continues.
 * Mirrors check_winner() in game_logic.py.
 *
 * A player loses when they have no pieces OR no legal moves on their turn.
 */
export function checkWinner(board, currentTurn) {
  const counts = countPieces(board);
  if (counts.blue === 0) return 'red';
  if (counts.red  === 0) return 'blue';
  if (getAllMoves(board, currentTurn).length === 0) {
    return currentTurn === 'blue' ? 'red' : 'blue';
  }
  return null;
}
