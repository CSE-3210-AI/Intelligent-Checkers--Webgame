import { useEffect, useRef, useState } from 'react';
import Piece from './Piece';

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

const AURA_CLIP_PATH =
  'polygon(50% 0%, 59% 17%, 77% 8%, 71% 27%, 92% 31%, 76% 43%, 100% 50%, 76% 57%, 92% 69%, 71% 73%, 77% 92%, 59% 83%, 50% 100%, 41% 83%, 23% 92%, 29% 73%, 8% 69%, 24% 57%, 0% 50%, 24% 43%, 8% 31%, 29% 27%, 23% 8%, 41% 17%)';

const getAuraPalette = (pieceColor) => {
  if (pieceColor === 'blue') {
    return {
      base: 'rgba(96, 165, 250, 0.58)',
      edge: 'rgba(59, 130, 246, 0.95)',
      glow: 'rgba(59, 130, 246, 0.90)',
    };
  }

  return {
    base: 'rgba(248, 113, 113, 0.58)',
    edge: 'rgba(239, 68, 68, 0.95)',
    glow: 'rgba(239, 68, 68, 0.90)',
  };
};

const getRotationDeg = (progress) => {
  const overshootPhase = 0.84;

  if (progress < overshootPhase) {
    const normalized = progress / overshootPhase;
    const shaped = Math.pow(normalized, 1.35);
    return 760 * easeOutExpo(shaped);
  }

  const settleProgress = (progress - overshootPhase) / (1 - overshootPhase);
  return 760 - 40 * easeOutExpo(settleProgress);
};

const getScale = (progress) => {
  if (progress < 0.5) {
    return 1 + 0.18 * easeOutExpo(progress / 0.5);
  }

  return 1.18 - 0.18 * easeOutExpo((progress - 0.5) / 0.5);
};

/**
 * PreCaptureOverlay
 * - Runs before movement for jump moves.
 * - Shows a spinning aura behind a piece clone at the source square.
 * - Calls onAnimationComplete(animationId, reason) when complete.
 */
const PreCaptureOverlay = ({
  preCaptureAnimationPayload,
  boardRef,
  onAnimationComplete,
  showDebug = false,
}) => {
  const rafRef = useRef(null);
  const [frameState, setFrameState] = useState(null);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!preCaptureAnimationPayload) {
      return;
    }

    const boardEl = boardRef?.current;
    if (!boardEl) {
      onAnimationComplete?.(preCaptureAnimationPayload.animationId, 'pre-capture-no-board-ref');
      return;
    }

    const rect = boardEl.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      onAnimationComplete?.(preCaptureAnimationPayload.animationId, 'pre-capture-invalid-board-size');
      return;
    }

    const cellWidth = rect.width / 8;
    const cellHeight = rect.height / 8;
    const [fromRow, fromCol] = preCaptureAnimationPayload.from;

    const x = (fromCol + 0.5) * cellWidth;
    const y = (fromRow + 0.5) * cellHeight;
    const duration = Math.max(160, preCaptureAnimationPayload.duration ?? 250);
    const startedAt = performance.now();

    const tick = (now) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / duration, 1);

      setFrameState({
        x,
        y,
        cellWidth,
        cellHeight,
        piece: preCaptureAnimationPayload.piece,
        rotationDeg: getRotationDeg(progress),
        scale: getScale(progress),
      });

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      onAnimationComplete?.(preCaptureAnimationPayload.animationId, 'pre-capture-complete');
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [boardRef, onAnimationComplete, preCaptureAnimationPayload]);

  if (!preCaptureAnimationPayload || !frameState?.piece) {
    return null;
  }

  const pieceSize = Math.min(frameState.cellWidth, frameState.cellHeight) * 0.84;
  const auraSize = pieceSize * 1.38;
  const auraPalette = getAuraPalette(frameState.piece.color);

  const pieceLeft = frameState.x - pieceSize / 2;
  const pieceTop = frameState.y - pieceSize / 2;
  const auraLeft = frameState.x - auraSize / 2;
  const auraTop = frameState.y - auraSize / 2;

  return (
    <div className="absolute inset-0 pointer-events-none z-[68]">
      <div
        className="absolute"
        style={{
          width: `${auraSize}px`,
          height: `${auraSize}px`,
          transform: `translate3d(${auraLeft}px, ${auraTop}px, 0) rotate(${frameState.rotationDeg}deg) scale(${frameState.scale})`,
          transformOrigin: '50% 50%',
          willChange: 'transform, opacity',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            clipPath: AURA_CLIP_PATH,
            background: `radial-gradient(circle at 50% 50%, ${auraPalette.base} 0%, ${auraPalette.edge} 62%, rgba(255, 255, 255, 0.10) 100%)`,
            boxShadow: `0 0 10px ${auraPalette.glow}, 0 0 20px ${auraPalette.glow}, 0 0 30px ${auraPalette.glow}`,
            opacity: 0.95,
          }}
        />
      </div>

      <div
        className={`absolute ${showDebug ? 'rounded-full outline outline-2 outline-sky-300' : ''}`}
        style={{
          width: `${pieceSize}px`,
          height: `${pieceSize}px`,
          transform: `translate3d(${pieceLeft}px, ${pieceTop}px, 0)`,
        }}
      >
        <Piece color={frameState.piece.color} isKing={frameState.piece.isKing} />
      </div>
    </div>
  );
};

export default PreCaptureOverlay;
