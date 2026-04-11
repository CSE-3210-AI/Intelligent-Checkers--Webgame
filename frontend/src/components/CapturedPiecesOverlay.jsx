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
    (captureAnimationPayload.pieces ?? [])
      .filter(piece => piece?.color)
      .forEach((piece, pieceIndex) => {
        const startX = (piece.col + 0.5) * cellWidth;
        const startY = (piece.row + 0.5) * cellHeight;
        const fragmentCount = randomIntBetween(18, 24);

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
      });

    if (!generatedFragments.length) {
      finishOnce('capture-complete');
      return;
    }

    setFragments(generatedFragments);

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

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[72]"
      style={showDebug ? { outline: '1px dashed rgba(250, 204, 21, 0.65)' } : undefined}
    >
      {fragments.map((fragment) => {
        const translateX = fragment.dx * eased;
        const translateY = fragment.dy * eased;
        const rotate = fragment.rotation * eased;
        const scale = 1 - 0.5 * eased;
        const opacity = 1 - eased;
        const transform = `translate3d(${translateX - fragment.size / 2}px, ${translateY - fragment.size / 2}px, 0) rotate(${rotate}deg) scale(${scale})`;

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
              boxShadow: '0 0 8px currentColor',
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