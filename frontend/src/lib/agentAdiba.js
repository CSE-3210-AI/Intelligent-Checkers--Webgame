import { applyMove, checkWinner, countPieces, getAllMoves } from './checkers';

const PHASE_CONFIG = {
  Opening: {
    riskTolerance: 0.25,
    simulations: 200,
    fuzzyFiltering: 'strong',
    strategyLabel: 'Opening Strategy',
    c: 1.25,
  },
  Midgame: {
    riskTolerance: 0.5,
    simulations: 400,
    fuzzyFiltering: 'medium',
    strategyLabel: 'Midgame Tactical Play',
    c: 1.35,
  },
  Endgame: {
    riskTolerance: 0.78,
    simulations: 700,
    fuzzyFiltering: 'weak',
    strategyLabel: 'Endgame Aggression',
    c: 1.45,
  },
};

const CENTER = new Set(['2,2', '2,3', '2,4', '2,5', '3,2', '3,3', '3,4', '3,5', '4,2', '4,3', '4,4', '4,5', '5,2', '5,3', '5,4', '5,5']);

const opposite = (color) => (color === 'blue' ? 'red' : 'blue');
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function detectGamePhase(board) {
  const counts = countPieces(board);
  const total = counts.blue + counts.red;
  if (total > 16) return 'Opening';
  if (total >= 8) return 'Midgame';
  return 'Endgame';
}

export function getPhaseConfig(phase) {
  return PHASE_CONFIG[phase] ?? PHASE_CONFIG.Midgame;
}

export function getPhaseStrategyLabel(phase) {
  return getPhaseConfig(phase).strategyLabel;
}

function landing(move) {
  return move.to[move.to.length - 1];
}

function moveCaptureCount(move) {
  return move.isJump ? move.to.length : 0;
}

function pieceThreatCount(board, row, col, color) {
  const enemyMoves = getAllMoves(board, opposite(color));
  let count = 0;
  for (const m of enemyMoves) {
    if (!m.isJump) continue;
    for (const [r, c] of m.to) {
      const mr = (r + m.from[0]) / 2;
      const mc = (c + m.from[1]) / 2;
      if (mr === row && mc === col) {
        count++;
        break;
      }
    }
  }
  return count;
}

function evaluatePromotionPrevention(boardAfter, color) {
  const opp = opposite(color);
  const enemyPieces = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = boardAfter[r][c];
      if (p && p.color === opp && !p.isKing) enemyPieces.push([r, c]);
    }
  }

  if (enemyPieces.length === 0) return 0;

  let prevented = 0;
  for (const [r] of enemyPieces) {
    if (opp === 'blue' && r >= 5) prevented += 1;
    if (opp === 'red' && r <= 2) prevented += 1;
  }
  return clamp01(prevented / Math.max(1, enemyPieces.length));
}

function evaluateFuzzyMove(board, move, color, riskTolerance) {
  const boardAfter = applyMove(board, move);
  const [toR, toC] = landing(move);
  const movedPiece = boardAfter[toR][toC];
  const myMoves = getAllMoves(boardAfter, color).length;
  const enemyMoves = getAllMoves(boardAfter, opposite(color)).length;

  const threat = pieceThreatCount(boardAfter, toR, toC, color);
  const threatScore = clamp01(threat / 3);

  const captureOpportunity = clamp01(moveCaptureCount(move) / 3);
  const kingSafety = movedPiece?.isKing ? clamp01(1 - threatScore) : 0.5;
  const centerControl = CENTER.has(`${toR},${toC}`) ? 1 : 0.35;
  const flankProtection = (toC <= 1 || toC >= 6) ? 0.75 : 0.45;
  const promotionPrevention = evaluatePromotionPrevention(boardAfter, color);
  const mobilityAdvantage = clamp01((myMoves - enemyMoves + 12) / 24);

  const safetyScore = clamp01(
    0.36 * kingSafety +
    0.28 * flankProtection +
    0.2 * (1 - threatScore) +
    0.16 * promotionPrevention
  );

  const attackScore = clamp01(
    0.45 * captureOpportunity +
    0.23 * centerControl +
    0.17 * mobilityAdvantage +
    0.15 * promotionPrevention
  );

  const riskScore = clamp01(0.65 * threatScore + 0.35 * (1 - safetyScore));

  const blended = clamp01(
    (1 - riskTolerance) * (0.6 * safetyScore + 0.4 * attackScore) +
    riskTolerance * (0.7 * attackScore + 0.3 * (1 - riskScore))
  );

  let label = 'Safe';
  if (attackScore > 0.7 && riskScore > 0.45) label = 'Aggressive';
  else if (riskScore > 0.62) label = 'Risky';

  return {
    move,
    safety_score: Number(safetyScore.toFixed(3)),
    attack_score: Number(attackScore.toFixed(3)),
    risk_score: Number(riskScore.toFixed(3)),
    mobility_score: Number(mobilityAdvantage.toFixed(3)),
    fuzzy_score: Number(blended.toFixed(3)),
    label,
    features: {
      captureOpportunity,
      kingSafety,
      centerControl,
      flankProtection,
      promotionPrevention,
      mobilityAdvantage,
      movedPieceIsKing: !!movedPiece?.isKing,
    },
  };
}

