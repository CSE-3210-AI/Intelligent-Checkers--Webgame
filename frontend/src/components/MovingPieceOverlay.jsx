import { useEffect, useRef, useState } from 'react';
import Piece from './Piece';

const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

/**
 * MovingPieceOverlay (MVP)
 * - Animates one piece from source to destination using requestAnimationFrame.
 * - Calls onAnimationComplete(animationId, reason) when the glide finishes.
 */
const MovingPieceOverlay = ({
  animationPayload,
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

    if (!animationPayload) {
      return;
    }

    const boardEl = boardRef?.current;
    if (!boardEl) {
      console.warn(`[animation] missing boardRef for id=${animationPayload.animationId}`);
      onAnimationComplete?.(animationPayload.animationId, 'no-board-ref');
      return;
    }

    const rect = boardEl.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      console.warn(`[animation] invalid board dimensions for id=${animationPayload.animationId}`);
      onAnimationComplete?.(animationPayload.animationId, 'invalid-board-size');
      return;
    }

    const cellWidth = rect.width / 8;
    const cellHeight = rect.height / 8;

    const [fromRow, fromCol] = animationPayload.from;
    const [toRow, toCol] = animationPayload.to;

    const start = {
      x: (fromCol + 0.5) * cellWidth,
      y: (fromRow + 0.5) * cellHeight,
    };

    const end = {
      x: (toCol + 0.5) * cellWidth,
      y: (toRow + 0.5) * cellHeight,
    };

    const duration = Math.max(120, animationPayload.duration ?? 320);
    const startedAt = performance.now();

    console.log(`[animation] start id=${animationPayload.animationId} duration=${duration}ms`);

    const tick = (now) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);

      const x = start.x + (end.x - start.x) * eased;
      const y = start.y + (end.y - start.y) * eased;

      setFrameState({
        x,
        y,
        start,
        end,
        cellWidth,
        cellHeight,
        piece: animationPayload.piece,
        progress,
        eased,
      });

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      console.log(`[animation] end id=${animationPayload.animationId} elapsed=${Math.round(elapsed)}ms`);
      onAnimationComplete?.(animationPayload.animationId, 'raf-complete');
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [animationPayload, boardRef, onAnimationComplete]);

  if (!animationPayload || !frameState?.piece) {
    return null;
  }

  const pieceSize = Math.min(frameState.cellWidth, frameState.cellHeight) * 0.84;
  const left = frameState.x - pieceSize / 2;
  const top = frameState.y - pieceSize / 2;

  const travelX = frameState.end.x - frameState.start.x;
  const travelY = frameState.end.y - frameState.start.y;
  const travelDistance = Math.hypot(travelX, travelY) || 1;
  const directionX = travelX / travelDistance;
  const directionY = travelY / travelDistance;
  const angleDeg = Math.atan2(travelY, travelX) * (180 / Math.PI);
  const trailLength = Math.min(pieceSize * 1.3, Math.max(pieceSize * 0.7, travelDistance * 0.22));
  const trailWidth = pieceSize * 0.38;
  const trailCenterX = frameState.x - directionX * trailLength * 0.55;
  const trailCenterY = frameState.y - directionY * trailLength * 0.55;
  const trailColor = frameState.piece.color === 'blue'
    ? 'rgba(56, 211, 255, 0.9)'
    : 'rgba(255, 87, 170, 0.9)';
  const streakColor = frameState.piece.color === 'blue'
    ? 'rgba(186, 245, 255, 0.92)'
    : 'rgba(255, 214, 239, 0.9)';
  const trailOpacity = 0.18 + (1 - frameState.progress) * 0.44;

  return (
    <div className="absolute inset-0 pointer-events-none z-[70]">
      {showDebug && (
        <>
          <div
            className="absolute h-3 w-3 rounded-full bg-emerald-300"
            style={{
              transform: `translate3d(${frameState.start.x - 6}px, ${frameState.start.y - 6}px, 0)`,
            }}
          />
          <div
            className="absolute h-3 w-3 rounded-full bg-rose-300"
            style={{
              transform: `translate3d(${frameState.end.x - 6}px, ${frameState.end.y - 6}px, 0)`,
            }}
          />
        </>
      )}

      <div
        className="cp-move-trail absolute"
        style={{
          width: `${trailLength}px`,
          height: `${trailWidth}px`,
          left: `${trailCenterX - trailLength / 2}px`,
          top: `${trailCenterY - trailWidth / 2}px`,
          transform: `rotate(${angleDeg}deg)`,
          opacity: trailOpacity,
          background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${trailColor} 55%, ${trailColor} 80%, rgba(255,255,255,0) 100%)`,
        }}
      />

      <div
        className="cp-move-streak absolute"
        style={{
          width: `${trailLength * 0.95}px`,
          height: `${Math.max(2, pieceSize * 0.08)}px`,
          left: `${trailCenterX - (trailLength * 0.95) / 2}px`,
          top: `${trailCenterY - Math.max(2, pieceSize * 0.08) / 2}px`,
          transform: `rotate(${angleDeg}deg)`,
          opacity: trailOpacity * 0.95,
          background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${streakColor} 60%, rgba(255,255,255,0) 100%)`,
        }}
      />

      <div
        className={`absolute ${showDebug ? 'rounded-full outline outline-2 outline-lime-300' : ''}`}
        style={{
          width: `${pieceSize}px`,
          height: `${pieceSize}px`,
          transform: `translate3d(${left}px, ${top}px, 0)`,
        }}
      >
        <Piece
          color={frameState.piece.color}
          isKing={frameState.piece.isKing}
          mode="moving"
        />
      </div>
    </div>
  );
};

export default MovingPieceOverlay;
