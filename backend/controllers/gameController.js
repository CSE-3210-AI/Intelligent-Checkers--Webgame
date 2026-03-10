/**
 * gameController.js – Express route handlers for /api/game.
 *
 * The backend is intentionally stateless: every request carries the full
 * board and game metadata as JSON.  The backend validates, applies rules,
 * and returns the new state.  No server-side session is needed.
 *
 * This design makes it trivial to plug in AI agents later:
 *   - The AI just calls getLegalMoves / applyMove on a board snapshot.
 *   - No shared mutable state means Minimax simulations are safe.
 */

import { initializeBoard } from '../game/board.js';
import { getLegalMoves, getLegalDestinations } from '../game/moveGenerator.js';
import { evaluateBoard } from '../game/rules.js';
import { executeTurn, checkWin } from '../game/gameState.js';

// ── POST /api/game/init ──────────────────────────────────────────────────

/**
 * initGame – Return a fresh board and initial metadata.
 *
 * Response:
 * {
 *   board:         8×8 matrix,
 *   currentPlayer: "blue",
 *   moveCount:     0,
 *   captures:      { blue: 0, red: 0 },
 *   winner:        null,
 * }
 */
export const initGame = (_req, res) => {
  try {
    const board = initializeBoard();
    res.json({
      board,
      currentPlayer: 'blue',
      moveCount:     0,
      captures:      { blue: 0, red: 0 },
      winner:        null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/game/legal-moves ───────────────────────────────────────────

/**
 * legalMovesHandler – Return all legal moves for the current player.
 *
 * Body:  { board, player }
 *
 * Response:
 * {
 *   moves:          Move[],          // full move objects
 *   destinationMap: {                // per-piece first-step destinations
 *     "row,col": [[r,c], …], …
 *   },
 *   moveableSquares: ["row,col", …]  // positions of pieces that can move
 * }
 *
 * The destinationMap and moveableSquares allow the React board to:
 *   - Show amber rings on moveable pieces.
 *   - Show yellow dots on valid destinations when a piece is selected.
 */
export const legalMovesHandler = (req, res) => {
  try {
    const { board, player } = req.body;
    if (!board || !player) {
      return res.status(400).json({ error: '"board" and "player" are required.' });
    }

    const moves = getLegalMoves(board, player);

    // Build destinationMap: "fromRow,fromCol" → [[destRow, destCol], …]
    // Each entry lists the first-step landing squares for that piece.
    const destinationMap = {};
    for (const m of moves) {
      const fromKey  = `${m.from[0]},${m.from[1]}`;
      const destKey  = `${m.to[0][0]},${m.to[0][1]}`;
      if (!destinationMap[fromKey]) destinationMap[fromKey] = [];
      // Deduplicate destinations (multiple jump paths may share a first step)
      if (!destinationMap[fromKey].some(d => `${d[0]},${d[1]}` === destKey)) {
        destinationMap[fromKey].push(m.to[0]);
      }
    }

    // moveableSquares: list of "row,col" strings for all pieces that have moves
    const moveableSquares = [...new Set(moves.map(m => `${m.from[0]},${m.from[1]}`))];

    res.json({ moves, destinationMap, moveableSquares });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/game/move ──────────────────────────────────────────────────

/**
 * makeMoveHandler – Apply a move and return the updated game state.
 *
 * Body:
 * {
 *   board:         8×8 matrix,
 *   move:          Move object (must be one of the moves from /legal-moves),
 *   currentPlayer: "blue"|"red",
 *   captures:      { blue: n, red: n },   // running totals from client
 * }
 *
 * Response:
 * {
 *   board:         updated 8×8 matrix,
 *   currentPlayer: next player to move,
 *   winner:        "blue"|"red"|null,
 *   captures:      { blue: n, red: n },   // updated totals
 *   captureCount:  n,                     // pieces captured this turn
 *   moveCount:     n,                     // incremented move counter
 * }
 */
export const makeMoveHandler = (req, res) => {
  try {
    const {
      board,
      move,
      currentPlayer,
      captures   = { blue: 0, red: 0 },
      moveCount  = 0,
    } = req.body;

    if (!board || !move || !currentPlayer) {
      return res.status(400).json({
        error: '"board", "move", and "currentPlayer" are required.',
      });
    }

    const { newBoard, nextPlayer, winner, captureCount } =
      executeTurn(board, move, currentPlayer);

    const newCaptures = {
      blue: captures.blue + (currentPlayer === 'blue' ? captureCount : 0),
      red:  captures.red  + (currentPlayer === 'red'  ? captureCount : 0),
    };

    res.json({
      board:         newBoard,
      currentPlayer: nextPlayer,
      winner,
      captures:      newCaptures,
      captureCount,
      moveCount:     moveCount + 1,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/game/state ──────────────────────────────────────────────────

/**
 * getStateHandler – Engine metadata / health check.
 *
 * Returns a description of the engine and its capabilities.
 * Will be extended to support persistent game sessions in a later phase.
 */
export const getStateHandler = (_req, res) => {
  res.json({
    engine:    'checkers-game-engine',
    version:   '1.0.0',
    endpoints: {
      init:        'POST /api/game/init',
      legalMoves:  'POST /api/game/legal-moves',
      move:        'POST /api/game/move',
      state:       'GET  /api/game/state',
    },
    rules: [
      'Standard American checkers (8×8 board)',
      'Mandatory captures – if a jump exists, only jumps are legal',
      'Multi-jump captures – full chain expanded in one turn',
      'King promotion at back row (row 7 for blue, row 0 for red)',
      'Win: opponent has no pieces OR no legal moves',
    ],
    aiFunctions: [
      'getLegalMoves(board, player)',
      'applyMove(board, move)',
      'checkWin(board, currentPlayer)',
      'evaluateBoard(board)',
    ],
  });
};
