import { useEffect, useRef } from 'react';

const AURA_CLIP_PATH =
  'polygon(50% 0%, 59% 17%, 77% 8%, 71% 27%, 92% 31%, 76% 43%, 100% 50%, 76% 57%, 92% 69%, 71% 73%, 77% 92%, 59% 83%, 50% 100%, 41% 83%, 23% 92%, 29% 73%, 8% 69%, 24% 57%, 0% 50%, 24% 43%, 8% 31%, 29% 27%, 23% 8%, 41% 17%)';

const getAuraPalette = (pieceColor) => {
  if (pieceColor === 'blue') {
    return {
      base: 'rgba(96, 165, 250, 0.46)',
      edge: 'rgba(59, 130, 246, 0.92)',
      glow: 'rgba(59, 130, 246, 0.86)',
    };
  }

  return {
    base: 'rgba(248, 113, 113, 0.46)',
    edge: 'rgba(239, 68, 68, 0.92)',
    glow: 'rgba(239, 68, 68, 0.86)',
  };
};

const PreCaptureHintAura = ({ color }) => {
  const auraRef = useRef(null);
  const auraPalette = getAuraPalette(color);

  useEffect(() => {
    const auraEl = auraRef.current;
    if (!auraEl) return;

    const animation = auraEl.animate(
      [
        { transform: 'rotate(0deg) scale(1)' },
        { offset: 0.76, transform: 'rotate(760deg) scale(1.18)' },
        { transform: 'rotate(720deg) scale(1)' },
      ],
      {
        duration: 1150,
        iterations: Infinity,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    );

    return () => animation.cancel();
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div
        ref={auraRef}
        className="w-[84%] h-[84%]"
        style={{
          transformOrigin: '50% 50%',
          willChange: 'transform, opacity',
        }}
      >
        <div
          className="w-full h-full"
          style={{
            clipPath: AURA_CLIP_PATH,
            background: `radial-gradient(circle at 50% 50%, ${auraPalette.base} 0%, ${auraPalette.edge} 62%, rgba(255, 255, 255, 0.09) 100%)`,
            boxShadow: `0 0 10px ${auraPalette.glow}, 0 0 20px ${auraPalette.glow}, 0 0 30px ${auraPalette.glow}`,
            opacity: 0.92,
          }}
        />
      </div>
    </div>
  );
};

export default PreCaptureHintAura;
