import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { CircleHelp, Loader2, Settings } from 'lucide-react';

import AgentPortrait from '../components/AgentPortrait';
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
import { upsertScore } from '../lib/scoresApi';
import { useUser } from '@/context/UserContext';
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

const AGENT_IDENTITY_THEME = {
  megha: {
    panel: 'border-blue-300/35 bg-blue-500/10',
    activePanel: 'border-blue-300/55 bg-blue-500/20 shadow-[0_0_24px_rgba(56,189,248,0.2)]',
    label: 'text-blue-100/90',
    value: 'text-blue-50',
    accent: 'text-blue-200/90',
    badge: 'bg-blue-500/20 text-blue-100 hover:bg-blue-500/20',
    progress: 'bg-blue-300',
  },
  adiba: {
    panel: 'border-rose-300/35 bg-rose-500/10',
    activePanel: 'border-rose-300/55 bg-rose-500/20 shadow-[0_0_24px_rgba(251,113,133,0.2)]',
    label: 'text-rose-100/90',
    value: 'text-rose-50',
    accent: 'text-rose-200/90',
    badge: 'bg-rose-500/20 text-rose-100 hover:bg-rose-500/20',
    progress: 'bg-rose-300',
  },
  external: {
    panel: 'border-cyan-300/35 bg-cyan-500/10',
    activePanel: 'border-cyan-300/55 bg-cyan-500/20 shadow-[0_0_24px_rgba(34,211,238,0.2)]',
    label: 'text-cyan-100/90',
    value: 'text-cyan-50',
    accent: 'text-cyan-200/90',
    badge: 'bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/20',
    progress: 'bg-cyan-300',
  },
  human: {
    panel: 'border-slate-300/25 bg-slate-500/10',
    activePanel: 'border-slate-300/35 bg-slate-500/15',
    label: 'text-slate-200/90',
    value: 'text-slate-100',
    accent: 'text-slate-200/80',
    badge: 'bg-slate-500/20 text-slate-100 hover:bg-slate-500/20',
    progress: 'bg-slate-300',
  },
};

function getAgentIdentity(profile) {
  if (!profile) return 'human';
  if (profile.agentKey === 'megha') return 'megha';
  if (profile.agentKey === 'adiba') return 'adiba';
  if (profile.agentKey === 'external' || profile.type === 'external_ai') return 'external';

  const normalizedName = String(profile.name ?? '').toLowerCase();
  if (normalizedName.includes('megha')) return 'megha';
  if (normalizedName.includes('adiba')) return 'adiba';
  if (normalizedName.includes('online')) return 'external';

  return profile.type === 'human' ? 'human' : 'external';
}

function getIdentityTheme(profile) {
  return AGENT_IDENTITY_THEME[getAgentIdentity(profile)] ?? AGENT_IDENTITY_THEME.external;
}

// Toggle this to true when you want visual marker dots and piece outline during animation debugging.
const SHOW_ANIMATION_DEBUG = false;
const PRE_CAPTURE_ANIMATION_DURATION = 250;
const CAPTURE_ANIMATION_DURATION = 240;
const CAPTURE_SOUND_DATA_URI =
  'data:audio/wav;base64,' +
  'UklGRoQEAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YWAEAACAvOTsz5lbKRQiT4zE5ubFjVElFytbl8vm4LqCSSIaNGeh0eXZr3ZBIB8+cqrV49GkbDogJUh9s9jgyJliNSEsUoe62tu/j1kxIzNckcDa1raEUS4mO2ebxtnQrHpKLCpDcaPK2MmjcUQsLkx7q83VwploPyw0VYSxztK6kGA7LTpejbfPzbKGWTkwQWeVvM/IqX5TNzNIcJ3AzsKhdU02N1B5pMPMvJhtSDY8WIGqxcm1kGZFN0Fgia/Gxa6IX0I5R2iRtMbBp4BaQDtNcJe3xbyfeFQ/P1R4nrrDtphxUD9DW3+jvMGwkGtNP0dihqi9vqqJZUpBTGmNrL26pIJgSENScJOwvbade1tHRlh3mbK8sZd1V0dJXn2etLqskG9UR01khKK1t6eKalFIUWqKpra0oYNlT0pWcI+ptrCbfWFOTFt2lKy1rJZ4XU5PYHyZrrOokHNaTlJmgp2vsaOKbldOVmuHoa+vn4VpVlBacIyjr6yaf2VUUl52kaavqJR6YlRUY3uVqK2kj3VfVFdngJiprKCKcV1UWmyFnKqqnIVtW1VdcYmeqqeYgWlaV2F2jaGppJN8ZllZZXqRoqihj3hkWVtpf5Wkp52KdGJZXm2DmKSlmoZwYFphcoeapaOWgm1fW2R2i5ykoZJ+al5dZ3qOnqSejnpoXl9rfpGfo5uKdmZeYW+ClKChmIZzZF5kcoWWoJ+Ug3BjX2Z2iZignZF/bmJhaXqMmqCbjXxrYmJtfY+bn5iKeGliZHCAkZyelod1aGJmc4STnJyTg3NnY2l2h5WcmpCAcGZka3mKlpyYjX1uZmVufYyYm5aKem1lZ3GAjpialId3a2ZpdIKQmZmRhHVqZmt3hZKZmI+Bc2lnbXmIk5mWjH5xaWhwfIqUmJSJe29panJ/jJWXkod5bmlrdIGOlpaQhHdtaW13hI+WlY2BdWxqb3mGkZaUi39zbGtxfIiSlZKJfXJrbHN+ipOVkIZ7cGxtdYGMk5SOhHlvbG93g42Tk4yCd29scHqFjpOSioB1bm1yfIePk5CIfnRubnR+iJCSj4Z8c25vdoCKkZKNhHpybnF4gouRkYuCeHFvcnqEjJGQioB3cG9zfIWNkY+IfnZwcHV+h46QjYZ9dXBxd3+Ij5CMhHt0cHJ4gYqPj4qCenNxc3qDi4+OiYF4cnF1fISLj42Hf3dycnZ9hoyPjIZ+dnJzd3+HjY6LhHx1cnN5gYiNjYqDe3VydHqCiY2NiIF6dHN2fIOKjYyHgHh0c3d9hYuNi4V+eHR0eH+Gi42KhH13dHV5gIeLjImDfHZ0dnuCiIuLiIF7dnR3fIOJi4uGgHp1dXh9hImLioV/eXV1eX+FiouJhH54dXZ6gIaKi4iDfXh1d3uBh4qKh4F8d3Z3fIKHioqGgHt3dnh9g4iKiYV/end2eX6EiIqIhH55d3d6gIWJioeDfXl3eHuBhomJhoJ8eHd4fIKGiYmFgXx4d3l9g4eJiIWA';

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

