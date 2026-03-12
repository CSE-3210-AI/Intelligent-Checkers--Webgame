import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Home, Clock, Users, Loader2 } from 'lucide-react';

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
} from '../lib/gameApi';

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
    if (loading || winner || mode !== 'play') return;

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
            await loadLegalMoves(result.board, result.currentPlayer);
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
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col items-center justify-center p-4">
      <div
        className="w-full mx-auto game-grid"
        style={{
          maxWidth: '1200px',
          margin: 'auto',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >

        {/* Header */}
        <div className="col-span-full mb-8 flex flex-row items-center justify-between gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="lg"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md"
          >
            <Home className="w-5 h-5 mr-2" />
            Back
          </Button>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-wider drop-shadow-lg"
            style={{
              letterSpacing: '0.06em',
              textShadow: '0 2px 16px rgba(59,130,246,0.25), 0 1px 0 #000',
            }}
          >
            Checkers Arena
          </h1>
          <div className="w-16" /> {/* Spacer for symmetry */}
        </div>

        {/* Board column */}
        <div className="flex flex-col items-center w-full game-board-col" style={{ minWidth: 0 }}>
          {/* Mode header row (only for demo mode) */}
          {mode === 'demo' && (
            <div className="flex items-center justify-between mb-2 w-full">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 mr-4">
                <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md">
                  {['initial', 'midgame', 'endgame', 'another'].map(tab => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="data-[state=active]:bg-white data-[state=active]:text-slate-900 capitalize"
                    >
                      {tab === 'midgame' ? 'Mid Game'
                        : tab === 'endgame' ? 'End Game'
                        : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Button
                onClick={handleNewGame}
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold whitespace-nowrap"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : '▶ '}
                Play Game
              </Button>
            </div>
          )}
          {/* Turn indicator with glow (for play mode) */}
            {/* No separate turn indicator above the board; turn is shown in Game Status and highlighted in player card */}
          {/* API error banner */}
          {apiError && (
            <div className="mb-2 p-3 rounded-md bg-red-500/20 border border-red-400/40 text-red-200 text-sm text-center w-full">
              {apiError}
            </div>
          )}
          {/* Board */}
          <div className="flex justify-center w-full">
            {mode === 'demo' ? (
              <div className="w-full flex justify-center">
                {demoBoards[activeTab]}
              </div>
            ) : displayBoard ? (
              <div className="w-full flex justify-center">
                <div className="w-[clamp(420px,55vw,720px)] aspect-square">
                  <Board
                    pieces={displayBoard}
                    highlights={highlights}
                    selected={selected}
                    moveable={moveableSet}
                    lastMoveHighlights={lastMoveHighlights}
                    onSquareClick={handleSquareClick}
                  />
                </div>
              </div>
            ) : (
              <div className="w-[clamp(420px,55vw,720px)] aspect-square bg-black/30 rounded flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-white/50" />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full max-w-full flex flex-col gap-6 game-sidebar-col" style={{ minWidth: 0 }}>
          {/* Players card */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-md">
            <CardContent className="p-6 space-y-4">
              <div className={`flex items-center justify-between rounded-lg p-2 transition-colors ${mode === 'play' && !winner && currentPlayer === 'blue' ? 'bg-blue-500/20 ring-2 ring-blue-400/80 shadow-blue-400/40 shadow-lg' : ''}`}
                style={mode === 'play' && !winner && currentPlayer === 'blue' ? { boxShadow: '0 0 12px 2px #3b82f6, 0 0 0 4px #3b82f6' } : {}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Player 1</p>
                    <p className="text-white/60 text-sm">Blue Pieces</p>
                  </div>
                </div>
                <Badge className="bg-blue-500 hover:bg-blue-600 text-white">{pieceCounts.blue}</Badge>
              </div>

              <Separator className="bg-white/20" />

              <div className={`flex items-center justify-between rounded-lg p-2 transition-colors ${mode === 'play' && !winner && currentPlayer === 'red' ? 'bg-red-500/20 ring-2 ring-red-400/80 shadow-red-400/40 shadow-lg' : ''}`}
                style={mode === 'play' && !winner && currentPlayer === 'red' ? { boxShadow: '0 0 12px 2px #ef4444, 0 0 0 4px #ef4444' } : {}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Player 2</p>
                    <p className="text-white/60 text-sm">Red Pieces</p>
                  </div>
                </div>
                <Badge className="bg-red-500 hover:bg-red-600 text-white">{pieceCounts.red}</Badge>
              </div>
            </CardContent>
          </Card>

            {/* Game Status */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-white font-bold text-lg mb-4">Game Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Game Mode</span>
                    <span className="text-white font-semibold text-sm">Human vs Human</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Current Turn</span>
                    <span className={currentPlayer === 'blue' ? 'text-blue-300 font-semibold' : 'text-red-300 font-semibold'}>
                      {currentPlayer === 'blue' ? 'Blue' : 'Red'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Timer</span>
                    <span className="text-white font-semibold text-sm">{timerText}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Move Count</span>
                    <span className="text-white font-semibold">{moveCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Captures</span>
                    <span className="text-white font-semibold">{captures.blue} – {captures.red}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardContent className="p-6 space-y-3 flex flex-col">
                <Button
                  onClick={handleNewGame}
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                  size="lg"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  New Game
                </Button>
                <Button
                  onClick={() => {
                    if (history.length > 0) {
                      setShowLastMove(true);
                      setTimeout(() => setShowLastMove(false), 2500);
                    }
                  }}
                  variant={showLastMove ? 'default' : 'outline'}
                  className={showLastMove ? 'w-full bg-yellow-400 text-black font-semibold' : 'w-full text-white border-white/20 bg-white/10 hover:bg-white/20'}
                  disabled={!lastMove}
                  size="lg"
                >
                  Last Move
                </Button>
                <Button
                  onClick={() => setShowResignModal(true)}
                  disabled={loading || !!winner || mode !== 'play'}
                  className="w-full"
                  variant="outline"
                  size="lg"
                >
                  Resign
                </Button>
              </CardContent>
            </Card>
        {/* Resign Confirmation Modal */}
        {showResignModal && (
          <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50">
            <Card className="bg-slate-800 border-white/20 max-w-sm w-full mx-4">
              <CardContent className="p-8 text-center space-y-6">
                <h2 className="text-2xl font-extrabold text-white mb-2">Are you sure you want to resign?</h2>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => navigate(-1)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                    size="lg"
                  >
                    Exit Game
                  </Button>
                  <Button
                    onClick={() => { setShowResignModal(false); handleNewGame(); }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                    size="lg"
                  >
                    Start New Game
                  </Button>
                  <Button
                    onClick={() => setShowResignModal(false)}
                    className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold"
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

          </div>
        </div>

        {/* Info bar */}
        <Card className="mt-8 bg-white/10 border-white/20 backdrop-blur-md w-full col-span-full">
                {/* Responsive styles */}
                <style>{`
                  @media (max-width: 768px) {
                    .game-grid {
                      display: flex !important;
                      flex-direction: column !important;
                      gap: 20px !important;
                    }
                    .game-board-col, .game-sidebar-col {
                      width: 100% !important;
                      min-width: 0 !important;
                    }
                  }
                `}</style>
          <CardContent className="p-6">
            <p className="text-white/80 text-center text-sm">
              {mode === 'demo'
                ? 'DEMO MODE – Click a tab to preview board states. Click "▶ Play Game" to start a real match.'
                : 'PLAYING – Click a piece to select it, then click a highlighted square to move. Captures are mandatory. Multi-jumps complete in one turn. Use the Last Move button to highlight the previous move.'}
            </p>
          </CardContent>
        </Card>

        {winner && mode === 'play' && (
          <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50">
            <Card className="bg-slate-800 border-white/20 max-w-sm w-full mx-4">
              <CardContent className="p-8 text-center space-y-4">
                <div className="text-6xl">🏆</div>
                <h2 className="text-3xl font-extrabold text-white">
                  {winner === 'blue' ? 'Player 1 (Blue)' : 'Player 2 (Red)'} Wins!
                </h2>
                <p className="text-white/70">Game over – start a new match?</p>
                <Button
                  onClick={handleNewGame}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                  size="lg"
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