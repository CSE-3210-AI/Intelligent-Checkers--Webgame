import { useEffect, useRef, useState } from 'react';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const SHATTER_DURATION_MS = 300;

const randomBetween = (min, max) => Math.random() * (max - min) + min;
const randomIntBetween = (min, max) => Math.floor(randomBetween(min, max + 1));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getFragmentColor = (pieceColor, index) => {
  const bluePalette = ['#60a5fa', '#3b82f6', '#1d4ed8'];
  const redPalette = ['#f87171', '#ef4444', '#b91c1c'];
  const palette = pieceColor === 'blue' ? bluePalette : redPalette;
  return palette[index % palette.length];
};

/**
 * CapturedPiecesOverlay (Shatter)
 * - Builds multiple fragments per captured piece.
 * - Animates fragments with requestAnimationFrame over time.
 * - Calls onAnimationComplete(animationId, reason) once.
 */
const CapturedPiecesOverlay = ({
  captureAnimationPayload,
  boardRef,
  onAnimationComplete,
  showDebug = false,
}) => {
  const rafRef = useRef(null);
  const completedRef = useRef(false);
  const progressLogBucketRef = useRef(-1);
  const [frameProgress, setFrameProgress] = useState(0);
  const [fragments, setFragments] = useState([]);
  const [particles, setParticles] = useState([]);
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    completedRef.current = false;
    progressLogBucketRef.current = -1;
    setFrameProgress(0);

    if (!captureAnimationPayload) {
      setFragments([]);
      setParticles([]);
      setBursts([]);
      return;
    }

    const finishOnce = (reason) => {
      if (completedRef.current) return;
      completedRef.current = true;
      onAnimationComplete?.(captureAnimationPayload.animationId, reason);
    };

    const boardEl = boardRef?.current;
    if (!boardEl) {
      finishOnce('capture-no-board-ref');
      return;
    }

    const rect = boardEl.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      finishOnce('capture-invalid-board-size');
      return;
    }

    const duration = SHATTER_DURATION_MS;
    const cellWidth = rect.width / 8;
    const cellHeight = rect.height / 8;

    const generatedFragments = [];
    const generatedParticles = [];
    const generatedBursts = [];

    (captureAnimationPayload.pieces ?? [])
      .filter(piece => piece?.color)
      .forEach((piece, pieceIndex) => {
        const startX = (piece.col + 0.5) * cellWidth;
        const startY = (piece.row + 0.5) * cellHeight;
        const fragmentCount = randomIntBetween(18, 24);
        const particleCount = randomIntBetween(10, 14);

        generatedBursts.push({
          id: `burst-${captureAnimationPayload.animationId}-${piece.row}-${piece.col}`,
          startX,
          startY,
          color: piece.color === 'blue' ? '#22d3ee' : '#fb7185',
        });

        for (let i = 0; i < fragmentCount; i += 1) {
          // Per-fragment jitter helps avoid visual clustering while keeping randomness.
          const indexSpread = (i - (fragmentCount - 1) / 2) * 2.8;
          const dx = clamp(randomBetween(-80, 80) + indexSpread, -80, 80);
          const dy = clamp(randomBetween(-90, 50) - indexSpread * 0.7, -90, 50);
          const rotation = (randomBetween(0, 360) + i * (360 / fragmentCount)) % 360;
          const size = clamp(randomBetween(8, 16) + (i % 3) * 0.18, 8, 16);

          generatedFragments.push({
            id: `${captureAnimationPayload.animationId}-${piece.row}-${piece.col}-${i}`,
            startX,
            startY,
            dx,
            dy,
            rotation,
            size,
            color: getFragmentColor(piece.color, pieceIndex + i),
            borderRadius: Math.random() < 0.6 ? '9999px' : '10%',
          });
        }

        for (let i = 0; i < particleCount; i += 1) {
          const angle = (i / particleCount) * Math.PI * 2 + randomBetween(-0.25, 0.25);
          const speed = randomBetween(38, 94);
          generatedParticles.push({
            id: `particle-${captureAnimationPayload.animationId}-${piece.row}-${piece.col}-${i}`,
            startX,
            startY,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            size: randomBetween(2, 5),
            color: getFragmentColor(piece.color, pieceIndex + i + fragmentCount),
          });
        }
      });

    if (!generatedFragments.length) {
      finishOnce('capture-complete');
      return;
    }

    setFragments(generatedFragments);
    setParticles(generatedParticles);
    setBursts(generatedBursts);

    console.log('shatter start', {
      animationId: captureAnimationPayload.animationId,
      fragmentCount: generatedFragments.length,
      duration,
    });

    const startedAt = performance.now();

    const tick = (now) => {
      const elapsed = now - startedAt;
      const linear = Math.min(elapsed / duration, 1);
      setFrameProgress(linear);

      const bucket = Math.floor(linear * 10);
      if (bucket !== progressLogBucketRef.current) {
        progressLogBucketRef.current = bucket;
        console.log(
          `[capture-overlay] id=${captureAnimationPayload.animationId} progress=${linear.toFixed(2)} eased=${easeOut(linear).toFixed(2)}`
        );
      }

      if (linear < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      console.log(`[capture-overlay] end id=${captureAnimationPayload.animationId}`);
      finishOnce('capture-complete');
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [boardRef, captureAnimationPayload, onAnimationComplete]);

  if (!captureAnimationPayload || !fragments.length) {
    return null;
  }

  const eased = easeOut(frameProgress);
  const flashBoost = Math.max(0, 1 - frameProgress / 0.25);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[72]"
      style={showDebug ? { outline: '1px dashed rgba(250, 204, 21, 0.65)' } : undefined}
    >
      {bursts.map((burst) => {
        const burstSize = 34;
        const scale = 0.45 + eased * 1.75;
        const opacity = Math.max(0, 0.85 - eased * 1.1);
        return (
          <div
            key={burst.id}
            className="cp-capture-burst absolute rounded-full pointer-events-none"
            style={{
              width: `${burstSize}px`,
              height: `${burstSize}px`,
              left: `${burst.startX - burstSize / 2}px`,
              top: `${burst.startY - burstSize / 2}px`,
              opacity,
              transform: `scale(${scale})`,
              background: `radial-gradient(circle, ${burst.color} 0%, rgba(255,255,255,0.25) 38%, rgba(255,255,255,0) 100%)`,
            }}
          />
        );
      })}

      {particles.map((particle) => {
        const translateX = particle.dx * eased;
        const translateY = particle.dy * eased;
        const scale = 1 - 0.52 * eased;
        const opacity = Math.max(0, 0.95 - eased * 1.04);

        return (
          <div
            key={particle.id}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: `${particle.startX - particle.size / 2}px`,
              top: `${particle.startY - particle.size / 2}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity,
              transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
              boxShadow: `0 0 ${4 + flashBoost * 6}px ${particle.color}`,
              willChange: 'transform, opacity',
            }}
          />
        );
      })}

      {fragments.map((fragment) => {
        const translateX = fragment.dx * eased;
        const translateY = fragment.dy * eased;
        const rotate = fragment.rotation * eased;
        const scale = 1 - 0.5 * eased;
        const opacity = 1 - eased;
        const transform = `translate3d(${translateX - fragment.size / 2}px, ${translateY - fragment.size / 2}px, 0) rotate(${rotate}deg) scale(${scale})`;
        const glowRadius = 8 + flashBoost * 12;

        return (
          <div
            key={fragment.id}
            className="absolute pointer-events-none"
            style={{
              left: `${fragment.startX}px`,
              top: `${fragment.startY}px`,
              width: `${fragment.size}px`,
              height: `${fragment.size}px`,
              color: fragment.color,
              backgroundColor: fragment.color,
              borderRadius: fragment.borderRadius,
              opacity,
              transform,
              boxShadow: `0 0 ${glowRadius}px currentColor`,
              willChange: 'transform, opacity',
              border: showDebug ? '1px solid rgba(250, 204, 21, 0.85)' : 'none',
            }}
          >
            {showDebug && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(250, 204, 21, 0.25)',
                  borderRadius: '9999px',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CapturedPiecesOverlay;