function filterMoves(fuzzyMoves, strength) {
  if (fuzzyMoves.length <= 2) return fuzzyMoves;

  const sorted = [...fuzzyMoves].sort((a, b) => b.fuzzy_score - a.fuzzy_score);
  const keepCount =
    strength === 'strong'
      ? Math.max(2, Math.ceil(sorted.length * 0.45))
      : strength === 'medium'
        ? Math.max(2, Math.ceil(sorted.length * 0.65))
        : Math.max(2, Math.ceil(sorted.length * 0.85));

  const threshold = sorted[keepCount - 1].fuzzy_score;
  return fuzzyMoves.filter((m) => m.fuzzy_score >= threshold);
}

class Node {
  constructor({ board, player, aiColor, move = null, parent = null, prior = 0.5 }) {
    this.board = board;
    this.player = player;
    this.aiColor = aiColor;
    this.move = move;
    this.parent = parent;
    this.prior = prior;
    this.children = [];
    this.visits = 0;
    this.wins = 0;
    this.untriedMoves = getAllMoves(board, player);
  }

  isTerminal() {
    return checkWinner(this.board, this.player) !== null;
  }

  isFullyExpanded() {
    return this.untriedMoves.length === 0;
  }
}

function uctScore(parentVisits, child, c) {
  if (child.visits === 0) return Number.POSITIVE_INFINITY;
  const exploitation = child.wins / child.visits;
  const exploration = c * Math.sqrt(Math.log(parentVisits) / child.visits);
  const fuzzyBias = 0.25 * child.prior / (1 + child.visits);
  return exploitation + exploration + fuzzyBias;
}

function selectNode(root, config) {
  let node = root;
  while (!node.isTerminal() && node.isFullyExpanded() && node.children.length > 0) {
    let best = node.children[0];
    let bestScore = -Infinity;
    for (const child of node.children) {
      const score = uctScore(Math.max(1, node.visits), child, config.c);
      if (score > bestScore) {
        bestScore = score;
        best = child;
      }
    }
    node = best;
  }
  return node;
}

function expandNode(node, priorsByMoveKey) {
  if (node.untriedMoves.length === 0) return node;
  const index = Math.floor(Math.random() * node.untriedMoves.length);
  const move = node.untriedMoves.splice(index, 1)[0];
  const boardAfter = applyMove(node.board, move);
  const nextPlayer = opposite(node.player);

  const key = JSON.stringify(move);
  const prior = priorsByMoveKey.get(key) ?? 0.5;

  const child = new Node({
    board: boardAfter,
    player: nextPlayer,
    aiColor: node.aiColor,
    move,
    parent: node,
    prior,
  });
  node.children.push(child);
  return child;
}

function quickBoardValue(board, aiColor) {
  const counts = countPieces(board);
  const aiPieces = counts[aiColor];
  const oppPieces = counts[opposite(aiColor)];
  return clamp01((aiPieces - oppPieces + 12) / 24);
}

function simulateRandomPlayout(startNode, maxPlies = 80) {
  let board = startNode.board;
  let player = startNode.player;

  for (let ply = 0; ply < maxPlies; ply++) {
    const winner = checkWinner(board, player);
    if (winner) {
      if (winner === startNode.aiColor) return 1;
      return 0;
    }

    const moves = getAllMoves(board, player);
    if (moves.length === 0) {
      return player === startNode.aiColor ? 0 : 1;
    }

    const move = moves[Math.floor(Math.random() * moves.length)];
    board = applyMove(board, move);
    player = opposite(player);
  }

  return quickBoardValue(board, startNode.aiColor);
}

function backpropagate(node, result) {
  let cur = node;
  while (cur) {
    cur.visits += 1;
    cur.wins += result;
    cur = cur.parent;
  }
}

function moveToText(move) {
  const [fr, fc] = move.from;
  const [tr, tc] = landing(move);
  const toCoord = (r, c) => `${String.fromCharCode(65 + c)}${8 - r}`;
  return `${toCoord(fr, fc)} → ${toCoord(tr, tc)}`;
}

