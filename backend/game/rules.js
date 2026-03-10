/**
 * rules.js – Pure rule helpers: piece properties, promotion, turn switching,
 *            and board evaluation.
 *
 * This module has NO dependency on moveGenerator.js so there is no circular
 * import.  Win detection (which needs getLegalMoves) lives in gameState.js.
 *
 * All functions are pure and side-effect-free – safe for AI simulations.
 */

import { cloneBoard } from './board.js';

// ── Piece helpers ────────────────────────────────────────────────────────

/** Return the owning player ("blue" | "red") for a piece, or null for empty. */
export function getColor(piece) {
  if (!piece) return null;
  return piece[0] === 'b' ? 'blue' : 'red';
}

/** True when the piece is a king. */
export function isKing(piece) {
  return piece === 'bk' || piece === 'rk';
}

/** True when the piece at a square belongs to player. */
export function isPiece(piece, player) {
  if (!piece) return false;
  return player === 'blue'
    ? (piece === 'b' || piece === 'bk')
    : (piece === 'r' || piece === 'rk');
}

/**
 * getMoveDirs(piece) – Diagonal movement directions for the piece.
 *
 * Regular blue  → moves down  (row++)  → [[1,-1],[1,1]]
 * Regular red   → moves up    (row--)  → [[-1,-1],[-1,1]]
 * Kings         → all four diagonals
 */
export function getMoveDirs(piece) {
  if (!piece) return [];
  if (piece === 'bk' || piece === 'rk') return [[-1,-1],[-1,1],[1,-1],[1,1]];
  if (piece === 'b')                    return [[1,-1],[1,1]];
  /* 'r' */                             return [[-1,-1],[-1,1]];
}

/** The back-row index at which each player's pieces are crowned. */
export const PROMOTION_ROW = { blue: 7, red: 0 };

// ── King promotion ────────────────────────────────────────────────────────

/**
 * promoteToKing(board) – Crown any piece that has reached the opponent's
 * back row.  Returns a new board; the original is not mutated.
 *
 * Called at the end of applyMove() after all captures and moves are resolved.
 */
export function promoteToKing(board) {
  const b = cloneBoard(board);
  for (let c = 0; c < 8; c++) {
    if (b[7][c] === 'b')  b[7][c] = 'bk';
    if (b[0][c] === 'r')  b[0][c] = 'rk';
  }
  return b;
}

// ── Turn switching ────────────────────────────────────────────────────────

/** Return the opponent of currentPlayer. */
export function switchTurn(currentPlayer) {
  return currentPlayer === 'blue' ? 'red' : 'blue';
}

// ── Win detection ─────────────────────────────────────────────────────────

/**
 * checkWin is intentionally NOT in this file.
 *
 * Reason: checkWin needs getLegalMoves (from moveGenerator.js), and
 * moveGenerator.js imports from rules.js – a circular dependency that
 * Node ESM cannot resolve cleanly.
 *
 * checkWin() therefore lives in gameState.js, which sits at the top of
 * the dependency tree and can safely import both modules.
 */

// ── Board evaluation (for Minimax / Monte Carlo AI) ──────────────────────

/**
 * evaluateBoard(board) – Static heuristic evaluation from blue's perspective.
 *
 * Returns a number:
 *   > 0  →  blue advantage
 *   < 0  →  red advantage
 *   = 0  →  balanced
 *
 * Scoring weights:
 *   normal piece  ±1.0
 *   king          ±2.0  (twice as valuable)
 *   advance bonus +0.3  (fraction of board crossed – encourages promotion)
 *   centre bonus  +0.1  (columns 2–5 are more powerful)
 *
 * AI agents can tune these constants or replace this function entirely.
 */
export function evaluateBoard(board) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;

      const isBlue      = p === 'b' || p === 'bk';
      const king        = p === 'bk' || p === 'rk';
      const base        = king ? 2.0 : 1.0;
      const advance     = isBlue ? (r / 7) * 0.3 : ((7 - r) / 7) * 0.3;
      const centre      = (c >= 2 && c <= 5) ? 0.1 : 0.0;
      const pieceScore  = base + advance + centre;

      score += isBlue ? pieceScore : -pieceScore;
    }
  }
  return score;
}
