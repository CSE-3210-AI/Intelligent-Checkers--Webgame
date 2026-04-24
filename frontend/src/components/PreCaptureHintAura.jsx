import { useEffect, useRef } from 'react';

const AURA_CLIP_PATH =
  'polygon(50% 0%, 59% 17%, 77% 8%, 71% 27%, 92% 31%, 76% 43%, 100% 50%, 76% 57%, 92% 69%, 71% 73%, 77% 92%, 59% 83%, 50% 100%, 41% 83%, 23% 92%, 29% 73%, 8% 69%, 24% 57%, 0% 50%, 24% 43%, 8% 31%, 29% 27%, 23% 8%, 41% 17%)';

const getAuraPalette = (pieceColor) => {
  if (pieceColor === 'blue') {
    return {
      base: 'rgba(86, 225, 255, 0.48)',
      edge: 'rgba(0, 190, 255, 0.92)',
      glow: 'rgba(0, 190, 255, 0.84)',
      ring: 'rgba(167, 246, 255, 0.72)',
    };
  }

  return {
    base: 'rgba(255, 121, 205, 0.48)',
    edge: 'rgba(255, 58, 142, 0.92)',
    glow: 'rgba(255, 58, 142, 0.84)',
    ring: 'rgba(255, 203, 234, 0.74)',
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
        className="cp-precapture-hint-rotor w-[84%] h-[84%]"
        style={{
          transformOrigin: '50% 50%',
          willChange: 'transform, opacity',
        }}
      >
        <div
          className="cp-precapture-hint-layer cp-precapture-hint-main w-full h-full"
          style={{
            clipPath: AURA_CLIP_PATH,
            background: `radial-gradient(circle at 50% 50%, ${auraPalette.base} 0%, ${auraPalette.edge} 62%, rgba(255, 255, 255, 0.09) 100%)`,
            boxShadow: `0 0 8px ${auraPalette.glow}, 0 0 18px ${auraPalette.glow}, 0 0 28px ${auraPalette.glow}`,
            opacity: 0.92,
          }}
        />
        <div
          className="cp-precapture-hint-layer cp-precapture-hint-trail absolute inset-0"
          style={{
            clipPath: AURA_CLIP_PATH,
            background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 30%, ${auraPalette.base} 80%, rgba(255,255,255,0) 100%)`,
            opacity: 0.55,
          }}
        />
        <div
          className="cp-precapture-hint-ring absolute inset-[12%] rounded-full"
          style={{
            border: `1px solid ${auraPalette.ring}`,
            boxShadow: `0 0 10px ${auraPalette.glow}`,
          }}
        />
      </div>
    </div>
  );
};

export default PreCaptureHintAura;