function buildExplanation({ fuzzy, winProb, phase, strategyLabel, bestMove }) {
  const reasons = [];

  if (bestMove.isJump) {
    reasons.push('Aggressive capture selected due to favorable simulation outcomes.');
  }
  if (fuzzy.features.promotionPrevention > 0.6) {
    reasons.push('Jump selected to prevent opponent King promotion.');
  }
  if (fuzzy.safety_score > 0.7 && fuzzy.features.flankProtection > 0.65) {
    reasons.push('Defensive move chosen to protect the vulnerable flank.');
  }
  if (fuzzy.features.centerControl > 0.8) {
    reasons.push('Central control move selected to improve board dominance.');
  }

  if (reasons.length === 0) {
    if (fuzzy.label === 'Safe') {
      reasons.push('Safe positional move selected to preserve king safety and mobility.');
    } else if (fuzzy.label === 'Aggressive') {
      reasons.push('Aggressive line preferred because the search found strong continuation pressure.');
    } else {
      reasons.push('Balanced tactical move selected after fuzzy filtering and Monte Carlo validation.');
    }
  }

  reasons.push(`Estimated win probability: ${(winProb * 100).toFixed(0)}% in ${phase.toLowerCase()} (${strategyLabel}).`);

  return reasons.join(' ');
}

export async function decideAgentAdibaMove(board, aiColor = 'red') {
  const allMoves = getAllMoves(board, aiColor);
  if (allMoves.length === 0) {
    return {
      move: null,
      phase: detectGamePhase(board),
      win_probability: 0,
      explanation: 'No legal moves available; the position is lost.',
    };
  }

  const phase = detectGamePhase(board);
  const config = getPhaseConfig(phase);

  const fuzzyMoves = allMoves.map((move) => evaluateFuzzyMove(board, move, aiColor, config.riskTolerance));
  const filtered = filterMoves(fuzzyMoves, config.fuzzyFiltering);

  const priorsByMoveKey = new Map(filtered.map((m) => [JSON.stringify(m.move), m.fuzzy_score]));

  const root = new Node({ board, player: aiColor, aiColor });
  root.untriedMoves = filtered.map((m) => m.move);

  const start = performance.now();
  const timeBudgetMs = Math.min(900, 360 + config.simulations * 0.8);

  let iterations = 0;
  while (iterations < config.simulations && performance.now() - start < timeBudgetMs) {
    let node = selectNode(root, config);
    if (!node.isTerminal()) {
      node = expandNode(node, priorsByMoveKey);
    }

    const result = simulateRandomPlayout(node);
    backpropagate(node, result);
    iterations += 1;
  }

  if (root.children.length === 0) {
    const fallback = filtered.sort((a, b) => b.fuzzy_score - a.fuzzy_score)[0];
    const wp = clamp01(0.45 + 0.4 * fallback.fuzzy_score);
    return {
      move: fallback.move,
      phase,
      win_probability: Number(wp.toFixed(3)),
      explanation: buildExplanation({
        fuzzy: fallback,
        winProb: wp,
        phase,
        strategyLabel: config.strategyLabel,
        bestMove: fallback.move,
      }),
      strategy: config.strategyLabel,
      move_text: moveToText(fallback.move),
      classification: fallback.label,
    };
  }

  const bestChild = [...root.children].sort((a, b) => {
    if (b.visits !== a.visits) return b.visits - a.visits;
    return b.wins / Math.max(1, b.visits) - a.wins / Math.max(1, a.visits);
  })[0];

  const fuzzyMeta =
    fuzzyMoves.find((m) => JSON.stringify(m.move) === JSON.stringify(bestChild.move)) ??
    filtered[0];

  const winProb = clamp01(bestChild.wins / Math.max(1, bestChild.visits));

  return {
    move: bestChild.move,
    phase,
    win_probability: Number(winProb.toFixed(3)),
    explanation: buildExplanation({
      fuzzy: fuzzyMeta,
      winProb,
      phase,
      strategyLabel: config.strategyLabel,
      bestMove: bestChild.move,
    }),
    strategy: config.strategyLabel,
    move_text: moveToText(bestChild.move),
    classification: fuzzyMeta.label,
    fuzzy_scores: {
      safety_score: fuzzyMeta.safety_score,
      attack_score: fuzzyMeta.attack_score,
      risk_score: fuzzyMeta.risk_score,
      mobility_score: fuzzyMeta.mobility_score,
    },
  };
}
