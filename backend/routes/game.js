/**
 * game.js – Express router for /api/game endpoints.
 *
 * Mounted in server.js as:   app.use('/api/game', gameRoutes)
 *
 * Endpoints:
 *   POST /api/game/init          → initGame
 *   POST /api/game/legal-moves   → legalMovesHandler
 *   POST /api/game/move          → makeMoveHandler
 *   GET  /api/game/state         → getStateHandler
 */

import express from 'express';
import {
  initGame,
  legalMovesHandler,
  makeMoveHandler,
  getStateHandler,
} from '../controllers/gameController.js';

const router = express.Router();

router.post('/init',         initGame);
router.post('/legal-moves',  legalMovesHandler);
router.post('/move',         makeMoveHandler);
router.get('/state',         getStateHandler);

export default router;
