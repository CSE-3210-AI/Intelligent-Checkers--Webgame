import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Swords, Brain } from 'lucide-react';
import AgentPortrait from '../components/AgentPortrait';
import VSScreen from '../components/VSScreen';

export default function TournamentModeSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vs = searchParams.get('vs');

  const vsConfig = useMemo(() => {
    if (vs === 'internal') return { mode: 'internal', initialAgent: 'adiba' };
    if (vs === 'online') return { mode: 'online', initialAgent: null };
    if (vs === 'human') return { mode: 'human', initialAgent: null };
    if (vs === 'human-megha') return { mode: 'human', initialAgent: 'megha' };
    if (vs === 'human-adiba') return { mode: 'human', initialAgent: 'adiba' };
    return null;
  }, [vs]);

  const openVs = (nextVs) => {
    navigate({
      pathname: '/tournaments',
      search: `?vs=${nextVs}`,
    });
  };

  const closeVs = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }
    navigate('/tournaments', { replace: true });
  };

  const handleVsStart = (selectedAgent) => {
    if (!vsConfig) return;

    if (vsConfig.mode === 'internal') {
      navigate('/game?mode=internal-tournament');
      return;
    }

    if (vsConfig.mode === 'online') {
      navigate(`/game?mode=online-benchmark&internalAgent=${selectedAgent}`);
      return;
    }

    const humanRoute = selectedAgent === 'megha' ? '/game?mode=agent-megha' : '/game?mode=agent-adiba';
    navigate(humanRoute);
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-10 text-slate-100 sm:py-12">
      <button
        type="button"
        aria-label="Go back"
        className="CyberButton CyberButton--secondary absolute left-4 top-4 flex h-11 items-center gap-1 text-blue-200 hover:text-blue-100 font-medium text-sm z-10 sm:left-8 sm:top-8"
        onClick={() => navigate(-1)}
      >
        Back
      </button>
      <h1 className="cyber-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-8 sm:mb-10 bg-linear-to-r from-blue-100 via-cyan-200 to-blue-100 bg-clip-text text-transparent">
        Tournament Mode Selection
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8 w-full max-w-7xl mb-8 sm:mb-12">

        {/* Human vs Human */}
        <Card
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-cyan-300/35 bg-slate-900/55 backdrop-blur-xl hover:border-cyan-300/65"
          onClick={() => navigate('/game?autostart=true')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Swords className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-slate-100">Human vs Human</CardTitle>
            <CardDescription className="text-base mt-2 text-slate-300">
              Play a live match against another person on the same device. Full rules, undo, resign, and win detection included.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="secondary" className="text-xs border border-white/20 bg-white/10 text-slate-100 hover:bg-white/20">Local Multiplayer</Button>
              <Button variant="secondary" className="text-xs border border-white/20 bg-white/10 text-slate-100 hover:bg-white/20">Full Rules</Button>
            </div>
          </CardContent>
        </Card>

        {/* Internal AI Tournament */}
        <Card
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-blue-300/35 bg-slate-900/55 backdrop-blur-xl hover:border-blue-300/65"
          onClick={() => openVs('internal')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex items-center gap-3">
              <AgentPortrait profile={{ name: 'Agent Megha', agentKey: 'megha', type: 'internal_ai' }} side="blue" size="md" />
              <div className="rounded-full border border-cyan-300/25 bg-slate-950/80 px-2 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-100">
                VS
              </div>
              <AgentPortrait profile={{ name: 'Agent Adiba', agentKey: 'adiba', type: 'adiba' }} side="red" size="md" />
            </div>
            <CardTitle className="text-2xl text-slate-100">Internal AI Tournament</CardTitle>
            <CardDescription className="text-base mt-2 text-slate-300">
              Benchmark our in-house AI agents against each other for algorithmic comparison and research evaluation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="secondary" className="text-xs border border-white/20 bg-white/10 text-slate-100 hover:bg-white/20">Algorithm Comparison</Button>
              <Button variant="secondary" className="text-xs border border-white/20 bg-white/10 text-slate-100 hover:bg-white/20">Research Evaluation</Button>
            </div>
          </CardContent>
        </Card>

        {/* Online Benchmark Tournament */}
        <Card
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-300/35 bg-slate-900/55 backdrop-blur-xl hover:border-slate-300/65"
          onClick={() => openVs('online')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex items-center gap-3">
              <AgentPortrait profile={{ name: 'Agent Megha', agentKey: 'megha', type: 'internal_ai' }} side="blue" size="sm" />
              <AgentPortrait profile={{ name: 'Agent Adiba', agentKey: 'adiba', type: 'adiba' }} side="red" size="sm" />
              <div className="ml-1 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 p-3 shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-slate-100">Online Benchmark Tournament</CardTitle>
            <CardDescription className="text-base mt-2 text-slate-300">
              Compete with a selected internal AI agent against an external AI from public repositories for cross-system benchmarking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="secondary" className="text-xs border border-white/20 bg-white/10 text-slate-100 hover:bg-white/20">External AI</Button>
              <Button variant="secondary" className="text-xs border border-white/20 bg-white/10 text-slate-100 hover:bg-white/20">Cross-Benchmark</Button>
            </div>
          </CardContent>
        </Card>

        {/* Human vs Agent */}
        <Card
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-cyan-300/35 bg-slate-900/55 backdrop-blur-xl hover:border-cyan-300/65"
          onClick={() => openVs('human')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex items-center justify-center gap-3">
              <AgentPortrait profile={{ name: 'Agent Megha', agentKey: 'megha', type: 'internal_ai' }} side="blue" size="lg" />
              <AgentPortrait profile={{ name: 'Agent Adiba', agentKey: 'adiba', type: 'adiba' }} side="red" size="lg" />
              <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-slate-100">Human vs Agent</CardTitle>
            <CardDescription className="text-base mt-2 text-slate-300">
              Challenge one of our internal agents and choose your opponent before entering the match.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="secondary" className="text-xs border border-white/20 bg-white/10 text-slate-100 hover:bg-white/20">Alpha-Beta</Button>
              <Button variant="secondary" className="text-xs border border-white/20 bg-white/10 text-slate-100 hover:bg-white/20">MCTS + Fuzzy</Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {vsConfig && (
        <VSScreen
          mode={vsConfig.mode}
          initialAgent={vsConfig.initialAgent}
          onClose={closeVs}
          onStart={handleVsStart}
        />
      )}
    </div>
  );
}
