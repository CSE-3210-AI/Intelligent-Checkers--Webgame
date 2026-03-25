import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Bot, ArrowLeft, Swords, Brain } from 'lucide-react';

export default function TournamentModeSelection() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-slate-100 to-blue-100 px-4 py-12 relative">
      <button
        type="button"
        aria-label="Go back"
        className="absolute left-8 top-8 flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm z-10"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-10 bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
        Tournament Mode Selection
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl mb-12">

        {/* Human vs Human */}
        <Card
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-emerald-300 hover:border-emerald-500"
          onClick={() => navigate('/game?autostart=true')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Swords className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Human vs Human</CardTitle>
            <CardDescription className="text-base mt-2">
              Play a live match against another person on the same device. Full rules, undo, resign, and win detection included.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="secondary" className="text-xs">Local Multiplayer</Button>
              <Button variant="secondary" className="text-xs">Full Rules</Button>
            </div>
          </CardContent>
        </Card>

        {/* Internal AI Tournament */}
        <Card
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-blue-200 hover:border-blue-400"
          onClick={() => navigate('/tournament/internal')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Internal AI Tournament</CardTitle>
            <CardDescription className="text-base mt-2">
              Benchmark our in-house AI agents against each other for algorithmic comparison and research evaluation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="secondary" className="text-xs">Algorithm Comparison</Button>
              <Button variant="secondary" className="text-xs">Research Evaluation</Button>
            </div>
          </CardContent>
        </Card>

        {/* Online Benchmark Tournament */}
        <Card
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-400 hover:border-slate-600"
          onClick={() => navigate('/tournament/online')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Online Benchmark Tournament</CardTitle>
            <CardDescription className="text-base mt-2">
              Compete with a selected internal AI agent against an external AI from public repositories for cross-system benchmarking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="secondary" className="text-xs">External AI</Button>
              <Button variant="secondary" className="text-xs">Cross-Benchmark</Button>
            </div>
          </CardContent>
        </Card>

        {/* Human vs Agent Adiba */}
        <Card
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-purple-300 hover:border-purple-500"
          onClick={() => navigate('/game?mode=agent-adiba')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Human vs Agent Adiba</CardTitle>
            <CardDescription className="text-base mt-2">
              Play against Agent Adiba, our adaptive AI powered by Monte Carlo Tree Search and Fuzzy Logic. The AI will explain its strategy and reasoning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="secondary" className="text-xs">MCTS + Fuzzy</Button>
              <Button variant="secondary" className="text-xs">Explainable AI</Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
