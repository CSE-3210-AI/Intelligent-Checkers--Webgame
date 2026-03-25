import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
} from '../lib/gameApi';
import {
  detectGamePhase,
  getPhaseStrategyLabel,
} from '../lib/agentAdiba';

const opposite = (player) => (player === 'blue' ? 'red' : 'blue');

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
  const [isFetchingAdibaMove, setIsFetchingAdibaMove] = useState(false);
  const [lastAdibaDecision, setLastAdibaDecision] = useState(null);

  const [startTime, setStartTime] = useState(() => Date.now());
  const [elapsed,   setElapsed]   = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      1000
    );
    return () => clearInterval(id);
  }, [startTime]);

  const timerText = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  const displayBoard = useMemo(
    () => (engineBoard ? toDisplayBoard(engineBoard) : null),
    [engineBoard]
  );

  const pieceCounts = useMemo(
    () => countEngineBoard(engineBoard),
    [engineBoard]
  );

  const isAdibaMode = gameMode === 'human-vs-adiba';
  const isAiTurn = mode === 'play' && isAdibaMode && currentPlayer === 'red' && !winner;

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

  const handleNewGame = useCallback(async () => {
    setLoading(true);
    setApiError(null);
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
      setIsFetchingAdibaMove(false);
      setLastAdibaDecision(null);
      setMode('play');
      setStartTime(Date.now());
      setElapsed(0);
      await loadLegalMoves(data.board, data.currentPlayer);
    } catch (err) {
      setApiError(`Could not start game - is the backend running? (${err.message})`);
    } finally {
      setLoading(false);
    }
  }, [loadLegalMoves]);

  // Auto-start when navigated with ?autostart=true
  useEffect(() => {
    if (searchParams.get('autostart') === 'true') {
      setGameMode('human-vs-human');
      handleNewGame();
    } else if (searchParams.get('mode') === 'agent-adiba') {
      setGameMode('human-vs-adiba');
      handleNewGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUndo = async () => {
    if (history.length === 0 || loading) return;
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
      await loadLegalMoves(snap.engineBoard, snap.currentPlayer);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResign = () => {
    if (winner || mode !== 'play') return;
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
    if (loading || isFetchingAdibaMove || winner || mode !== 'play' || isAiTurn) return;

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
          if (!result.winner) {
            if (isAdibaMode && result.currentPlayer === 'red') {
              setLegalMoves([]);
              setMoveableSet(new Set());
              setDestinationMap({});
            } else {
              await loadLegalMoves(result.board, result.currentPlayer);
            }
          } else {
            setLegalMoves([]);
            setMoveableSet(new Set());
          }
        } catch (err) {
          setApiError(`Move failed: ${err.message}`);
        } finally {
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

  const handleAdibaMove = async () => {
    if (!isAiTurn || !engineBoard || loading || isFetchingAdibaMove) return;
    if (currentPlayer !== 'red') {
      console.error('WRONG TURN - AI SHOULD NOT MOVE');
      return;
    }

    setIsFetchingAdibaMove(true);
    setApiError(null);
    setSelected(null);
    setHighlights([]);

    try {
      console.log('TURN STATE:', currentPlayer);
      console.log('CALLING AI FOR:', 'red');
      console.log('BOARD SENT TO AI:', engineBoard);

      const decision = await getAgentAdibaMove(engineBoard, 'red');
      console.log('AI RESPONSE:', decision);

      if (decision?.error) {
        setApiError(`AI failed to generate move: ${decision.error}`);
        setLastAdibaDecision({
          move: null,
          move_text: 'No move generated',
          win_probability: 0,
          explanation: decision.error,
          phase: decision?.phase,
        });
        return;
      }

      if (!decision?.move) {
        if (decision?.game_over === true) {
          setWinner(opposite(currentPlayer));
        } else {
          setApiError('AI failed to generate move');
        }
        setLastAdibaDecision({
          move: null,
          move_text: 'No move generated',
          win_probability: 0,
          explanation: decision?.explanation ?? 'AI failed to generate move',
          phase: decision?.phase,
        });
        if (decision?.game_over === true) {
          setLegalMoves([]);
          setMoveableSet(new Set());
          setDestinationMap({});
        }
        return;
      }

      const snapshot = { engineBoard, currentPlayer, moveCount, captures };
      const result = await sendMove(engineBoard, decision.move, currentPlayer, captures, moveCount);

      setHistory(prev => [...prev, snapshot]);
      setEngineBoard(result.board);
      setCurrentPlayer(result.currentPlayer);
      setMoveCount(result.moveCount);
      setCaptures(result.captures);
      setWinner(result.winner);
      setLastMove({ from: decision.move.from, to: decision.move.to[0] });
      setShowLastMove(true);
      setLastAdibaDecision({
        ...decision,
        move_text: decision.move_text ?? formatMoveText(decision.move),
      });

      if (!result.winner) {
        await loadLegalMoves(result.board, result.currentPlayer);
      } else {
        setLegalMoves([]);
        setMoveableSet(new Set());
        setDestinationMap({});
      }
    } catch (err) {
      setApiError(`Agent Adiba failed to move: ${err.message}`);
    } finally {
      setIsFetchingAdibaMove(false);
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
          <section className="min-w-0 space-y-4 lg:col-span-3">
            <Card className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 shadow-[0_16px_45px_rgba(2,6,23,0.35)] backdrop-blur-xl">
              <CardContent className="space-y-4 p-4">
                <div className={`rounded-xl border p-4 ${mode === 'play' && !winner && currentPlayer === 'blue' ? 'border-blue-300/50 bg-blue-500/20' : 'border-white/10 bg-slate-900/60'}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/25 text-blue-200">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-wide text-blue-200/80">Player 1</p>
                        <p className="font-semibold text-white">Human</p>
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
                        {isAdibaMode ? <Bot className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-wide text-rose-200/80">Agent Adiba</p>
                        <p className="font-semibold text-white">{isAdibaMode ? 'AI Opponent' : 'Player 2'}</p>
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

            {isAdibaMode && mode === 'play' && (
              <Card className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 backdrop-blur-lg">
                <CardContent className="flex items-center gap-3 p-4 text-sm text-cyan-100">
                  <span className={`h-2.5 w-2.5 rounded-full ${isFetchingAdibaMove ? 'animate-pulse bg-cyan-300' : 'bg-cyan-300/70'}`} />
                  <span>{isFetchingAdibaMove ? 'Agent Adiba is thinking...' : 'Agent Adiba is waiting for command.'}</span>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl">
              <CardContent className="space-y-3 p-4">
                <Button
                  onClick={handleNewGame}
                  disabled={loading || isFetchingAdibaMove}
                  className="h-11 w-full rounded-xl bg-blue-500/80 font-semibold text-white hover:bg-blue-500"
                >
                  {(loading || isFetchingAdibaMove) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  New Game
                </Button>

                {isAdibaMode && mode === 'play' && (
                  <Button
                    onClick={handleAdibaMove}
                    disabled={!isAiTurn || loading || isFetchingAdibaMove || !!winner}
                    className="h-11 w-full rounded-xl bg-rose-500/80 font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                  >
                    {isFetchingAdibaMove && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isFetchingAdibaMove ? 'Thinking...' : 'Adiba Move'}
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
                    disabled={!lastMove || isFetchingAdibaMove}
                  >
                    Last Move
                  </Button>
                  <Button
                    onClick={() => setShowResignModal(true)}
                    disabled={loading || isFetchingAdibaMove || !!winner || mode !== 'play'}
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
                {currentPlayer === 'blue' ? 'Player 1' : isAdibaMode ? 'Agent Adiba' : 'Player 2'}
              </div>
            </div>
          </section>

          <section className="min-w-0 space-y-4 lg:col-span-3">
            <Card className="w-full rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Game Status</h3>
                  <Badge className="bg-white/10 text-slate-200 hover:bg-white/15">Live</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-slate-950/45 p-1">
                  <Button
                    onClick={() => setGameMode('human-vs-human')}
                    variant={gameMode === 'human-vs-human' ? 'default' : 'ghost'}
                    className={gameMode === 'human-vs-human' ? 'h-8 rounded-lg bg-blue-300 text-slate-900 hover:bg-blue-200' : 'h-8 rounded-lg text-slate-300 hover:bg-white/10'}
                  >
                    PvP
                  </Button>
                  <Button
                    onClick={() => setGameMode('human-vs-adiba')}
                    variant={gameMode === 'human-vs-adiba' ? 'default' : 'ghost'}
                    className={gameMode === 'human-vs-adiba' ? 'h-8 rounded-lg bg-blue-300 text-slate-900 hover:bg-blue-200' : 'h-8 rounded-lg text-slate-300 hover:bg-white/10'}
                  >
                    PvAgent
                  </Button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Game Mode</span>
                    <span className="font-medium text-slate-100">{isAdibaMode ? 'Human vs Agent Adiba' : 'Human vs Human'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">AI Tactical Mode</span>
                    <Badge className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/15">{lastAdibaDecision?.strategy ?? currentStrategyLabel}</Badge>
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

            {isAdibaMode && mode === 'play' && (
              <Card className="w-full rounded-2xl border border-cyan-300/40 bg-cyan-500/10 backdrop-blur-xl">
                <CardContent className="space-y-4 p-4">
                  <h3 className="text-lg font-semibold text-cyan-100">Adiba Strategy</h3>

                  <div className="space-y-1.5 text-sm">
                    <p className="text-cyan-100/80">Chosen Move</p>
                    <p className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 font-medium text-slate-100">
                      {lastAdibaDecision?.move_text ?? 'Waiting for Adiba Move button...'}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-cyan-100/80">Win Probability</p>
                      <p className="font-semibold text-cyan-100">
                        {lastAdibaDecision ? `${Math.round(lastAdibaDecision.win_probability * 100)}%` : '—'}
                      </p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-950/65">
                      <div
                        className="h-full rounded-full bg-cyan-300 transition-all duration-500"
                        style={{ width: `${Math.max(0, Math.min(100, Math.round((lastAdibaDecision?.win_probability ?? 0) * 100)))}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <p className="text-cyan-100/80">Explanation</p>
                    <p className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 leading-relaxed text-slate-100/95">
                      {lastAdibaDecision?.explanation ?? 'Agent Adiba will explain each move once a decision is made.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        <Card className="mt-6 rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur-xl">
          <CardContent className="p-4 text-sm text-slate-300">
            {mode === 'demo'
              ? 'Demo mode is active. Pick a board snapshot or press Play Game to start a match.'
              : isAdibaMode
                ? 'Human is Blue and Agent Adiba is Red. Trigger Adiba using the Adiba Move button when it is red turn.'
                : 'Click a piece, then click a highlighted square. Captures are mandatory and multi-jumps complete in one turn.'}
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
                {winner === 'blue'
                  ? 'Player 1 (Blue)'
                  : (isAdibaMode ? 'Agent Adiba (Red)' : 'Player 2 (Red)')} Wins!
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