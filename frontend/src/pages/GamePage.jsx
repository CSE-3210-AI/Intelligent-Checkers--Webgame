import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Bot, CircleHelp, Loader2, Settings, Users } from 'lucide-react';

import Board from '../components/Board';
import InitialBoard from '../components/InitialBoard';
import MidGameBoard from '../components/MidGameBoard';
import EndGameBoard from '../components/EndGameBoard';
import AnotherGameState from '../components/AnotherGameState';

import {
  initGame,
  fetchLegalMoves,
  sendMove,
  toDisplayBoard,
  getAgentAdibaMove,
  getAgentMeghaMove,
  getExternalAgentMove,
} from '../lib/gameApi';
import {
  detectGamePhase,
  getPhaseStrategyLabel,
} from '../lib/agentAdiba';

const opposite = (player) => (player === 'blue' ? 'red' : 'blue');

const PLAYER_TYPE_LABEL = {
  human: 'Human',
  adiba: 'Adiba',
  internal_ai: 'Internal AI',
  external_ai: 'External AI',
};

const GAME_MODE_LABEL = {
  'human-vs-human': 'Human vs Human',
  'human-vs-adiba': 'Human vs Agent Adiba',
  'human-vs-megha': 'Human vs Agent Megha',
  'internal-ai-tournament': 'Internal AI Tournament',
  'online-benchmark': 'Online Benchmark Tournament',
};

// Toggle this to true when you want visual marker dots and piece outline during animation debugging.
const SHOW_ANIMATION_DEBUG = false;

function getModeFromQuery(params) {
  if (params.get('autostart') === 'true') return 'human-vs-human';
  const mode = params.get('mode');
  if (mode === 'agent-adiba') return 'human-vs-adiba';
  if (mode === 'agent-megha') return 'human-vs-megha';
  if (mode === 'internal-tournament') return 'internal-ai-tournament';
  if (mode === 'online-benchmark') return 'online-benchmark';
  return null;
}

function buildPlayersForMode(gameMode, params) {
  const selectedInternal = params.get('internalAgent') === 'megha' ? 'Agent Megha' : 'Agent Adiba';
  const selectedInternalKey = params.get('internalAgent') === 'megha' ? 'megha' : 'adiba';

  if (gameMode === 'human-vs-adiba') {
    return {
      blue: { name: 'Player 1', type: 'human', agentKey: null },
      red: { name: 'Agent Adiba', type: 'adiba', agentKey: 'adiba' },
    };
  }

  if (gameMode === 'human-vs-megha') {
    return {
      blue: { name: 'Player 1', type: 'human', agentKey: null },
      red: { name: 'Agent Megha', type: 'internal_ai', agentKey: 'megha' },
    };
  }

  if (gameMode === 'internal-ai-tournament') {
    return {
      blue: { name: 'Agent Megha', type: 'internal_ai', agentKey: 'megha' },
      red: { name: 'Agent Adiba', type: 'internal_ai', agentKey: 'adiba' },
    };
  }

  if (gameMode === 'online-benchmark') {
    return {
      blue: { name: selectedInternal, type: 'internal_ai', agentKey: selectedInternalKey },
      red: { name: 'Online Agent', type: 'external_ai', agentKey: 'external' },
    };
  }

  return {
    blue: { name: 'Player 1', type: 'human', agentKey: null },
    red: { name: 'Player 2', type: 'human', agentKey: null },
  };
}

function formatMoveText(move) {
  if (!move?.from || !move?.to?.length) return 'Unknown move';
  const [fr, fc] = move.from;
  const [tr, tc] = move.to[move.to.length - 1];
  const toCoord = (r, c) => `${String.fromCharCode(65 + c)}${8 - r}`;
  return `${toCoord(fr, fc)} -> ${toCoord(tr, tc)}`;
}

function countEngineBoard(board) {
  if (!board) return { blue: 12, red: 12 };
  let blue = 0, red = 0;
  for (const row of board)
    for (const cell of row) {
      if (cell === 'b' || cell === 'bk') blue++;
      else if (cell === 'r' || cell === 'rk') red++;
    }
  return { blue, red };
}

const GamePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode]           = useState('demo');
  const [gameMode, setGameMode]   = useState('human-vs-human');
  const [players, setPlayers]     = useState({
    blue: { name: 'Player 1', type: 'human', agentKey: null },
    red: { name: 'Player 2', type: 'human', agentKey: null },
  });
  const [activeTab, setActiveTab] = useState('initial');

  const [engineBoard,    setEngineBoard]    = useState(null);
  const [currentPlayer,  setCurrentPlayer]  = useState('blue');
  const [moveCount,      setMoveCount]      = useState(0);
  const [captures,       setCaptures]       = useState({ blue: 0, red: 0 });
  const [winner,         setWinner]         = useState(null);
  const [history,        setHistory]        = useState([]);

  const [legalMoves,     setLegalMoves]     = useState([]);
  const [moveableSet,    setMoveableSet]    = useState(new Set());
  const [destinationMap, setDestinationMap] = useState({});

  const [selected,   setSelected]   = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [lastMove, setLastMove] = useState(null); // {from: [r,c], to: [r,c]}
  const [showLastMove, setShowLastMove] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);

  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isFetchingAgentMove, setIsFetchingAgentMove] = useState(false);
  const [lastAgentDecision, setLastAgentDecision] = useState(null);

  // MVP animation state (single-step only).
  const [isMoveAnimating, setIsMoveAnimating] = useState(false);
  const [animationPayload, setAnimationPayload] = useState(null);
  const [pendingCommit, setPendingCommit] = useState(null);
  const [hiddenPieceAt, setHiddenPieceAt] = useState(null);

  const animationIdRef = useRef(0);
  const pendingCommitRef = useRef(null);
  const animationWatchdogRef = useRef(null);

  const [startTime, setStartTime] = useState(() => Date.now());
  const [elapsed,   setElapsed]   = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      1000
    );
    return () => clearInterval(id);
  }, [startTime]);

  useEffect(() => {
    pendingCommitRef.current = pendingCommit;
  }, [pendingCommit]);

  const timerText = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  const displayBoard = useMemo(
    () => (engineBoard ? toDisplayBoard(engineBoard) : null),
    [engineBoard]
  );

  const pieceCounts = useMemo(
    () => countEngineBoard(engineBoard),
    [engineBoard]
  );

  const currentPlayerProfile = players[currentPlayer] ?? { name: 'Player', type: 'human' };
  const currentPlayerType = currentPlayerProfile.type;
  const isCurrentTurnHuman = currentPlayerType === 'human';
  const isCurrentTurnAi = !isCurrentTurnHuman;
  const isAiTurn = mode === 'play' && isCurrentTurnAi && !winner;
  const interactionLocked = loading || isFetchingAgentMove || isMoveAnimating;

  const currentTurnActionLabel = isCurrentTurnHuman ? 'Player Turn' : `${currentPlayerProfile.name} Turn`;

  const currentPhase = useMemo(() => {
    if (!displayBoard) return 'Opening';
    return detectGamePhase(displayBoard);
  }, [displayBoard]);

  const currentStrategyLabel = useMemo(
    () => getPhaseStrategyLabel(currentPhase),
    [currentPhase]
  );

  const loadLegalMoves = useCallback(async (board, player) => {
    if (!board || winner) {
      setLegalMoves([]);
      setMoveableSet(new Set());
      setDestinationMap({});
      return;
    }
    try {
      const data = await fetchLegalMoves(board, player);
      setLegalMoves(data.moves);
      setMoveableSet(new Set(data.moveableSquares));
      setDestinationMap(data.destinationMap);
    } catch (err) {
      setApiError(`Failed to load legal moves: ${err.message}`);
    }
  }, [winner]);

  // Applies the already-validated backend result after the visual glide completes.
  const commitMoveResult = useCallback(async ({ result, move, snapshot, agentDecision = null, actor = null }) => {
    setHistory(prev => [...prev, snapshot]);
    setEngineBoard(result.board);
    setCurrentPlayer(result.currentPlayer);
    setMoveCount(result.moveCount);
    setCaptures(result.captures);
    setWinner(result.winner);
    setSelected(null);
    setHighlights([]);
    setLastMove({ from: move.from, to: move.to[0] });
    setShowLastMove(true);

    if (agentDecision) {
      setLastAgentDecision({
        ...agentDecision,
        type: actor?.type,
        name: actor?.name,
        move_text: agentDecision.move_text ?? formatMoveText(agentDecision.move),
      });
    }

    if (!result.winner) {
      const nextType = players[result.currentPlayer]?.type ?? 'human';
      if (nextType === 'human') {
        await loadLegalMoves(result.board, result.currentPlayer);
      } else {
        setLegalMoves([]);
        setMoveableSet(new Set());
        setDestinationMap({});
      }
    } else {
      setLegalMoves([]);
      setMoveableSet(new Set());
      setDestinationMap({});
    }
  }, [loadLegalMoves, players]);

  // Finalizes the in-flight animation exactly once for the active animationId.
  const finalizeAnimation = useCallback(async (animationId, reason = 'raf-complete') => {
    const pending = pendingCommitRef.current;
    if (!pending) {
      console.warn(`[animation] finalize skipped id=${animationId} reason=${reason} (no pending commit)`);
      return;
    }

    if (pending.animationId !== animationId) {
      console.warn(`[animation] finalize skipped id=${animationId} reason=${reason} (active=${pending.animationId})`);
      return;
    }

    if (pending.committed) {
      console.warn(`[animation] finalize skipped id=${animationId} reason=${reason} (already committed)`);
      return;
    }

    pending.committed = true;
    pendingCommitRef.current = pending;

    if (animationWatchdogRef.current) {
      clearTimeout(animationWatchdogRef.current);
      animationWatchdogRef.current = null;
    }

    console.log(`[animation] finalize start id=${animationId} reason=${reason}`);

    try {
      await commitMoveResult(pending);
      console.log(`[animation] finalize done id=${animationId} reason=${reason}`);
    } catch (err) {
      setApiError(`Failed to finalize move: ${err.message}`);
    } finally {
      pendingCommitRef.current = null;
      setPendingCommit(null);
      setAnimationPayload(null);
      setHiddenPieceAt(null);
      setIsMoveAnimating(false);
      setLoading(false);
      setIsFetchingAgentMove(false);
    }
  }, [commitMoveResult]);

  // Queues a single-step overlay animation (MVP) and delays state commit until finalizeAnimation.
  const queueMoveAnimation = useCallback(({ move, result, snapshot, agentDecision = null, actor = null }) => {
    const from = move?.from;
    const to = move?.to?.[0];
    const movingPiece = from ? displayBoard?.[from[0]]?.[from[1]] : null;

    if (!from || !to || !movingPiece) {
      const fallbackId = ++animationIdRef.current;
      console.warn(`[animation] missing payload data, force-committing id=${fallbackId}`);
      const fallbackPending = {
        animationId: fallbackId,
        move,
        result,
        snapshot,
        agentDecision,
        actor,
        committed: false,
      };
      pendingCommitRef.current = fallbackPending;
      setPendingCommit(fallbackPending);
      void finalizeAnimation(fallbackId, 'force-commit-missing-payload');
      return;
    }

    const animationId = ++animationIdRef.current;
    const duration = move.isJump ? 460 : 320;

    const nextPayload = {
      animationId,
      from,
      to,
      piece: movingPiece,
      duration,
    };

    const nextPending = {
      animationId,
      move,
      result,
      snapshot,
      agentDecision,
      actor,
      committed: false,
    };

    console.log('[animation] payload', nextPayload);
    console.log(`[animation] queued id=${animationId}`);

    pendingCommitRef.current = nextPending;
    setPendingCommit(nextPending);
    setAnimationPayload(nextPayload);
    setHiddenPieceAt(from);
    setIsMoveAnimating(true);

    if (animationWatchdogRef.current) {
      clearTimeout(animationWatchdogRef.current);
    }

    // Safety fallback: force finalize if the rAF completion callback never fires.
    animationWatchdogRef.current = setTimeout(() => {
      console.warn(`[animation] watchdog force-commit id=${animationId}`);
      void finalizeAnimation(animationId, 'watchdog-timeout');
    }, duration + 450);
  }, [displayBoard, finalizeAnimation]);

  useEffect(() => {
    return () => {
      if (animationWatchdogRef.current) {
        clearTimeout(animationWatchdogRef.current);
      }
    };
  }, []);

  const handleNewGame = useCallback(async (playerConfig = players) => {
    if (isMoveAnimating) return;
    setLoading(true);
    setApiError(null);

    if (animationWatchdogRef.current) {
      clearTimeout(animationWatchdogRef.current);
      animationWatchdogRef.current = null;
    }

    pendingCommitRef.current = null;
    setPendingCommit(null);
    setAnimationPayload(null);
    setHiddenPieceAt(null);
    setIsMoveAnimating(false);

    try {
      const data = await initGame();
      setEngineBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setMoveCount(data.moveCount);
      setCaptures(data.captures);
      setWinner(data.winner);
      setHistory([]);
      setSelected(null);
      setHighlights([]);
      setLastMove(null);
      setShowLastMove(false);
      setIsFetchingAgentMove(false);
      setLastAgentDecision(null);
      setAgentDecisionsByColor({ blue: null, red: null });
      setMode('play');
      setStartTime(Date.now());
      setElapsed(0);
      const nextType = playerConfig[data.currentPlayer]?.type ?? 'human';
      if (nextType === 'human') {
        await loadLegalMoves(data.board, data.currentPlayer);
      } else {
        setLegalMoves([]);
        setMoveableSet(new Set());
        setDestinationMap({});
      }
    } catch (err) {
      setApiError(`Could not start game - is the backend running? (${err.message})`);
    } finally {
      setLoading(false);
    }
  }, [isMoveAnimating, loadLegalMoves, players]);

  // Auto-start when navigated with ?autostart=true
  useEffect(() => {
    const mappedMode = getModeFromQuery(searchParams);
    if (mappedMode) {
      const mappedPlayers = buildPlayersForMode(mappedMode, searchParams);
      setGameMode(mappedMode);
      setPlayers(mappedPlayers);
      handleNewGame(mappedPlayers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUndo = async () => {
    if (history.length === 0 || loading || isMoveAnimating) return;
    setLoading(true);
    setApiError(null);
    const snap = history[history.length - 1];
    try {
      setHistory(prev => prev.slice(0, -1));
      setEngineBoard(snap.engineBoard);
      setCurrentPlayer(snap.currentPlayer);
      setMoveCount(snap.moveCount);
      setCaptures(snap.captures);
      setWinner(null);
      setSelected(null);
      setHighlights([]);
      const restoreType = players[snap.currentPlayer]?.type ?? 'human';
      if (restoreType === 'human') {
        await loadLegalMoves(snap.engineBoard, snap.currentPlayer);
      } else {
        setLegalMoves([]);
        setMoveableSet(new Set());
        setDestinationMap({});
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResign = () => {
    if (winner || mode !== 'play' || isMoveAnimating) return;
    const resignWinner = currentPlayer === 'blue' ? 'red' : 'blue';
    setWinner(resignWinner);
    setLegalMoves([]);
    setMoveableSet(new Set());
  };

  const handleShowDemo = () => {
    setMode('demo');
    setSelected(null);
    setHighlights([]);
  };

  const handleSquareClick = async (row, col) => {
    if (interactionLocked || winner || mode !== 'play' || isAiTurn) return;

    if (selected && highlights.some(([r, c]) => r === row && c === col)) {
      const move = legalMoves.find(
        m =>
          m.from[0] === selected[0] &&
          m.from[1] === selected[1] &&
          m.to[0][0] === row &&
          m.to[0][1] === col
      );

      if (move) {
        setLoading(true);
        setApiError(null);
        const snapshot = { engineBoard, currentPlayer, moveCount, captures };
        try {
          const result = await sendMove(engineBoard, move, currentPlayer, captures, moveCount);
          queueMoveAnimation({ move, result, snapshot });
        } catch (err) {
          setApiError(`Move failed: ${err.message}`);
          setLoading(false);
        }
      } else {
        setSelected(null);
        setHighlights([]);
      }
      return;
    }

    if (moveableSet.has(`${row},${col}`)) {
      setSelected([row, col]);
      setHighlights(destinationMap[`${row},${col}`] ?? []);
      return;
    }

    setSelected(null);
    setHighlights([]);
  };

  const handleAgentMove = async () => {
    if (!isAiTurn || !engineBoard || interactionLocked) return;

    const actor = players[currentPlayer] ?? { name: 'AI Agent', type: 'internal_ai', agentKey: null };

    setIsFetchingAgentMove(true);
    setApiError(null);
    setSelected(null);
    setHighlights([]);

    try {
      let decision;

      if (actor.type === 'external_ai') {
        decision = await getExternalAgentMove(engineBoard, currentPlayer);
      } else if (actor.type === 'adiba' || actor.agentKey === 'adiba') {
        decision = await getAgentAdibaMove(engineBoard, currentPlayer);
      } else if (actor.agentKey === 'megha') {
        decision = await getAgentMeghaMove(engineBoard, currentPlayer);
      } else {
        setApiError(`${actor.name} is not implemented yet. Add ${actor.name} backend logic first.`);
        setIsFetchingAgentMove(false);
        return;
      }

      if (decision?.error) {
        const failedDecision = {
          move: null,
          move_text: 'No move generated',
          win_probability: 0,
          explanation: decision.error,
          type: actor.type,
          name: actor.name,
        };
        setIsFetchingAgentMove(false);
        return;
      }

      if (!decision?.move) {
        const failedDecision = {
          move: null,
          move_text: 'No move generated',
          win_probability: 0,
          explanation: 'AI failed to generate move',
          type: actor.type,
          name: actor.name,
          agentKey: actor.agentKey,
        };
        setApiError(`${actor.name} failed to generate move`);
        setWinner(opposite(currentPlayer));
        setLastAgentDecision(failedDecision);
        setAgentDecisionsByColor(prev => ({ ...prev, [currentPlayer]: failedDecision }));
        setLegalMoves([]);
        setMoveableSet(new Set());
        setDestinationMap({});
        setIsFetchingAgentMove(false);
        return;
      }

      const snapshot = { engineBoard, currentPlayer, moveCount, captures };
      const result = await sendMove(engineBoard, decision.move, currentPlayer, captures, moveCount);

      queueMoveAnimation({
        move: decision.move,
        result,
        snapshot,
        agentDecision: decision,
        actor,
      });
    } catch (err) {
      setApiError(`${actor.name} failed to move: ${err.message}`);
      setIsFetchingAgentMove(false);
    }
  };

  const demoBoards = {
    initial: <InitialBoard />,
    midgame: <MidGameBoard />,
    endgame: <EndGameBoard />,
    another: <AnotherGameState />,
  };

  // Compute last move highlights
  const lastMoveHighlights = useMemo(() => {
    if (!showLastMove || !lastMove) return [];
    return [lastMove.from, lastMove.to];
  }, [showLastMove, lastMove]);

  const bluePlayer = players.blue ?? { name: 'Player 1', type: 'human' };
  const redPlayer = players.red ?? { name: 'Player 2', type: 'human' };

  const strategyKind = mode !== 'play' ? 'demo' : currentPlayerType;
  const isSingleAgentMode = gameMode === 'human-vs-adiba' || gameMode === 'human-vs-megha';
  const singleAgentLabel = gameMode === 'human-vs-megha' ? 'Agent Megha' : 'Agent Adiba';
  const winnerProfile = winner ? players[winner] : null;
  const onlineInternalProfile = players.blue ?? { name: 'Internal Agent', agentKey: 'adiba' };
  const onlineExternalProfile = players.red ?? { name: 'Online Agent', agentKey: 'external' };
  const onlineInternalDecision = agentDecisionsByColor.blue;
  const onlineExternalDecision = agentDecisionsByColor.red;

  // Responsive container and layout
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(236,72,153,0.18),transparent_40%),linear-gradient(180deg,#020617_0%,#081533_60%,#071225_100%)] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/65 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold uppercase tracking-[0.22em] text-blue-100 md:text-xl">Checkers Arena</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
              <CircleHelp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl overflow-hidden px-4 py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="min-w-0 space-y-3 lg:col-span-3 lg:h-[520px] lg:overflow-y-auto lg:pr-1">
            <Card className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 shadow-[0_16px_45px_rgba(2,6,23,0.35)] backdrop-blur-xl">
              <CardContent className="space-y-4 p-4">
                <div className={`rounded-xl border p-4 ${mode === 'play' && !winner && currentPlayer === 'blue' ? 'border-blue-300/50 bg-blue-500/20' : 'border-white/10 bg-slate-900/60'}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/25 text-blue-200">
                        {bluePlayer.type === 'human' ? <Users className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-wide text-blue-200/80">{bluePlayer.name}</p>
                        <p className="font-semibold text-white">{PLAYER_TYPE_LABEL[bluePlayer.type]}</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-100 hover:bg-blue-500/20">Blue</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Captures</p>
                      <p className="text-xl font-bold text-blue-200">{captures.blue}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Pieces</p>
                      <p className="text-xl font-bold text-blue-200">{pieceCounts.blue}</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className={`rounded-xl border p-4 ${mode === 'play' && !winner && currentPlayer === 'red' ? 'border-rose-300/50 bg-rose-500/20' : 'border-white/10 bg-slate-900/60'}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/25 text-rose-200">
                        {redPlayer.type === 'human' ? <Users className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-wide text-rose-200/80">{redPlayer.name}</p>
                        <p className="font-semibold text-white">{PLAYER_TYPE_LABEL[redPlayer.type]}</p>
                      </div>
                    </div>
                    <Badge className="bg-rose-500/20 text-rose-100 hover:bg-rose-500/20">Red</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Captures</p>
                      <p className="text-xl font-bold text-rose-200">{captures.red}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Pieces</p>
                      <p className="text-xl font-bold text-rose-200">{pieceCounts.red}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {mode === 'play' && (
              <Card className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 backdrop-blur-lg">
                <CardContent className="flex items-center gap-3 p-4 text-sm text-cyan-100">
                  <span className={`h-2.5 w-2.5 rounded-full ${isFetchingAgentMove ? 'animate-pulse bg-cyan-300' : 'bg-cyan-300/70'}`} />
                  <span>
                    {isCurrentTurnAi
                      ? (isFetchingAgentMove ? `${currentPlayerProfile.name} is thinking...` : `${currentPlayerProfile.name} is waiting for command.`)
                      : `${currentPlayerProfile.name} is a human turn.`}
                  </span>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl">
              <CardContent className="space-y-3 p-4">
                <Button
                  onClick={handleNewGame}
                  disabled={loading || isFetchingAgentMove || isMoveAnimating}
                  className="h-11 w-full rounded-xl bg-blue-500/80 font-semibold text-white hover:bg-blue-500"
                >
                  {(loading || isFetchingAgentMove) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  New Game
                </Button>

                {mode === 'play' && (
                  <Button
                    onClick={handleAgentMove}
                    disabled={!isAiTurn || loading || isFetchingAgentMove || isMoveAnimating || !!winner}
                    className="h-11 w-full rounded-xl bg-rose-500/80 font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                  >
                    {isFetchingAgentMove && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCurrentTurnAi
                      ? (isFetchingAgentMove ? 'Thinking...' : currentTurnActionLabel)
                      : 'Agent Move (Waiting)'}
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      if (history.length > 0) {
                        setShowLastMove(true);
                        setTimeout(() => setShowLastMove(false), 2500);
                      }
                    }}
                    variant="outline"
                    className="h-11 rounded-xl border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                    disabled={!lastMove || isFetchingAgentMove || isMoveAnimating}
                  >
                    Last Move
                  </Button>
                  <Button
                    onClick={() => setShowResignModal(true)}
                    disabled={loading || isFetchingAgentMove || isMoveAnimating || !!winner || mode !== 'play'}
                    variant="outline"
                    className="h-11 rounded-xl border-rose-300/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
                  >
                    Resign
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="flex min-w-0 flex-col items-center justify-center space-y-4 overflow-hidden lg:col-span-6">
            {mode === 'demo' && (
              <Card className="w-full rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl">
                <CardContent className="space-y-3 p-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4 rounded-xl bg-slate-950/50">
                      {['initial', 'midgame', 'endgame', 'another'].map((tab) => (
                        <TabsTrigger
                          key={tab}
                          value={tab}
                          className="capitalize data-[state=active]:bg-blue-300 data-[state=active]:text-slate-900"
                        >
                          {tab === 'midgame' ? 'Mid Game' : tab === 'endgame' ? 'End Game' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <Button
                    onClick={handleNewGame}
                    disabled={loading}
                    className="h-11 w-full rounded-xl bg-emerald-500/90 font-semibold text-white hover:bg-emerald-500"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Play Game
                  </Button>
                </CardContent>
              </Card>
            )}

            {apiError && (
              <Card className="w-full rounded-2xl border border-red-300/40 bg-red-500/15 backdrop-blur-xl">
                <CardContent className="p-4 text-sm text-red-100">{apiError}</CardContent>
              </Card>
            )}

            <div className="w-full">
              {mode === 'demo' ? (
                <div className="flex justify-center">{demoBoards[activeTab]}</div>
              ) : displayBoard ? (
                <div className="w-full">
                  <Board
                    pieces={displayBoard}
                    highlights={highlights}
                    selected={selected}
                    moveable={moveableSet}
                    lastMoveHighlights={lastMoveHighlights}
                    hiddenPieceAt={hiddenPieceAt}
                    animationPayload={animationPayload}
                    onAnimationComplete={finalizeAnimation}
                    disableInteraction={interactionLocked}
                    showAnimationDebug={SHOW_ANIMATION_DEBUG}
                    onSquareClick={handleSquareClick}
                  />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60">
                  <Loader2 className="h-10 w-10 animate-spin text-slate-300/60" />
                </div>
              )}
            </div>

            <div className="mx-auto flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-950/45 px-5 py-3">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Current Turn</span>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <span className={`h-2.5 w-2.5 rounded-full ${currentPlayer === 'blue' ? 'bg-blue-300' : 'bg-rose-300'} ${mode === 'play' && !winner ? 'animate-pulse' : ''}`} />
                {currentPlayerProfile.name}
              </div>
            </div>
          </section>

          <section className="min-w-0 space-y-3 lg:col-span-3 lg:h-[520px] lg:overflow-y-auto lg:pr-1">
            <Card className="w-full rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Game Status</h3>
                  <Badge className="bg-white/10 text-slate-200 hover:bg-white/15">Live</Badge>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Game Mode</span>
                    <span className="font-medium text-slate-100">{GAME_MODE_LABEL[gameMode] ?? 'Human vs Human'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current Turn</span>
                    <span className="font-medium text-slate-100">{currentPlayerProfile.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">AI Tactical Mode</span>
                    <Badge className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/15">
                      {currentPlayerType === 'adiba'
                        ? currentStrategyLabel
                        : currentPlayerProfile?.agentKey === 'megha'
                          ? `Alpha-Beta (${currentPhase})`
                          : 'Black-box Mode'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Timer</span>
                    <span className="font-medium text-slate-100">{timerText}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Move Count</span>
                    <span className="font-medium text-slate-100">{moveCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Captures</span>
                    <span className="font-medium text-slate-100">{captures.blue} - {captures.red}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {mode === 'play' && (
              <Card className="w-full rounded-2xl border border-cyan-300/40 bg-cyan-500/10 backdrop-blur-xl">
                <CardContent className="space-y-4 p-4">
                  <h3 className="text-lg font-semibold text-cyan-100">Strategy Panel</h3>

                  {isSingleAgentMode && (
                    <>
                      <div className="space-y-1.5 text-sm">
                        <p className="text-cyan-100/80">Chosen Move</p>
                        <p className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 font-medium text-slate-100">
                          {lastAgentDecision?.move_text ?? `Waiting for ${singleAgentLabel} turn...`}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-cyan-100/80">Win Probability</p>
                          <p className="font-semibold text-cyan-100">
                            {typeof lastAgentDecision?.win_probability === 'number' ? `${Math.round(lastAgentDecision.win_probability * 100)}%` : '—'}
                          </p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-950/65">
                          <div
                            className="h-full rounded-full bg-cyan-300 transition-all duration-500"
                            style={{ width: `${Math.max(0, Math.min(100, Math.round((lastAgentDecision?.win_probability ?? 0) * 100)))}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p className="text-cyan-100/80">Explanation</p>
                        <div className="h-24 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 leading-relaxed text-slate-100/95">
                          {lastAgentDecision?.explanation ?? `${singleAgentLabel} will explain each move once a decision is made.`}
                        </div>
                      </div>
                      {typeof lastAgentDecision?.searched_depth === 'number' && (
                        <p className="text-xs text-slate-300/90">Search depth: {lastAgentDecision.searched_depth}</p>
                      )}
                    </>
                  )}

                  {gameMode === 'internal-ai-tournament' && (
                    <div className="space-y-3">
                      {['blue', 'red'].map((side) => {
                        const sideDecision = agentDecisionsByColor[side];
                        const sideProfile = players[side] ?? { name: side === 'blue' ? 'Blue Agent' : 'Red Agent' };
                        const isBlueSide = side === 'blue';
                        const containerClass = isBlueSide
                          ? 'border-blue-300/35 bg-blue-500/10'
                          : 'border-rose-300/35 bg-rose-500/10';
                        const labelClass = isBlueSide ? 'text-blue-100/90' : 'text-rose-100/90';
                        const valueClass = isBlueSide ? 'text-blue-50' : 'text-rose-50';
                        const accentClass = isBlueSide ? 'text-blue-200/90' : 'text-rose-200/90';
                        return (
                          <div key={side} className={`rounded-lg border px-3 py-2 ${containerClass}`}>
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className={`text-xs uppercase tracking-wide ${labelClass}`}>{sideProfile.name} ({side})</p>
                              <Badge className={isBlueSide ? 'bg-blue-500/20 text-blue-100 hover:bg-blue-500/20' : 'bg-rose-500/20 text-rose-100 hover:bg-rose-500/20'}>
                                {sideProfile?.agentKey === 'megha' ? 'Alpha-Beta' : 'MCTS + Fuzzy'}
                              </Badge>
                            </div>
                            <div className="mt-2 space-y-1.5 text-sm">
                              <p className={accentClass}>Chosen Move</p>
                              <p className={`rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 font-medium ${valueClass}`}>
                                {sideDecision?.move_text ?? 'Waiting for move...'}
                              </p>
                            </div>
                            <div className="mt-2 space-y-1.5 text-sm">
                              <div className="flex items-center justify-between">
                                <p className={accentClass}>Win Probability</p>
                                <p className={`font-semibold ${valueClass}`}>
                                  {typeof sideDecision?.win_probability === 'number' ? `${Math.round(sideDecision.win_probability * 100)}%` : '—'}
                                </p>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-950/65">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${isBlueSide ? 'bg-blue-300' : 'bg-rose-300'}`}
                                  style={{ width: `${Math.max(0, Math.min(100, Math.round((sideDecision?.win_probability ?? 0) * 100)))}%` }}
                                />
                              </div>
                            </div>
                            <div className="mt-2 space-y-1.5 text-sm">
                              <p className={accentClass}>Explanation</p>
                              <div className={`h-24 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 leading-relaxed ${valueClass}`}>
                                {sideDecision?.explanation ?? 'No explanation yet.'}
                              </div>
                            </div>
                            {typeof sideDecision?.searched_depth === 'number' && (
                              <p className={`mt-1 text-xs ${accentClass}`}>Depth: {sideDecision.searched_depth}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {gameMode === 'online-benchmark' && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-rose-300/35 bg-rose-500/10 px-3 py-2">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="text-xs uppercase tracking-wide text-rose-100/90">Online Agent Context</p>
                          <Badge className="bg-rose-500/20 text-rose-100 hover:bg-rose-500/20">
                            {onlineExternalProfile.name}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm">
                          <p className="text-rose-200/90">Chosen Move</p>
                          <p className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 font-medium text-rose-50">
                            {onlineExternalDecision?.move_text ?? 'Waiting for online agent move...'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-blue-300/35 bg-blue-500/10 px-3 py-2">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="text-xs uppercase tracking-wide text-blue-100/90">Internal Agent Context</p>
                          <Badge className="bg-blue-500/20 text-blue-100 hover:bg-blue-500/20">
                            {onlineInternalProfile.name}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm">
                          <p className="text-blue-200/90">Chosen Move</p>
                          <p className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 font-medium text-blue-50">
                            {onlineInternalDecision?.move_text ?? 'Waiting for internal agent move...'}
                          </p>
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm">
                          <div className="flex items-center justify-between">
                            <p className="text-blue-200/90">Win Probability</p>
                            <p className="font-semibold text-blue-50">
                              {typeof onlineInternalDecision?.win_probability === 'number' ? `${Math.round(onlineInternalDecision.win_probability * 100)}%` : '—'}
                            </p>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-950/65">
                            <div
                              className="h-full rounded-full bg-blue-300 transition-all duration-500"
                              style={{ width: `${Math.max(0, Math.min(100, Math.round((onlineInternalDecision?.win_probability ?? 0) * 100)))}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm">
                          <p className="text-blue-200/90">Explanation</p>
                          <div className="h-24 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 leading-relaxed text-blue-50">
                            {onlineInternalDecision?.explanation ?? `${onlineInternalProfile.name} context will appear after its first move.`}
                          </div>
                        </div>
                        {typeof onlineInternalDecision?.searched_depth === 'number' && (
                          <p className="mt-1 text-xs text-blue-200/90">Depth: {onlineInternalDecision.searched_depth}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {gameMode !== 'internal-ai-tournament' && gameMode !== 'online-benchmark' && !isSingleAgentMode && (strategyKind === 'internal_ai' || strategyKind === 'external_ai') && (
                    <>
                      <div className="space-y-1.5 text-sm">
                        <p className="text-cyan-100/80">Chosen Move</p>
                        <p className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 font-medium text-slate-100">
                          {lastAgentDecision?.move_text ?? `Waiting for ${currentPlayerProfile.name} turn...`}
                        </p>
                      </div>

                      {typeof lastAgentDecision?.win_probability === 'number' && (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <p className="text-cyan-100/80">Win Probability</p>
                            <p className="font-semibold text-cyan-100">{Math.round(lastAgentDecision.win_probability * 100)}%</p>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-950/65">
                            <div
                              className="h-full rounded-full bg-cyan-300 transition-all duration-500"
                              style={{ width: `${Math.max(0, Math.min(100, Math.round((lastAgentDecision.win_probability ?? 0) * 100)))}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5 text-sm">
                        <p className="text-cyan-100/80">Explanation</p>
                        <p className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-slate-200/95">
                          {lastAgentDecision?.explanation ?? 'Waiting for AI analysis...'}
                          {typeof lastAgentDecision?.searched_depth === 'number' ? ` (Depth: ${lastAgentDecision.searched_depth})` : ''}
                        </p>
                      </div>
                    </>
                  )}

                  {!isSingleAgentMode && strategyKind === 'human' && (
                    <p className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-slate-100/95">
                      {(gameMode === 'human-vs-adiba' || gameMode === 'human-vs-megha') && lastAgentDecision
                        ? `${lastAgentDecision.name}: ${lastAgentDecision.explanation ?? 'No explanation available.'}${typeof lastAgentDecision?.searched_depth === 'number' ? ` (Depth: ${lastAgentDecision.searched_depth})` : ''}`
                        : 'Waiting for player move'}
                    </p>
                  )}

                  {strategyKind === 'demo' && (
                    <p className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-slate-100/95">
                      Start a game to view live strategy updates.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        <Card className="mt-6 rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur-xl">
          <CardContent className="p-4 text-sm text-slate-300">
            {mode === 'demo'
              ? 'Demo mode is active. Pick a board snapshot or press Play Game to start a match.'
              : isCurrentTurnHuman
                ? 'Click a piece, then click a highlighted square. Captures are mandatory and multi-jumps complete in one turn.'
                : `Press ${currentTurnActionLabel} to execute the current AI move.`}
          </CardContent>
        </Card>
      </main>

      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm rounded-2xl border border-white/20 bg-slate-900/95">
            <CardContent className="space-y-5 p-6 text-center">
              <h2 className="text-xl font-bold text-white">Are you sure you want to resign?</h2>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate(-1)}
                  className="h-11 w-full rounded-xl bg-amber-500 text-white hover:bg-amber-400"
                >
                  Exit Game
                </Button>
                <Button
                  onClick={() => { setShowResignModal(false); handleNewGame(); }}
                  className="h-11 w-full rounded-xl bg-emerald-500 text-white hover:bg-emerald-400"
                >
                  Start New Game
                </Button>
                <Button
                  onClick={() => setShowResignModal(false)}
                  className="h-11 w-full rounded-xl bg-slate-700 text-white hover:bg-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {winner && mode === 'play' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm rounded-2xl border border-white/20 bg-slate-900/95">
            <CardContent className="space-y-4 p-7 text-center">
              <div className="text-5xl">🏆</div>
              <h2 className="text-3xl font-extrabold text-white">
                {(winnerProfile?.name ?? 'Unknown')} ({winner === 'blue' ? 'Blue' : 'Red'}) Wins!
              </h2>
              <p className="text-slate-300">Game over - start a new match?</p>
              <Button
                onClick={handleNewGame}
                className="h-11 w-full rounded-xl bg-amber-500 text-white hover:bg-amber-400"
              >
                New Game
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GamePage;