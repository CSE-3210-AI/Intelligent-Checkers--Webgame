import { Bot, Cpu, Users } from 'lucide-react';

import adibaPortrait from '../../../ai_images/adiba.webp';
import meghaPortrait from '../../../ai_images/agent_megha.webp';

const AGENT_VISUALS = {
  megha: {
    src: meghaPortrait,
    alt: 'Agent Megha portrait',
    tone: 'megha',
  },
  adiba: {
    src: adibaPortrait,
    alt: 'Agent Adiba portrait',
    tone: 'adiba',
  },
};

const SIZE_CLASS = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
  xl: 'h-28 w-28',
  hero: 'h-32 w-32 sm:h-36 sm:w-36',
};

function getAgentVisual(profile = {}) {
  const normalizedName = String(profile.name ?? '').toLowerCase();
  const key =
    profile.agentKey ??
    (normalizedName.includes('megha') ? 'megha' : normalizedName.includes('adiba') ? 'adiba' : null);

  if (key && AGENT_VISUALS[key]) {
    return {
      ...AGENT_VISUALS[key],
      key,
      isAgentPortrait: true,
    };
  }

  if (profile.type === 'human') {
    return {
      alt: `${profile.name ?? 'Human player'} avatar`,
      tone: profile.side === 'red' ? 'adiba' : 'neutral',
      Icon: Users,
      isAgentPortrait: false,
    };
  }

  if (profile.type === 'external_ai') {
    return {
      alt: `${profile.name ?? 'External agent'} avatar`,
      tone: 'neutral',
      Icon: Cpu,
      isAgentPortrait: false,
    };
  }

  return {
    alt: `${profile.name ?? 'Agent'} avatar`,
    tone: profile.side === 'red' ? 'adiba' : 'neutral',
    Icon: Bot,
    isAgentPortrait: false,
  };
}

export default function AgentPortrait({
  profile,
  side,
  size = 'md',
  className = '',
  loading = 'lazy',
  interactive = false,
}) {
  const visual = getAgentVisual({ ...profile, side });
  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS.md;
  const wrapperClass = [
    'agent-portrait',
    `agent-portrait--${visual.tone}`,
    interactive ? 'agent-portrait--interactive' : '',
    sizeClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass} aria-hidden="true">
      <div className="agent-portrait__core">
        {visual.isAgentPortrait ? (
          <img
            src={visual.src}
            alt={visual.alt}
            loading={loading}
            decoding="async"
            className="agent-portrait__image"
          />
        ) : (
          <div className="agent-portrait__fallback">
            <visual.Icon className="h-[46%] w-[46%]" />
          </div>
        )}
      </div>
    </div>
  );
}
