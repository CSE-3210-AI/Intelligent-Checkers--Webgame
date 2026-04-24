import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Crown, ShieldCheck, Swords, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import Board from '../components/Board';

const emptyBoard = () => Array.from({ length: 8 }, () => Array(8).fill(null));

function buildBoard(placements) {
  const board = emptyBoard();
  for (const piece of placements) {
    board[piece.row][piece.col] = { color: piece.color, isKing: Boolean(piece.isKing) };
  }
  return board;
}

const guideSteps = [
  {
    id: 'movement',
    title: 'Diagonal Movement',
    icon: ArrowRight,
    summary: 'Regular pieces move diagonally forward one dark square.',
    board: buildBoard([
      { row: 2, col: 3, color: 'blue' },
      { row: 5, col: 4, color: 'red' },
    ]),
    selected: [2, 3],
    moveable: new Set(['2,3']),
    highlights: [[3, 2], [3, 4]],
    rules: [
      'Blue pieces move toward larger row numbers (down the board).',
      'Red pieces move toward smaller row numbers (up the board).',
      'Only dark squares are playable.',
    ],
  },
  {
    id: 'capture-priority',
    title: 'Captures Are Mandatory',
    icon: Target,
    summary: 'If any capture exists, non-capturing moves are not legal.',
    board: buildBoard([
      { row: 2, col: 3, color: 'blue' },
      { row: 3, col: 4, color: 'red' },
      { row: 5, col: 0, color: 'blue' },
      { row: 5, col: 6, color: 'blue' },
    ]),
    selected: [2, 3],
    moveable: new Set(['2,3']),
    highlights: [[4, 5]],
    lastMoveHighlights: [[3, 4]],
    rules: [
      'Your legal moves are generated with jump priority.',
      'Even if another piece can move normally, you must capture when possible.',
      'A capture jumps over exactly one adjacent opponent piece to an empty landing square.',
    ],
  },
  {
    id: 'multi-jump',
    title: 'Chain Jumps In One Turn',
    icon: Swords,
    summary: 'When another capture is available after a jump, continue jumping.',
    board: buildBoard([
      { row: 2, col: 1, color: 'blue' },
      { row: 3, col: 2, color: 'red' },
      { row: 5, col: 4, color: 'red' },
      { row: 7, col: 6, color: 'red' },
    ]),
    selected: [2, 1],
    moveable: new Set(['2,1']),
    highlights: [[4, 3]],
    lastMoveHighlights: [[4, 3], [6, 5]],
    rules: [
      'After the first jump, if a new jump exists for that same piece, the sequence continues.',
      'The engine treats the jump path as one legal move for the turn.',
      'Captured pieces are removed as the sequence is applied.',
    ],
  },
  {
    id: 'kinging',
    title: 'Promotion To King',
    icon: Crown,
    summary: 'Reach the far row to become a king and move in both directions.',
    board: buildBoard([
      { row: 6, col: 1, color: 'blue' },
      { row: 1, col: 6, color: 'red' },
      { row: 4, col: 3, color: 'blue', isKing: true },
    ]),
    selected: [6, 1],
    moveable: new Set(['6,1', '4,3']),
    highlights: [[7, 0], [7, 2]],
    rules: [
      'Blue promotes on row 7; red promotes on row 0.',
      'Kings can move and capture diagonally forward and backward.',
      'Promotion is applied by the game rules immediately after landing.',
    ],
  },
];

export default function HowToPlay() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [practiceAgent, setPracticeAgent] = useState('adiba');

  const step = useMemo(() => guideSteps[activeStep], [activeStep]);
  const StepIcon = step.icon;

  return (
    <div className="min-h-screen px-4 py-8 text-slate-100 md:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Badge className="bg-cyan-400/20 text-cyan-100 hover:bg-cyan-400/20">Official Rule Guide</Badge>
        </header>

        <section className="cyber-card mb-6 rounded-2xl border border-white/10 bg-slate-900/55 p-6 backdrop-blur-xl">
          <h1 className="cyber-heading text-3xl font-black tracking-tight text-white md:text-5xl">How To Play Checkers</h1>
          <p className="mt-3 max-w-3xl text-slate-200/90">
            This guide mirrors the exact rule behavior used by your game engine: diagonal movement, forced captures, chain jumps, and king promotion.
            All examples below use the same board renderer as live gameplay.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="space-y-3 lg:col-span-4">
            {guideSteps.map((item, idx) => {
              const Icon = item.icon;
              const isActive = idx === activeStep;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`cyber-card w-full rounded-xl border p-4 text-left transition ${
                    isActive
                      ? 'border-cyan-300/55 bg-cyan-400/15'
                      : 'border-white/10 bg-slate-900/45 hover:border-white/25 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-200' : 'text-slate-300'}`} />
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">{item.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-300/90">{item.summary}</p>
                </button>
              );
            })}
          </aside>

          <section className="space-y-6 lg:col-span-8">
            <Card className="rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl text-white">
                  <StepIcon className="h-5 w-5 text-cyan-200" />
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mx-auto w-full max-w-2xl">
                  <Board
                    pieces={step.board}
                    selected={step.selected}
                    moveable={step.moveable}
                    highlights={step.highlights}
                    lastMoveHighlights={step.lastMoveHighlights ?? []}
                  />
                </div>

                <div className="cyber-card rounded-xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="cyber-label mb-3 text-sm uppercase tracking-wide text-cyan-100/85">Rule Notes</p>
                  <ul className="space-y-2 text-sm text-slate-100/95">
                    {step.rules.map((line) => (
                      <li key={line}>- {line}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep((curr) => (curr === 0 ? guideSteps.length - 1 : curr - 1))}
                    className="border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
                  >
                    Previous Example
                  </Button>
                  <Button
                    onClick={() => setActiveStep((curr) => (curr + 1) % guideSteps.length)}
                    className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  >
                    Next Example
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10">
              <CardContent className="flex flex-col gap-4 p-5 text-sm text-cyan-100">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Turn resolution, legal moves, captures, and win detection are enforced server-side by the game engine.
                  </p>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-cyan-100/90">Practice Against</span>
                    <Button
                      type="button"
                      variant={practiceAgent === 'adiba' ? 'default' : 'outline'}
                      onClick={() => setPracticeAgent('adiba')}
                    >
                      Agent Adiba
                    </Button>
                    <Button
                      type="button"
                      variant={practiceAgent === 'megha' ? 'default' : 'outline'}
                      onClick={() => setPracticeAgent('megha')}
                    >
                      Agent Megha
                    </Button>
                  </div>
                  <Button
                    onClick={() => navigate(practiceAgent === 'megha' ? '/game?mode=agent-megha' : '/game?mode=agent-adiba')}
                  >
                    Start Practice Match
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
