import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AgentPortrait from '../components/AgentPortrait';
import { AGENT_CARD_COPY } from '../lib/agentCards';

export default function TournamentInternal() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12">
      <button
        type="button"
        aria-label="Go back"
        className="CyberButton CyberButton--secondary absolute left-8 top-8 flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm z-10"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="cyber-heading text-4xl md:text-5xl font-extrabold text-center mb-10 bg-linear-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
        Internal AI Tournament
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
        {/* Agent Megha */}
        <div className="cyber-card cyber-agent-card cyber-agent-card--megha rounded-xl p-8 flex flex-col items-center border-2">
          <AgentPortrait profile={{ ...AGENT_CARD_COPY.megha, agentKey: 'megha', type: 'internal_ai' }} side="blue" size="xl" className="mb-4" />
          <h2 className="cyber-heading text-2xl font-bold mb-2 text-blue-100">{AGENT_CARD_COPY.megha.name}</h2>
          <div className="mb-2">
            <span className="cyber-label font-semibold text-sm px-3 py-1 rounded-full">{AGENT_CARD_COPY.megha.badge}</span>
          </div>
          <h3 className="cyber-heading font-semibold text-slate-100 mb-1 mt-4">Strategy Overview</h3>
          <p className="text-slate-300 text-center text-base">{AGENT_CARD_COPY.megha.summary}</p>
        </div>
        {/* Agent Adiba */}
        <div className="cyber-card cyber-agent-card cyber-agent-card--adiba rounded-xl p-8 flex flex-col items-center border-2">
          <AgentPortrait profile={{ ...AGENT_CARD_COPY.adiba, agentKey: 'adiba', type: 'adiba' }} side="red" size="xl" className="mb-4" />
          <h2 className="cyber-heading text-2xl font-bold mb-2 text-rose-100">{AGENT_CARD_COPY.adiba.name}</h2>
          <div className="mb-2">
            <span className="cyber-label font-semibold text-sm px-3 py-1 rounded-full">{AGENT_CARD_COPY.adiba.badge}</span>
          </div>
          <h3 className="cyber-heading font-semibold text-slate-100 mb-1 mt-4">Strategy Overview</h3>
          <p className="text-slate-300 text-center text-base">{AGENT_CARD_COPY.adiba.summary}</p>
        </div>
      </div>
      <Button
        size="lg"
        onClick={() => navigate('/game?mode=internal-tournament')}
        className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-10 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
      >
        Start Match
      </Button>
    </div>
  );
}