function cloneBoard(board) {
  if (!Array.isArray(board)) return board;
  return board.map(row => (Array.isArray(row) ? [...row] : row));
}

function createHistorySnapshot({
  engineBoard,
  currentPlayer,
  moveCount,
  captures,
  noProgressCount,
  repetitionCounts,
}) {
  return {
    engineBoard: cloneBoard(engineBoard),
    currentPlayer,
    moveCount,
    captures: { ...captures },
    noProgressCount,
    repetitionCounts: { ...(repetitionCounts ?? {}) },
  };
}

function getPreCaptureCandidates(moves = []) {
  const uniqueSources = new Set();
  const sources = [];

  for (const move of moves) {
    if (!move?.isJump || !Array.isArray(move.from) || move.from.length < 2) continue;
    const [row, col] = move.from;
    const key = `${row},${col}`;
    if (uniqueSources.has(key)) continue;
    uniqueSources.add(key);
    sources.push([row, col]);
  }

  return sources;
}

const GamePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();

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
  const [drawState,      setDrawState]      = useState(null); // { status: "draw", reason: "no_progress"|"repetition" } | null
  const [noProgressCount, setNoProgressCount] = useState(0);
  const [repetitionCounts, setRepetitionCounts] = useState({});
  const [history,        setHistory]        = useState([]);

  const [legalMoves,     setLegalMoves]     = useState([]);
  const [preCaptureCandidates, setPreCaptureCandidates] = useState([]);
  const [moveableSet,    setMoveableSet]    = useState(new Set());
  const [destinationMap, setDestinationMap] = useState({});

  const [selected,   setSelected]   = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [lastMove, setLastMove] = useState(null); // {from: [r,c], to: [r,c]}
  const [showLastMove, setShowLastMove] = useState(false);
  const [showPreviousBoard, setShowPreviousBoard] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [showVsSplash, setShowVsSplash] = useState(false);

  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isFetchingAgentMove, setIsFetchingAgentMove] = useState(false);
  const [lastAgentDecision, setLastAgentDecision] = useState(null);
  const [agentDecisionsByColor, setAgentDecisionsByColor] = useState({ blue: null, red: null });
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);

  // MVP staged animation state.
  const [isPreCaptureAnimating, setIsPreCaptureAnimating] = useState(false);
  const [preCaptureAnimationPayload, setPreCaptureAnimationPayload] = useState(null);
  const [isMoveAnimating, setIsMoveAnimating] = useState(false);
  const [animationPayload, setAnimationPayload] = useState(null);
  const [isCaptureAnimating, setIsCaptureAnimating] = useState(false);
  const [captureAnimationPayload, setCaptureAnimationPayload] = useState(null);
  const [pendingCommit, setPendingCommit] = useState(null);
  const [hiddenPieceAt, setHiddenPieceAt] = useState(null);

  const animationIdRef = useRef(0);
  const pendingCommitRef = useRef(null);
  const animationWatchdogRef = useRef(null);
  const captureAudioRef = useRef(null);
  const lastCaptureSoundAnimationIdRef = useRef(null);
  const autoPlayedTurnRef = useRef(null);

  const [startTime, setStartTime] = useState(() => Date.now());
  const [elapsed,   setElapsed]   = useState(0);
  const recordedMatchIdRef = useRef(null);

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

  useEffect(() => {
    if (!showVsSplash) return undefined;

    const timeoutId = setTimeout(() => {
      setShowVsSplash(false);
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [showVsSplash]);

  const timerText = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  const boardToRender =
    showPreviousBoard && history.length > 0
      ? history[history.length - 1].engineBoard
      : engineBoard;

  const isShowingPreviousBoard = showPreviousBoard && history.length > 0;

  const displayBoard = useMemo(
    () => (boardToRender ? toDisplayBoard(boardToRender) : null),
    [boardToRender]
  );

  const pieceCounts = useMemo(
    () => countEngineBoard(engineBoard),
    [engineBoard]
  );

  const currentPlayerProfile = players[currentPlayer] ?? { name: 'Player', type: 'human' };
  const currentPlayerType = currentPlayerProfile.type;
  const hasAiPlayersInMatch =
    (players.blue?.type ?? 'human') !== 'human' ||
    (players.red?.type ?? 'human') !== 'human';
  const isCurrentTurnHuman = currentPlayerType === 'human';
  const isCurrentTurnAi = !isCurrentTurnHuman;
  const gameOver = Boolean(winner || drawState?.status === 'draw');
  const isAiTurn = mode === 'play' && isCurrentTurnAi && !gameOver;
  const interactionLocked =
    loading ||
    isFetchingAgentMove ||
    isPreCaptureAnimating ||
    isMoveAnimating ||
    isCaptureAnimating ||
    showVsSplash ||
    isShowingPreviousBoard;

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
    if (!board || gameOver) {
      setLegalMoves([]);
      setPreCaptureCandidates([]);
      setMoveableSet(new Set());
      setDestinationMap({});
      return;
    }
    try {
      const data = await fetchLegalMoves(board, player);
      setLegalMoves(data.moves);
      setPreCaptureCandidates(getPreCaptureCandidates(data.moves));
      setMoveableSet(new Set(data.moveableSquares));
      setDestinationMap(data.destinationMap);
    } catch (err) {
      setApiError(`Failed to load legal moves: ${err.message}`);
    }
  }, [gameOver]);

  const ensureCaptureAudio = useCallback(() => {
    if (!captureAudioRef.current) {
      captureAudioRef.current = new Audio(CAPTURE_SOUND_DATA_URI);
      captureAudioRef.current.preload = 'auto';
      captureAudioRef.current.volume = 0.9;
    }

    return captureAudioRef.current;
  }, []);

  useEffect(() => {
    const unlockCaptureAudio = () => {
      try {
        const audio = ensureCaptureAudio();
        const previousVolume = audio.volume;
        audio.volume = 0;
        const unlock = audio.play();
        if (unlock?.then) {
          unlock
            .then(() => {
              audio.pause();
              audio.currentTime = 0;
              audio.volume = previousVolume;
            })
            .catch(() => {
              audio.volume = previousVolume;
            });
        } else {
          audio.volume = previousVolume;
        }
      } catch {
        // Audio unlock is best-effort only.
      }

      window.removeEventListener('pointerdown', unlockCaptureAudio);
      window.removeEventListener('keydown', unlockCaptureAudio);
    };

    window.addEventListener('pointerdown', unlockCaptureAudio);
    window.addEventListener('keydown', unlockCaptureAudio);

    return () => {
      window.removeEventListener('pointerdown', unlockCaptureAudio);
      window.removeEventListener('keydown', unlockCaptureAudio);
    };
  }, [ensureCaptureAudio]);

  const playCaptureSound = useCallback((animationId) => {
    if (lastCaptureSoundAnimationIdRef.current === animationId) return;
    lastCaptureSoundAnimationIdRef.current = animationId;

    try {
      const audio = ensureCaptureAudio();
      audio.currentTime = 0;
      const playback = audio.play();
      if (playback?.catch) {
        playback.catch(() => {
          // Browser autoplay restrictions should not block animation flow.
        });
      }
    } catch {
      // Audio failures are non-blocking for gameplay and animations.
    }
  }, [ensureCaptureAudio]);

  // Applies the already-validated backend result after the visual glide completes.
  const commitMoveResult = useCallback(async ({ result, move, snapshot, agentDecision = null, actor = null }) => {
    setHistory(prev => [...prev, snapshot]);
    setEngineBoard(result.board);
    setCurrentPlayer(result.currentPlayer);
    setMoveCount(result.moveCount);
    setCaptures(result.captures);
    setWinner(result.winner);
    setDrawState(result.status === 'draw' ? { status: 'draw', reason: result.reason } : null);
    setNoProgressCount(result.noProgressCount ?? 0);
    setRepetitionCounts(result.repetitionCounts ?? {});
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
      setAgentDecisionsByColor(prev => ({
        ...prev,
        [snapshot.currentPlayer]: {
          ...agentDecision,
          type: actor?.type,
          name: actor?.name,
          move_text: agentDecision.move_text ?? formatMoveText(agentDecision.move),
        },
      }));
    }

    if (!result.winner && result.status !== 'draw') {
      const nextType = players[result.currentPlayer]?.type ?? 'human';
      if (nextType === 'human') {
        await loadLegalMoves(result.board, result.currentPlayer);
      } else {
        setLegalMoves([]);
        setPreCaptureCandidates([]);
        setMoveableSet(new Set());
        setDestinationMap({});
      }
    } else {
      setLegalMoves([]);
      setPreCaptureCandidates([]);
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

    const preCaptureStageDone =
      reason === 'pre-capture-complete' ||
      reason === 'pre-capture-watchdog-timeout' ||
      reason === 'pre-capture-no-board-ref' ||
      reason === 'pre-capture-invalid-board-size';

    if (pending.preCaptureRequired && !pending.moveAnimationStarted) {
      if (!preCaptureStageDone) {
        console.warn(`[animation] pre-capture pending id=${animationId} reason=${reason}`);
        return;
      }

      pending.moveAnimationStarted = true;
      pendingCommitRef.current = pending;

      setIsPreCaptureAnimating(false);
      setPreCaptureAnimationPayload(null);
      setAnimationPayload(pending.moveAnimationPayload ?? null);
      setIsMoveAnimating(true);

      if (animationWatchdogRef.current) {
        clearTimeout(animationWatchdogRef.current);
      }

      const movementDuration = Math.max(120, pending.moveAnimationPayload?.duration ?? 320);
      animationWatchdogRef.current = setTimeout(() => {
        console.warn(`[animation] watchdog force-commit id=${animationId}`);
        void finalizeAnimation(animationId, 'watchdog-timeout');
      }, movementDuration + 450);

      console.log(`[animation] movement stage start id=${animationId} after pre-capture (${reason})`);
      return;
    }

    const hasCapturePieces = Array.isArray(pending.capturePieces) && pending.capturePieces.length > 0;
    const captureStageDone =
      reason === 'capture-complete' ||
      reason === 'capture-watchdog-timeout' ||
      reason === 'capture-no-board-ref' ||
      reason === 'capture-invalid-board-size';

    if (hasCapturePieces && !captureStageDone) {
      if (!pending.captureAnimationStarted) {
        pending.captureAnimationStarted = true;
        pendingCommitRef.current = pending;
        setIsCaptureAnimating(true);
        setCaptureAnimationPayload({
          animationId,
          pieces: pending.capturePieces,
          duration: CAPTURE_ANIMATION_DURATION,
        });
        playCaptureSound(animationId);
        console.log(`[animation] capture stage start id=${animationId}`);
      }

      if (animationWatchdogRef.current) {
        clearTimeout(animationWatchdogRef.current);
      }

      animationWatchdogRef.current = setTimeout(() => {
        console.warn(`[animation] capture watchdog force-commit id=${animationId}`);
        void finalizeAnimation(animationId, 'capture-watchdog-timeout');
      }, CAPTURE_ANIMATION_DURATION + 280);

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
      setPreCaptureAnimationPayload(null);
      setAnimationPayload(null);
      setCaptureAnimationPayload(null);
      setHiddenPieceAt(null);
      setIsPreCaptureAnimating(false);
      setIsCaptureAnimating(false);
      setIsMoveAnimating(false);
      setLoading(false);
      setIsFetchingAgentMove(false);
    }
  }, [commitMoveResult, playCaptureSound]);

  // Queues staged overlay animation (pre-capture -> movement -> capture) and delays state commit.
  const queueMoveAnimation = useCallback(({ move, result, snapshot, agentDecision = null, actor = null }) => {
    const from = move?.from;
    const to = move?.to?.[0];
    const movingPiece = from ? displayBoard?.[from[0]]?.[from[1]] : null;
    const capturePieces = (move?.captures ?? [])
      .map(([row, col]) => {
        const capturedPiece = displayBoard?.[row]?.[col];
        if (!capturedPiece) return null;
        return {
          row,
          col,
          color: capturedPiece.color,
          isKing: capturedPiece.isKing,
        };
      })
      .filter(Boolean);

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
        capturePieces,
        captureAnimationStarted: false,
        committed: false,
      };
      pendingCommitRef.current = fallbackPending;
      setPendingCommit(fallbackPending);
      void finalizeAnimation(fallbackId, 'force-commit-missing-payload');
      return;
    }

    const animationId = ++animationIdRef.current;
    const duration = move.isJump ? 460 : 320;
    const preCaptureRequired = Boolean(move?.isJump);

    const nextMovePayload = {
      animationId,
      from,
      to,
      piece: movingPiece,
      duration,
    };

    const nextPreCapturePayload = preCaptureRequired
      ? {
          animationId,
          from,
          piece: movingPiece,
          duration: PRE_CAPTURE_ANIMATION_DURATION,
        }
      : null;

    const nextPending = {
      animationId,
      move,
      result,
      snapshot,
      agentDecision,
      actor,
      capturePieces,
      preCaptureRequired,
      moveAnimationPayload: nextMovePayload,
      moveAnimationStarted: !preCaptureRequired,
      captureAnimationStarted: false,
      committed: false,
    };

    console.log('[animation] payload', nextMovePayload);
    console.log(`[animation] queued id=${animationId}`);

    pendingCommitRef.current = nextPending;
    setPendingCommit(nextPending);
    setPreCaptureAnimationPayload(null);
    setAnimationPayload(null);
    setCaptureAnimationPayload(null);
    // Ensure source piece suppression is active before any pre-capture overlay frame is rendered.
    setHiddenPieceAt(from);
    setIsPreCaptureAnimating(false);
    setIsCaptureAnimating(false);
    setIsMoveAnimating(false);

    if (animationWatchdogRef.current) {
      clearTimeout(animationWatchdogRef.current);
    }

    if (preCaptureRequired) {
      setPreCaptureAnimationPayload(nextPreCapturePayload);
      setIsPreCaptureAnimating(true);

      animationWatchdogRef.current = setTimeout(() => {
        console.warn(`[animation] pre-capture watchdog force-continue id=${animationId}`);
        void finalizeAnimation(animationId, 'pre-capture-watchdog-timeout');
      }, PRE_CAPTURE_ANIMATION_DURATION + 220);

      console.log(`[animation] pre-capture stage start id=${animationId}`);
      return;
    }

    setAnimationPayload(nextMovePayload);
    setIsMoveAnimating(true);

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

      if (captureAudioRef.current) {
        captureAudioRef.current.pause();
        captureAudioRef.current = null;
      }
    };
  }, []);

  const handleNewGame = useCallback(async (playerConfig = players) => {
    if (isMoveAnimating || isPreCaptureAnimating) return;
    setLoading(true);
    setApiError(null);
    autoPlayedTurnRef.current = null;

    if (animationWatchdogRef.current) {
      clearTimeout(animationWatchdogRef.current);
      animationWatchdogRef.current = null;
    }

    pendingCommitRef.current = null;
    setPendingCommit(null);
    setPreCaptureCandidates([]);
    setPreCaptureAnimationPayload(null);
    setAnimationPayload(null);
    setCaptureAnimationPayload(null);
    setHiddenPieceAt(null);
    setIsPreCaptureAnimating(false);
    setIsCaptureAnimating(false);
    setIsMoveAnimating(false);

    try {
      const data = await initGame();
      setEngineBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setMoveCount(data.moveCount);
      setCaptures(data.captures);
      setWinner(data.winner);
      setDrawState(data.status === 'draw' ? { status: 'draw', reason: data.reason } : null);
      setNoProgressCount(data.noProgressCount ?? 0);
      setRepetitionCounts(data.repetitionCounts ?? {});
      setHistory([]);
      setSelected(null);
      setHighlights([]);
      setLastMove(null);
      setShowLastMove(false);
      setShowPreviousBoard(false);
      setIsFetchingAgentMove(false);
      setLastAgentDecision(null);
      setAgentDecisionsByColor({ blue: null, red: null });
      setMode('play');
      setShowVsSplash(Boolean(playerConfig.blue?.agentKey || playerConfig.red?.agentKey));
      setStartTime(Date.now());
      setElapsed(0);
      recordedMatchIdRef.current = null;
      const nextType = playerConfig[data.currentPlayer]?.type ?? 'human';
      if (nextType === 'human') {
        await loadLegalMoves(data.board, data.currentPlayer);
      } else {
        setLegalMoves([]);
        setPreCaptureCandidates([]);
        setMoveableSet(new Set());
        setDestinationMap({});
      }
    } catch (err) {
      setApiError(`Could not start game - is the backend running? (${err.message})`);
    } finally {
      setLoading(false);
    }
  }, [isMoveAnimating, isPreCaptureAnimating, loadLegalMoves, players]);

  // Auto-start when navigated with ?autostart=true
  useEffect(() => {
    const mappedMode = getModeFromQuery(searchParams);
    if (mappedMode) {
      const mappedPlayers = buildPlayersForMode(mappedMode, searchParams);
      const mappedHasAi =
        (mappedPlayers.blue?.type ?? 'human') !== 'human' ||
        (mappedPlayers.red?.type ?? 'human') !== 'human';
      setGameMode(mappedMode);
      setPlayers(mappedPlayers);
      setAutoPlayEnabled(mappedHasAi);
      handleNewGame(mappedPlayers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUndo = async () => {
    if (history.length === 0 || loading || isMoveAnimating || isPreCaptureAnimating) return;
    setLoading(true);
    setApiError(null);
    const willBeEmptyHistory = history.length - 1 <= 0;
    if (willBeEmptyHistory) {
      setShowPreviousBoard(false);
    }
    const snap = history[history.length - 1];
    try {
      setHistory(prev => prev.slice(0, -1));
      setEngineBoard(snap.engineBoard);
      setCurrentPlayer(snap.currentPlayer);
      setMoveCount(snap.moveCount);
      setCaptures(snap.captures);
      setWinner(null);
      setDrawState(null);
      setNoProgressCount(snap.noProgressCount ?? 0);
      setRepetitionCounts(snap.repetitionCounts ?? {});
      setSelected(null);
      setHighlights([]);
      const restoreType = players[snap.currentPlayer]?.type ?? 'human';
      if (restoreType === 'human') {
        await loadLegalMoves(snap.engineBoard, snap.currentPlayer);
      } else {
        setLegalMoves([]);
        setPreCaptureCandidates([]);
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
    if (gameOver || mode !== 'play' || isMoveAnimating || isPreCaptureAnimating) return;
    const resignWinner = currentPlayer === 'blue' ? 'red' : 'blue';
    setWinner(resignWinner);
    setDrawState(null);
    setLegalMoves([]);
    setPreCaptureCandidates([]);
    setMoveableSet(new Set());
  };

  const handleShowDemo = () => {
    setMode('demo');
    setShowVsSplash(false);
    setSelected(null);
    setHighlights([]);
  };

  const handleTogglePreviousBoard = () => {
    if (history.length === 0) return;
    if (isMoveAnimating || isCaptureAnimating || isPreCaptureAnimating) return;
    setShowPreviousBoard(prev => !prev);
  };

  const handleSquareClick = async (row, col) => {
    if (interactionLocked || gameOver || mode !== 'play' || isAiTurn) return;

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
        const snapshot = createHistorySnapshot({
          engineBoard,
          currentPlayer,
          moveCount,
          captures,
          noProgressCount,
          repetitionCounts,
        });
        try {
          const result = await sendMove(
            engineBoard,
            move,
            currentPlayer,
            captures,
            moveCount,
            noProgressCount,
            repetitionCounts,
          );
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

  const handleAgentMove = useCallback(async () => {
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
        setPreCaptureCandidates([]);
        setMoveableSet(new Set());
        setDestinationMap({});
        setIsFetchingAgentMove(false);
        return;
      }

      const snapshot = createHistorySnapshot({
        engineBoard,
        currentPlayer,
        moveCount,
        captures,
        noProgressCount,
        repetitionCounts,
      });
      const result = await sendMove(
        engineBoard,
        decision.move,
        currentPlayer,
        captures,
        moveCount,
        noProgressCount,
        repetitionCounts,
      );

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
  }, [
    captures,
    currentPlayer,
    engineBoard,
    interactionLocked,
    isAiTurn,
    moveCount,
    noProgressCount,
    players,
    queueMoveAnimation,
    repetitionCounts,
  ]);

  useEffect(() => {
    if (!autoPlayEnabled) {
      autoPlayedTurnRef.current = null;
    }
  }, [autoPlayEnabled]);

  useEffect(() => {
    if (!autoPlayEnabled || !hasAiPlayersInMatch || !isAiTurn || !engineBoard || interactionLocked) return;

    const turnKey = `${currentPlayer}:${moveCount}`;
    if (autoPlayedTurnRef.current === turnKey) return;

    autoPlayedTurnRef.current = turnKey;
    const timeoutId = setTimeout(() => {
      void handleAgentMove();
    }, 260);

    return () => clearTimeout(timeoutId);
  }, [autoPlayEnabled, currentPlayer, engineBoard, handleAgentMove, hasAiPlayersInMatch, interactionLocked, isAiTurn, moveCount]);

  const demoBoards = {
    initial: <InitialBoard />,
    midgame: <MidGameBoard />,
    endgame: <EndGameBoard />,
    another: <AnotherGameState />,
  };

  // Compute last move highlights
  const lastMoveHighlights = useMemo(() => {
    if (isShowingPreviousBoard || !showLastMove || !lastMove) return [];
    return [lastMove.from, lastMove.to];
  }, [isShowingPreviousBoard, showLastMove, lastMove]);

  const hiddenCaptureSquares = useMemo(() => {
    if (!isCaptureAnimating || !captureAnimationPayload?.pieces?.length) return [];
    return captureAnimationPayload.pieces.map(piece => [piece.row, piece.col]);
  }, [captureAnimationPayload, isCaptureAnimating]);

  const bluePlayer = players.blue ?? { name: 'Player 1', type: 'human' };
  const redPlayer = players.red ?? { name: 'Player 2', type: 'human' };
  const blueIdentityTheme = getIdentityTheme(bluePlayer);
  const redIdentityTheme = getIdentityTheme(redPlayer);

  const strategyKind = mode !== 'play' ? 'demo' : currentPlayerType;
  const isSingleAgentMode = gameMode === 'human-vs-adiba' || gameMode === 'human-vs-megha';
  const singleAgentLabel = gameMode === 'human-vs-megha' ? 'Agent Megha' : 'Agent Adiba';
  const winnerProfile = winner ? players[winner] : null;
  const drawReasonLabel = drawState?.reason === 'no_progress'
    ? '40 no-progress moves'
    : drawState?.reason === 'repetition'
      ? '3x board repetition'
      : 'Draw';
  const onlineInternalProfile = players.blue ?? { name: 'Internal Agent', agentKey: 'adiba' };
  const onlineExternalProfile = players.red ?? { name: 'Online Agent', agentKey: 'external' };
  const onlineInternalDecision = agentDecisionsByColor.blue;
  const onlineExternalDecision = agentDecisionsByColor.red;
  const onlineInternalTheme = getIdentityTheme(onlineInternalProfile);
  const onlineExternalTheme = getIdentityTheme(onlineExternalProfile);
  const strategyAgentProfile = isSingleAgentMode
    ? (players.red?.agentKey ? players.red : players.blue)
    : strategyKind === 'internal_ai' || strategyKind === 'external_ai'
      ? currentPlayerProfile
      : null;
  const strategyAgentTheme = strategyAgentProfile ? getIdentityTheme(strategyAgentProfile) : AGENT_IDENTITY_THEME.external;
  const strategyAgentSide = strategyAgentProfile === players.red ? 'red' : 'blue';

  useEffect(() => {
    if ((!winner && drawState?.status !== 'draw') || mode !== 'play') return;

    const matchId = `${startTime}-${gameMode}-${players.blue?.name}-${players.red?.name}`;
    if (recordedMatchIdRef.current === matchId) return;

    const blueName = players.blue?.type === 'human'
      ? (user?.username || players.blue?.name || 'Player 1')
      : (players.blue?.name || 'Blue');
    const redName = players.red?.type === 'human'
      ? (players.blue?.type === 'human' ? (players.red?.name || 'Player 2') : (user?.username || players.red?.name || 'Player 2'))
      : (players.red?.name || 'Red');

    if (!user?.email) return;

    const winnerSide = winner === 'blue' ? 'player1' : winner === 'red' ? 'player2' : 'draw';
    void upsertScore({
      userEmail: user.email,
      player1: blueName,
      player2: redName,
      winner: winnerSide,
      gameMode,
    }).catch(() => {
      // Score updates should not block gameplay UI.
    });

    recordedMatchIdRef.current = matchId;
  }, [captures.blue, captures.red, drawState, gameMode, mode, players, startTime, user, winner]);

  // Responsive container and layout
  return (
    <div className="cyber-game-ui min-h-screen text-slate-100">
      {mode === 'play' && showVsSplash && (
        <div className="agent-vs-overlay">
          <div className="agent-vs-card">
            <div className="mb-4 text-center">
              <p className="text-xs uppercase tracking-[0.38em] text-cyan-100/65">Match Sync</p>
              <h2 className="agent-vs-title cyber-heading mt-2 text-3xl text-white sm:text-4xl">Combatants Online</h2>
            </div>

            <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
              <div className="flex flex-1 flex-col items-center gap-3 text-center">
                <AgentPortrait profile={bluePlayer} side="blue" size="hero" loading="eager" />
                <div>
                  <p className="text-lg font-semibold text-slate-50 sm:text-xl">{bluePlayer.name}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-xs uppercase tracking-[0.38em] text-slate-400">Arena Link</span>
                <div className="rounded-full border border-cyan-300/35 bg-slate-950/70 px-5 py-3 shadow-[0_0_18px_rgba(34,211,238,0.18)]">
                  <span className="cyber-heading text-2xl text-cyan-100 sm:text-3xl">VS</span>
                </div>
              </div>

              <div className="flex flex-1 flex-col items-center gap-3 text-center">
                <AgentPortrait profile={redPlayer} side="red" size="hero" loading="eager" />
                <div>
                  <p className="text-lg font-semibold text-slate-50 sm:text-xl">{redPlayer.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/65 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-slate-100 hover:bg-white/10 sm:h-9"
            >
              Back
            </Button>
            <h1 className="cyber-heading truncate text-base font-semibold uppercase tracking-[0.14em] text-blue-100 sm:text-lg sm:tracking-[0.22em] md:text-xl">Checkers Arena</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 sm:h-9 sm:w-9">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 sm:h-9 sm:w-9">
              <CircleHelp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl overflow-visible px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="order-2 min-w-0 space-y-3 lg:order-1 lg:col-span-3 lg:h-[520px] lg:overflow-y-auto lg:pr-1">
            <Card className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 shadow-[0_16px_45px_rgba(2,6,23,0.35)] backdrop-blur-xl">
              <CardContent className="space-y-4 p-4">
                <div className={`CyberPanel rounded-xl border p-4 ${mode === 'play' && !gameOver && currentPlayer === 'blue' ? blueIdentityTheme.activePanel : blueIdentityTheme.panel}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AgentPortrait profile={bluePlayer} side="blue" size="md" />
                      <div>
                        <p className={`text-sm uppercase tracking-wide ${blueIdentityTheme.label}`}>{bluePlayer.name}</p>
                        <p className="font-semibold text-white">{PLAYER_TYPE_LABEL[bluePlayer.type]}</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-100 hover:bg-blue-500/20">Blue</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Captures</p>
                      <p className={`text-xl font-bold ${blueIdentityTheme.value}`}>{captures.blue}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Pieces</p>
                      <p className={`text-xl font-bold ${blueIdentityTheme.value}`}>{pieceCounts.blue}</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className={`CyberPanel rounded-xl border p-4 ${mode === 'play' && !gameOver && currentPlayer === 'red' ? redIdentityTheme.activePanel : redIdentityTheme.panel}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AgentPortrait profile={redPlayer} side="red" size="md" />
                      <div>
                        <p className={`text-sm uppercase tracking-wide ${redIdentityTheme.label}`}>{redPlayer.name}</p>
                        <p className="font-semibold text-white">{PLAYER_TYPE_LABEL[redPlayer.type]}</p>
                      </div>
                    </div>
                    <Badge className="bg-rose-500/20 text-rose-100 hover:bg-rose-500/20">Red</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Captures</p>
                      <p className={`text-xl font-bold ${redIdentityTheme.value}`}>{captures.red}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Pieces</p>
                      <p className={`text-xl font-bold ${redIdentityTheme.value}`}>{pieceCounts.red}</p>
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
                      ? (isFetchingAgentMove
                        ? `${currentPlayerProfile.name} is thinking...`
                        : autoPlayEnabled
                          ? `${currentPlayerProfile.name} will move automatically.`
                          : `${currentPlayerProfile.name} is waiting for command.`)
                      : `${currentPlayerProfile.name} is a human turn.`}
                  </span>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl">
              <CardContent className="space-y-3 p-4">
                {mode === 'play' && hasAiPlayersInMatch && (
                  <div className="CyberPanel flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Auto Play</p>
                      <p className="text-[11px] text-slate-400">{autoPlayEnabled ? 'ON: AI turns run automatically' : 'OFF: click Agent Move manually'}</p>
                    </div>
                    <Switch
                      checked={autoPlayEnabled}
                      onCheckedChange={setAutoPlayEnabled}
                      aria-label="Toggle auto play for AI turns"
                    />
                  </div>
                )}

                {mode === 'play' && hasAiPlayersInMatch && (
                  <Button
                    onClick={handleAgentMove}
                    disabled={autoPlayEnabled || !isAiTurn || loading || isFetchingAgentMove || isMoveAnimating || isPreCaptureAnimating || gameOver}
                    className="h-11 w-full rounded-xl font-semibold disabled:opacity-60"
                  >
                    {isFetchingAgentMove && !autoPlayEnabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {autoPlayEnabled
                      ? 'Auto Play Enabled'
                      : isCurrentTurnAi
                      ? (isFetchingAgentMove ? 'Thinking...' : currentTurnActionLabel)
                      : 'Agent Move (Waiting)'}
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleTogglePreviousBoard}
                    variant="outline"
                    className="h-11 rounded-xl"
                    disabled={history.length === 0 || isFetchingAgentMove || isMoveAnimating || isCaptureAnimating || isPreCaptureAnimating}
                  >
                    {isShowingPreviousBoard ? 'Current Board' : 'Last Move'}
                  </Button>
                  <Button
                    onClick={() => setShowResignModal(true)}
                    disabled={loading || isFetchingAgentMove || isMoveAnimating || isPreCaptureAnimating || gameOver || mode !== 'play'}
                    variant="destructive"
                    className="h-11 rounded-xl"
                  >
                    Resign
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="order-1 flex min-w-0 flex-col items-center justify-center space-y-4 overflow-visible lg:order-2 lg:col-span-6">
            {mode === 'demo' && (
              <Card className="w-full rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl">
                <CardContent className="space-y-3 p-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-950/50 sm:grid-cols-4">
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
                    className="h-11 w-full rounded-xl font-semibold"
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

            {mode === 'play' && isShowingPreviousBoard && (
              <Card className="w-full rounded-2xl border border-cyan-300/40 bg-cyan-500/10 backdrop-blur-xl">
                <CardContent className="p-3 text-sm font-medium text-cyan-100">Viewing Previous Move</CardContent>
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
                    hiddenCaptureSquares={hiddenCaptureSquares}
                    preCaptureCandidates={preCaptureCandidates}
                    preCaptureAnimationPayload={preCaptureAnimationPayload}
                    animationPayload={animationPayload}
                    captureAnimationPayload={captureAnimationPayload}
                    onPreCaptureAnimationComplete={finalizeAnimation}
                    onAnimationComplete={finalizeAnimation}
                    onCaptureAnimationComplete={finalizeAnimation}
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

          </section>

          <section className="order-3 min-w-0 space-y-3 lg:order-3 lg:col-span-3 lg:h-[520px] lg:overflow-y-auto lg:pr-1">
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
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {strategyAgentProfile && (
                        <AgentPortrait
                          profile={strategyAgentProfile}
                          side={strategyAgentSide}
                          size="sm"
                        />
                      )}
                      <div>
                        <h3 className={`text-lg font-semibold ${strategyAgentTheme.value}`}>Strategy Panel</h3>
                        <p className={`text-xs uppercase tracking-[0.2em] ${strategyAgentTheme.accent}`}>
                          {strategyAgentProfile ? strategyAgentProfile.name : 'Live match telemetry'}
                        </p>
                      </div>
                    </div>
                    <Badge className={strategyAgentTheme.badge}>Live</Badge>
                  </div>

                  {isSingleAgentMode && (
                    <>
                      <div className={`flex items-center gap-3 rounded-xl border bg-slate-950/45 px-3 py-2 ${strategyAgentTheme.panel}`}>
                        <AgentPortrait profile={strategyAgentProfile} side={strategyAgentSide} size="sm" />
                        <div>
                          <p className={`text-xs uppercase tracking-[0.18em] ${strategyAgentTheme.accent}`}>Active Analyst</p>
                          <p className="font-semibold text-slate-50">{singleAgentLabel}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p className={strategyAgentTheme.accent}>Chosen Move</p>
                        <p className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 font-medium text-slate-100">
                          {lastAgentDecision?.move_text ?? `Waiting for ${singleAgentLabel} turn...`}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <p className={strategyAgentTheme.accent}>Win Probability</p>
                          <p className={`font-semibold ${strategyAgentTheme.value}`}>
                            {typeof lastAgentDecision?.win_probability === 'number' ? `${Math.round(lastAgentDecision.win_probability * 100)}%` : '—'}
                          </p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-950/65">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${strategyAgentTheme.progress}`}
                            style={{ width: `${Math.max(0, Math.min(100, Math.round((lastAgentDecision?.win_probability ?? 0) * 100)))}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p className={strategyAgentTheme.accent}>Explanation</p>
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
                        const identityTheme = getIdentityTheme(sideProfile);
                        return (
                          <div key={side} className={`rounded-lg border px-3 py-2 ${identityTheme.panel}`}>
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <AgentPortrait profile={sideProfile} side={side} size="xs" />
                                <div>
                                  <p className={`text-xs uppercase tracking-wide ${identityTheme.label}`}>{sideProfile.name} ({side})</p>
                                </div>
                              </div>
                              <Badge className={identityTheme.badge}>
                                {sideProfile?.agentKey === 'megha' ? 'Alpha-Beta' : 'MCTS + Fuzzy'}
                              </Badge>
                            </div>
                            <div className="mt-2 space-y-1.5 text-sm">
                              <p className={identityTheme.accent}>Chosen Move</p>
                              <p className={`rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 font-medium ${identityTheme.value}`}>
                                {sideDecision?.move_text ?? 'Waiting for move...'}
                              </p>
                            </div>
                            <div className="mt-2 space-y-1.5 text-sm">
                              <div className="flex items-center justify-between">
                                <p className={identityTheme.accent}>Win Probability</p>
                                <p className={`font-semibold ${identityTheme.value}`}>
                                  {typeof sideDecision?.win_probability === 'number' ? `${Math.round(sideDecision.win_probability * 100)}%` : '—'}
                                </p>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-950/65">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${identityTheme.progress}`}
                                  style={{ width: `${Math.max(0, Math.min(100, Math.round((sideDecision?.win_probability ?? 0) * 100)))}%` }}
                                />
                              </div>
                            </div>
                            <div className="mt-2 space-y-1.5 text-sm">
                              <p className={identityTheme.accent}>Explanation</p>
                              <div className={`h-24 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 leading-relaxed ${identityTheme.value}`}>
                                {sideDecision?.explanation ?? 'No explanation yet.'}
                              </div>
                            </div>
                            {typeof sideDecision?.searched_depth === 'number' && (
                              <p className={`mt-1 text-xs ${identityTheme.accent}`}>Depth: {sideDecision.searched_depth}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {gameMode === 'online-benchmark' && (
                    <div className="space-y-3">
                      <div className={`rounded-lg border px-3 py-2 ${onlineExternalTheme.panel}`}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AgentPortrait profile={onlineExternalProfile} side="red" size="xs" />
                            <p className={`text-xs uppercase tracking-wide ${onlineExternalTheme.label}`}>Online Agent Context</p>
                          </div>
                          <Badge className={onlineExternalTheme.badge}>
                            {onlineExternalProfile.name}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm">
                          <p className={onlineExternalTheme.accent}>Chosen Move</p>
                          <p className={`rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 font-medium ${onlineExternalTheme.value}`}>
                            {onlineExternalDecision?.move_text ?? 'Waiting for online agent move...'}
                          </p>
                        </div>
                      </div>

                      <div className={`rounded-lg border px-3 py-2 ${onlineInternalTheme.panel}`}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AgentPortrait profile={onlineInternalProfile} side="blue" size="xs" />
                            <p className={`text-xs uppercase tracking-wide ${onlineInternalTheme.label}`}>Internal Agent Context</p>
                          </div>
                          <Badge className={onlineInternalTheme.badge}>
                            {onlineInternalProfile.name}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm">
                          <p className={onlineInternalTheme.accent}>Chosen Move</p>
                          <p className={`rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 font-medium ${onlineInternalTheme.value}`}>
                            {onlineInternalDecision?.move_text ?? 'Waiting for internal agent move...'}
                          </p>
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm">
                          <div className="flex items-center justify-between">
                            <p className={onlineInternalTheme.accent}>Win Probability</p>
                            <p className={`font-semibold ${onlineInternalTheme.value}`}>
                              {typeof onlineInternalDecision?.win_probability === 'number' ? `${Math.round(onlineInternalDecision.win_probability * 100)}%` : '—'}
                            </p>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-950/65">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${onlineInternalTheme.progress}`}
                              style={{ width: `${Math.max(0, Math.min(100, Math.round((onlineInternalDecision?.win_probability ?? 0) * 100)))}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm">
                          <p className={onlineInternalTheme.accent}>Explanation</p>
                          <div className={`h-24 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 leading-relaxed ${onlineInternalTheme.value}`}>
                            {onlineInternalDecision?.explanation ?? `${onlineInternalProfile.name} context will appear after its first move.`}
                          </div>
                        </div>
                        {typeof onlineInternalDecision?.searched_depth === 'number' && (
                          <p className={`mt-1 text-xs ${onlineInternalTheme.accent}`}>Depth: {onlineInternalDecision.searched_depth}</p>
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

      </main>

      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
          <Card className="CyberDialog w-full max-w-sm rounded-2xl border border-white/20 bg-slate-900/95">
            <CardContent className="space-y-5 p-6 text-center">
              <h2 className="text-xl font-bold text-white">Are you sure you want to resign?</h2>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate(-1)}
                  variant="destructive"
                  className="h-11 w-full rounded-xl"
                >
                  Exit Game
                </Button>
                <Button
                  onClick={() => { setShowResignModal(false); handleNewGame(); }}
                  className="h-11 w-full rounded-xl"
                >
                  Start New Game
                </Button>
                <Button
                  onClick={() => setShowResignModal(false)}
                  variant="secondary"
                  className="h-11 w-full rounded-xl"
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
          <Card className="CyberDialog w-full max-w-sm rounded-2xl border border-white/20 bg-slate-900/95">
            <CardContent className="space-y-4 p-7 text-center">
              <div className="text-5xl">🏆</div>
              <h2 className="text-3xl font-extrabold text-white">
                {(winnerProfile?.name ?? 'Unknown')} ({winner === 'blue' ? 'Blue' : 'Red'}) Wins!
              </h2>
              <p className="text-slate-300">Game over - start a new match?</p>
              <Button
                onClick={handleNewGame}
                className="h-11 w-full rounded-xl"
              >
                New Game
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {drawState?.status === 'draw' && mode === 'play' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
          <Card className="CyberDialog w-full max-w-sm rounded-2xl border border-white/20 bg-slate-900/95">
            <CardContent className="space-y-4 p-7 text-center">
              <div className="text-5xl">🤝</div>
              <h2 className="text-3xl font-extrabold text-white">Draw</h2>
              <p className="text-slate-300">Reason: {drawReasonLabel}</p>
              <Button
                onClick={handleNewGame}
                className="h-11 w-full rounded-xl"
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
