/**
 * gameState.js – State transitions and top-level game-turn logic.
 *
 * This module sits at the top of the dependency tree and imports from
 * all three sibling modules without any circular dependency:
 *
 *   board.js  (cloneBoard, countPieces)
 *   rules.js  (promoteToKing, switchTurn, evaluateBoard)
 *   moveGenerator.js (getLegalMoves)
 *
 * Exports required by the spec:
 *   applyMove(board, move)
 *   handleCapture(board, move)
 *   handleMultiJump(board, position)
 *   checkWin(board, currentPlayer)
 *   executeTurn(board, move, currentPlayer)
 */

import { cloneBoard, countPieces } from './board.js';
import { promoteToKing, switchTurn } from './rules.js';
import { getLegalMoves } from './moveGenerator.js';

// ── Capture removal ──────────────────────────────────────────────────────

/**
 * handleCapture(board, move)
 *
 * Remove every captured piece listed in move.captures from a clone of
 * the board.  Returns the new board; the original is never mutated.
 *
 * Called internally by applyMove().  Also exposed so AI agents can
 * simulate capture effects independently of the full move application.
 */
export function handleCapture(board, move) {
  const b = cloneBoard(board);
  for (const [mr, mc] of (move.captures ?? [])) {
    b[mr][mc] = null;
  }
  return b;
}

// ── Multi-jump continuation ───────────────────────────────────────────────

/**
 * handleMultiJump(board, position)
 *
 * Return all further jump moves available to the piece at position on the
 * given board.  Used by the controller/AI to check whether a jump chain
 * must continue.
 *
 * In this engine, getJumpSequences() already expands every chain fully
 * inside applyMove(), so a single applyMove() call handles multi-jumps
 * automatically.  This function is exposed for external inspection and
 * partial-chain simulation by AI agents.
 */
export function handleMultiJump(board, position) {
  const [row, col] = position;
  const piece = board[row][col];
  if (!piece) return [];
  const player = piece[0] === 'b' ? 'blue' : 'red';
  return getLegalMoves(board, player).filter(
    m => m.isJump && m.from[0] === row && m.from[1] === col
  );
}

// ── Move application ─────────────────────────────────────────────────────

/**
 * applyMove(board, move)
 *
 * Apply a move and return a new board.  The original board is NEVER mutated.
 *
 * Cloning is critical for AI simulation – Minimax will call applyMove()
 * thousands of times on hypothetical branches without affecting the real game.
 *
 * Steps:
 *   1. Clone the board.
 *   2. Remove all captured pieces (handleCapture).
 *   3. Lift the moving piece off its origin square.
 *   4. Place it on the final destination.
 *   5. Apply king promotion (promoteToKing).
 */
export function applyMove(board, move) {
  // Step 1: clone
  let b = cloneBoard(board);

  // Step 2: remove captured pieces
  if (move.isJump && move.captures?.length) {
    b = handleCapture(b, move);
  }

  // Step 3: lift piece from origin
  const [fr, fc]   = move.from;
  const piece      = b[fr][fc];
  b[fr][fc]        = null;

  // Step 4: place at final destination
  const finalDest  = move.to[move.to.length - 1];
  const [dr, dc]   = finalDest;
  b[dr][dc]        = piece;

  // Step 5: king promotion
  b = promoteToKing(b);

  return b;
}

// ── Win detection ────────────────────────────────────────────────────────

/**
 * checkWin(board, currentPlayer)
 *
 * Called AFTER a move has been applied and the turn switched to
 * currentPlayer (the side that must move next).
 *
 * Returns "blue" | "red" if a player has won, or null to continue.
 *
 * A player loses when:
 *   (a) they have no pieces remaining, or
 *   (b) they have no legal moves available on their turn.
 */
export function checkWin(board, currentPlayer) {
  const counts = countPieces(board);
  if (counts.blue === 0) return 'red';
  if (counts.red  === 0) return 'blue';

  if (getLegalMoves(board, currentPlayer).length === 0) {
    return switchTurn(currentPlayer);   // the player who CAN move wins
  }

  return null;
}

// ── Full turn execution ───────────────────────────────────────────────────

/**
 * executeTurn(board, move, currentPlayer)
 *
 * Apply a move, resolve captures, promotion, and turn switch, then check
 * for a winner.  This is the single function the game controller calls for
 * each player action.
 *
 * Returns:
 * {
 *   newBoard:     8×8 matrix  (updated board),
 *   nextPlayer:   "blue"|"red",
 *   winner:       "blue"|"red"|null,
 *   captureCount: number       (pieces captured this turn),
 * }
 */
export function executeTurn(board, move, currentPlayer) {
  const opponentKey  = currentPlayer === 'blue' ? 'red' : 'blue';
  const oldCounts    = countPieces(board);

  const newBoard     = applyMove(board, move);

  const newCounts    = countPieces(newBoard);
  const captureCount = oldCounts[opponentKey] - newCounts[opponentKey];

  const nextPlayer   = switchTurn(currentPlayer);
  const winner       = checkWin(newBoard, nextPlayer);

  return { newBoard, nextPlayer, winner, captureCount };
}
