/**
 * gameApi.js – Frontend client for the /api/game backend endpoints.
 *
 * All game rule logic lives in the backend.  This file is the only place
 * in the React codebase that talks to the game engine.
 *
 * The Vite dev proxy (vite.config.js) forwards /api/* → http://localhost:4000
 * so calls here work identically in dev and in production (where the same
 * origin serves both frontend and backend).
 *
 * Board format (backend ↔ frontend transport):
 *   null  – empty square
 *   "b"   – blue piece
 *   "r"   – red piece
 *   "bk"  – blue king
 *   "rk"  – red king
 *
 * Board.jsx / Square.jsx expect { color, isKing } objects.
 * toDisplayBoard() converts the compact string format for rendering.
 */

const BASE = '/api/game';

// ── HTTP helpers ──────────────────────────────────────────────────────────

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data;
}

async function get(path) {
  const res  = await fetch(`${BASE}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data;
}

// ── API calls ─────────────────────────────────────────────────────────────

/**
 * initGame()
 *
 * Start a new game.  Returns initial board and metadata.
 *
 * Response: { board, currentPlayer, moveCount, captures, winner }
 */
export async function initGame() {
  return post('/init', {});
}

/**
 * fetchLegalMoves(board, player)
 *
 * Fetch all legal moves for player from the backend engine.
 * This is the single source of truth for rule enforcement.
 *
 * Response:
 * {
 *   moves:           Move[],
 *   destinationMap:  { "row,col": [[r,c],…], … },
 *   moveableSquares: ["row,col", …],
 * }
 */
export async function fetchLegalMoves(board, player) {
  return post('/legal-moves', { board, player });
}

/**
 * sendMove(board, move, currentPlayer, captures, moveCount)
 *
 * Send a chosen move to the backend for validation and application.
 *
 * Response:
 * {
 *   board:         updated 8×8 matrix,
 *   currentPlayer: next player,
 *   winner:        "blue"|"red"|null,
 *   captures:      { blue, red },
 *   captureCount:  n,
 *   moveCount:     n,
 * }
 */
export async function sendMove(board, move, currentPlayer, captures, moveCount) {
  return post('/move', { board, move, currentPlayer, captures, moveCount });
}

/**
 * getEngineState()
 *
 * Fetch engine metadata (health check / capabilities).
 */
export async function getEngineState() {
  return get('/state');
}

// ── Board format conversion ───────────────────────────────────────────────

/**
 * toDisplayBoard(board)
 *
 * Convert the backend compact string format to the object format that
 * Board.jsx / Square.jsx / Piece.jsx expect:
 *   null   →  null
 *   "b"    →  { color: "blue", isKing: false }
 *   "r"    →  { color: "red",  isKing: false }
 *   "bk"   →  { color: "blue", isKing: true  }
 *   "rk"   →  { color: "red",  isKing: true  }
 *
 * Called once after every API response before storing the board in state.
 */
export function toDisplayBoard(board) {
  return board.map(row =>
    row.map(cell => {
      if (!cell) return null;
      return {
        color:  cell[0] === 'b' ? 'blue' : 'red',
        isKing: cell.length === 2,   // "bk" or "rk" have length 2
      };
    })
  );
}

/**
 * toEngineBoard(displayBoard)
 *
 * Reverse of toDisplayBoard – convert the display format back to the
 * compact string format.  Used when undo restores a snapshot to send back
 * to the backend (e.g. for legal-moves after undo).
 */
export function toEngineBoard(displayBoard) {
  return displayBoard.map(row =>
    row.map(cell => {
      if (!cell) return null;
      if (cell.color === 'blue') return cell.isKing ? 'bk' : 'b';
      return cell.isKing ? 'rk' : 'r';
    })
  );
}
