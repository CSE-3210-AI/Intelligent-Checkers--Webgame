import { Button } from '@/components/ui/button';

export default function MeetAgents() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <h1 className="cyber-heading text-4xl md:text-5xl font-extrabold text-center mb-10 bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
        Meet the Agents
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
        {/* Agent Megha */}
        <div className="cyber-card bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border-2 border-blue-200">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">M</span>
          </div>
          <h2 className="cyber-heading text-2xl font-bold mb-2 text-blue-800">Agent Megha</h2>
          <div className="mb-2">
            <span className="cyber-label font-semibold text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full">Minimax + Alpha-Beta Pruning</span>
          </div>
          <h3 className="cyber-heading font-semibold text-slate-700 mb-1 mt-4">Strategy Overview</h3>
          <p className="text-slate-600 text-center text-base">
            Uses a planning-based approach to evaluate future board states, efficiently pruning suboptimal moves. Excels at deep tactical foresight and optimal decision making under deterministic conditions.
          </p>
        </div>
        {/* Agent Adiba */}
        <div className="cyber-card bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border-2 border-slate-400">
          <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <h2 className="cyber-heading text-2xl font-bold mb-2 text-slate-800">Agent Adiba</h2>
          <div className="mb-2">
            <span className="cyber-label font-semibold text-sm px-3 py-1 bg-slate-200 text-slate-800 rounded-full">Monte Carlo Simulation + Fuzzy Logic</span>
          </div>
          <h3 className="cyber-heading font-semibold text-slate-700 mb-1 mt-4">Strategy Overview</h3>
          <p className="text-slate-600 text-center text-base">
            Leverages probabilistic simulations and fuzzy logic to explore a wide range of possible outcomes, adapting dynamically to uncertainty and non-deterministic scenarios.
          </p>
        </div>
      </div>
      <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-10 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
        Start Match
      </Button>
    </div>
  );
}
