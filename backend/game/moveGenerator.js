/**
 * moveGenerator.js – Legal move generation.
 *
 * Implements:
 *   - Simple (non-capturing) moves
 *   - Mandatory-capture rule: if any capture exists for any piece,
 *     ONLY captures are returned for the whole player.
 *   - Multi-jump captures: recursively expanded into full sequences.
 *   - King promotion mid-chain (a piece crowned during a jump can
 *     immediately continue in the new king directions).
 *
 * Move object shape:
 * {
 *   from:     [row, col],
 *   to:       [[r,c], [r,c], …],  // full path of landing squares
 *   isJump:   boolean,
 *   captures: [[r,c], [r,c], …],  // squares whose pieces are removed
 * }
 *
 * This module imports ONLY from board.js and rules.js – no circular deps.
 */

import { cloneBoard } from './board.js';
import { isPiece, getMoveDirs, PROMOTION_ROW } from './rules.js';

// ── Bounds check ─────────────────────────────────────────────────────────

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// ── Opponent-piece check ─────────────────────────────────────────────────

function isOpponent(piece, player) {
  if (!piece) return false;
  return player === 'blue'
    ? (piece === 'r' || piece === 'rk')
    : (piece === 'b' || piece === 'bk');
}

// ── Simple (non-capturing) moves ─────────────────────────────────────────

function getSimpleMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const dirs  = getMoveDirs(piece);
  const moves = [];

  for (const [dr, dc] of dirs) {
    const nr = row + dr, nc = col + dc;
    if (inBounds(nr, nc) && board[nr][nc] === null) {
      moves.push({
        from:     [row, col],
        to:       [[nr, nc]],
        isJump:   false,
        captures: [],
      });
    }
  }
  return moves;
}

// ── Jump (capture) sequences ─────────────────────────────────────────────

/**
 * getJumpSequences(board, row, col, alreadyCaptured)
 *
 * Recursively generate every possible jump sequence from (row, col).
 *
 * Returns an array of sequence descriptors:
 *   [{ to: [[r,c], …], captures: [[mr,mc], …] }, …]
 *
 * alreadyCaptured is a Set of "mr,mc" keys for pieces already removed in
 * this chain – prevents double-jumping the same square.
 */
function getJumpSequences(board, row, col, alreadyCaptured = new Set()) {
  const piece = board[row][col];
  if (!piece) return [];

  const player    = piece[0] === 'b' ? 'blue' : 'red';
  const dirs      = getMoveDirs(piece);
  const sequences = [];

  for (const [dr, dc] of dirs) {
    const mr = row + dr,     mc = col + dc;       // middle (captured) square
    const lr = row + 2 * dr, lc = col + 2 * dc;  // landing square

    if (!inBounds(lr, lc)) continue;

    const mid      = board[mr][mc];
    const midKey   = `${mr},${mc}`;

    // Jump conditions:
    //  1. Middle square has an opponent piece.
    //  2. Landing square is empty.
    //  3. Middle square was not already captured in this chain.
    if (
      mid &&
      isOpponent(mid, player) &&
      board[lr][lc] === null &&
      !alreadyCaptured.has(midKey)
    ) {
      // Simulate the jump on a copy for further recursion.
      const nb = cloneBoard(board);
      nb[lr][lc]   = nb[row][col];
      nb[row][col] = null;
      nb[mr][mc]   = null;

      // Apply king promotion mid-chain so a newly crowned king can
      // immediately use all four directions in subsequent jumps.
      if (nb[lr][lc] === 'b' && lr === PROMOTION_ROW.blue) nb[lr][lc] = 'bk';
      if (nb[lr][lc] === 'r' && lr === PROMOTION_ROW.red)  nb[lr][lc] = 'rk';

      const newCaptured = new Set(alreadyCaptured);
      newCaptured.add(midKey);

      const further = getJumpSequences(nb, lr, lc, newCaptured);

      if (further.length > 0) {
        // Prepend this jump to each continuation sequence.
        for (const seq of further) {
          sequences.push({
            to:       [[lr, lc], ...seq.to],
            captures: [[mr, mc], ...seq.captures],
          });
        }
      } else {
        // No further jumps – this is a terminal sequence.
        sequences.push({ to: [[lr, lc]], captures: [[mr, mc]] });
      }
    }
  }
  return sequences;
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * getPieceMoves(board, position)
 *
 * All move sequences for the single piece at position [row, col].
 * Returns jumps if any exist; otherwise returns simple moves.
 *
 * NOTE: This does NOT enforce the mandatory-capture rule globally
 * (i.e. it may return simple moves even if another piece can jump).
 * Use getLegalMoves() for full rule enforcement.
 */
export function getPieceMoves(board, position) {
  const [row, col] = position;
  const piece      = board[row][col];
  if (!piece) return [];

  const jumpSeqs = getJumpSequences(board, row, col);
  if (jumpSeqs.length > 0) {
    return jumpSeqs.map(seq => ({
      from:     [row, col],
      to:       seq.to,
      isJump:   true,
      captures: seq.captures,
    }));
  }
  return getSimpleMoves(board, row, col);
}

/**
 * getLegalMoves(board, player)
 *
 * Every legal move for player on the given board.
 *
 * Mandatory-capture rule: if any piece belonging to player can jump,
 * ONLY jump moves are returned.  Simple moves are omitted entirely.
 *
 * Two-pass algorithm:
 *   Pass 1 – collect all jumps for all pieces.
 *   Pass 2 – only if no jumps found, collect all simple moves.
 */
export function getLegalMoves(board, player) {
  const jumps   = [];
  const simples = [];

  // Pass 1: jumps
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (!isPiece(board[r][c], player)) continue;
      const seqs = getJumpSequences(board, r, c);
      for (const seq of seqs) {
        jumps.push({
          from:     [r, c],
          to:       seq.to,
          isJump:   true,
          captures: seq.captures,
        });
      }
    }
  }

  if (jumps.length > 0) return jumps;

  // Pass 2: simple moves (only reached when no jumps exist)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (!isPiece(board[r][c], player)) continue;
      for (const m of getSimpleMoves(board, r, c)) simples.push(m);
    }
  }

  return simples;
}

/**
 * getLegalDestinations(board, player, position)
 *
 * First-step squares the piece at position can legally reach.
 * Used by the backend API to build the destinationMap for UI highlighting.
 *
 * Respects the mandatory-capture rule by using getLegalMoves().
 */
export function getLegalDestinations(board, player, position) {
  const allMoves = getLegalMoves(board, player);
  const [row, col] = position;
  const dests = new Set();

  for (const m of allMoves) {
    if (m.from[0] === row && m.from[1] === col) {
      const [dr, dc] = m.to[0];
      dests.add(`${dr},${dc}`);
    }
  }

  return [...dests].map(s => s.split(',').map(Number));
}
