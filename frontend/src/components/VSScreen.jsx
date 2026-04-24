import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import AgentPortrait from './AgentPortrait';

const AGENT_META = {
  megha: {
    displayName: 'MEGHA',
    algorithm: 'Minimax + Alpha-Beta',
    profile: { name: 'Agent Megha', agentKey: 'megha', type: 'internal_ai' },
  },
  adiba: {
    displayName: 'ADIBA',
    algorithm: 'Fuzzy + MCTS',
    profile: { name: 'Agent Adiba', agentKey: 'adiba', type: 'adiba' },
  },
};

const HUMAN_PROFILE = { name: 'Human', type: 'human' };
const ONLINE_PROFILE = { name: 'Online Opponent', agentKey: 'external', type: 'external_ai' };

function AgentSelectButton({ agentKey, side, selected, hasSelection, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(agentKey)}
      className={`vs-agent-select vs-agent-select--${side} ${selected ? 'is-selected' : ''} ${hasSelection && !selected ? 'is-dimmed' : ''}`}
    >
      <AgentPortrait
        profile={AGENT_META[agentKey].profile}
        side={side}
        size="lg"
        interactive
      />
      <span className="vs-agent-name cyber-heading">{AGENT_META[agentKey].displayName}</span>
      <span className="vs-agent-algo">{AGENT_META[agentKey].algorithm}</span>
    </button>
  );
}

function PlayerStageCard({ side, profile, name, algorithm }) {
  return (
    <div className={`vs-player-card vs-player-card--${side}`}>
      <AgentPortrait profile={profile} side={side} size="hero" />
      <p className={`cyber-heading mt-3 text-sm tracking-[0.2em] ${side === 'blue' ? 'text-blue-100' : 'text-rose-100'}`}>
        {name}
      </p>
      {algorithm ? <p className="vs-algo-label">{algorithm}</p> : null}
    </div>
  );
}

export default function VSScreen({
  mode = 'internal',
  onClose,
  onStart,
  initialAgent = 'adiba',
}) {
  const [selectedAgent, setSelectedAgent] = useState(
    mode === 'human' || mode === 'online' ? (initialAgent ?? null) : initialAgent
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const screenCopy = useMemo(() => {
    if (mode === 'online') {
      return {
        heading: 'ONLINE BENCHMARK',
        subHeading: 'SELECT YOUR AGENT',
        actionLabel: 'START MATCH',
      };
    }

    if (mode === 'human') {
      const rivalName = selectedAgent ? AGENT_META[selectedAgent].displayName : null;
      return {
        heading: 'HUMAN VS AGENT',
        subHeading: rivalName ? `HUMAN vs ${rivalName}` : 'SELECT OPPONENT',
        actionLabel: 'START MATCH',
      };
    }

    return {
      heading: 'AI BATTLE',
      subHeading: 'MEGHA vs ADIBA',
      actionLabel: 'START MATCH',
    };
  }, [mode, selectedAgent]);

  const handleStart = async () => {
    if (isSubmitting) return;
    if ((mode === 'human' || mode === 'online') && !selectedAgent) return;

    setIsSubmitting(true);
    try {
      await onStart?.(selectedAgent);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onlineInternalName = selectedAgent ? AGENT_META[selectedAgent].displayName : 'INTERNAL';
  const onlineInternalProfile = selectedAgent ? AGENT_META[selectedAgent].profile : { name: 'Select Agent', type: 'external_ai' };
  const onlineInternalAlgorithm = selectedAgent ? AGENT_META[selectedAgent].algorithm : null;

  const humanOpponentName = selectedAgent ? AGENT_META[selectedAgent].displayName : 'OPPONENT';
  const humanOpponentProfile = selectedAgent ? AGENT_META[selectedAgent].profile : { name: 'Select Opponent', type: 'external_ai' };
  const humanOpponentAlgorithm = selectedAgent ? AGENT_META[selectedAgent].algorithm : null;

  return (
    <div className="vs-overlay" role="dialog" aria-modal="true" aria-label={screenCopy.heading}>
      <button
        type="button"
        aria-label="Go back"
        className="CyberButton CyberButton--secondary absolute left-4 top-4 z-30 flex h-11 items-center gap-1 text-blue-100 hover:text-blue-50 text-sm sm:left-8 sm:top-8"
        onClick={onClose}
        disabled={isSubmitting}
      >
        Back
      </button>

      <div className="vs-card">
        <p className="vs-heading cyber-heading text-center text-2xl sm:text-3xl md:text-5xl tracking-[0.14em] sm:tracking-[0.2em] text-cyan-100">
          {screenCopy.heading}
        </p>
        <p className="vs-subheading cyber-heading mt-2 sm:mt-3 text-center text-sm sm:text-base md:text-xl tracking-[0.1em] sm:tracking-[0.16em] text-slate-200">
          {screenCopy.subHeading}
        </p>

        {mode === 'internal' && (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3 md:items-center">
            <div className="vs-player vs-player--left">
              <PlayerStageCard
                side="blue"
                profile={AGENT_META.megha.profile}
                name={AGENT_META.megha.displayName}
                algorithm={AGENT_META.megha.algorithm}
              />
            </div>
            <div className="vs-text cyber-heading mx-auto text-xl tracking-[0.35em] text-cyan-100">VS</div>
            <div className="vs-player vs-player--right">
              <PlayerStageCard
                side="red"
                profile={AGENT_META.adiba.profile}
                name={AGENT_META.adiba.displayName}
                algorithm={AGENT_META.adiba.algorithm}
              />
            </div>
          </div>
        )}

        {mode === 'human' && (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3 md:items-center">
            <div className="vs-player vs-player--left">
              <PlayerStageCard side="blue" profile={HUMAN_PROFILE} name="HUMAN" />
            </div>
            <div className="vs-text cyber-heading mx-auto text-xl tracking-[0.35em] text-cyan-100">VS</div>
            <div className="vs-player vs-player--right">
              <PlayerStageCard
                side="red"
                profile={humanOpponentProfile}
                name={humanOpponentName}
                algorithm={humanOpponentAlgorithm}
              />
            </div>
          </div>
        )}

        {mode === 'online' && (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3 md:items-center">
            <div className="vs-player vs-player--left">
              <PlayerStageCard
                side="blue"
                profile={onlineInternalProfile}
                name={onlineInternalName}
                algorithm={onlineInternalAlgorithm}
              />
            </div>
            <div className="vs-text cyber-heading mx-auto text-xl tracking-[0.35em] text-cyan-100">VS</div>
            <div className="vs-player vs-player--right">
              <PlayerStageCard
                side="red"
                profile={ONLINE_PROFILE}
                name="ONLINE"
                algorithm="External Benchmark"
              />
            </div>
          </div>
        )}

        {(mode === 'human' || mode === 'online') && (
          <div className="vs-selection-grid mt-7">
            <AgentSelectButton
              agentKey="megha"
              side="blue"
              selected={selectedAgent === 'megha'}
              hasSelection={Boolean(selectedAgent)}
              onSelect={setSelectedAgent}
            />
            <AgentSelectButton
              agentKey="adiba"
              side="red"
              selected={selectedAgent === 'adiba'}
              hasSelection={Boolean(selectedAgent)}
              onSelect={setSelectedAgent}
            />
          </div>
        )}

        {(mode === 'internal' || selectedAgent) && (
          <div className="mt-10 flex justify-center">
            <Button
              size="lg"
              onClick={handleStart}
              disabled={isSubmitting}
              className="app-action-button CyberButton CyberButton--primary"
            >
              {isSubmitting ? 'LOADING...' : screenCopy.actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
