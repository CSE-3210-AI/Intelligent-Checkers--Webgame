import { useEffect, useRef, useState } from 'react';

const PIECE_THEME = {
  blue: {
    core: 'radial-gradient(circle at 28% 24%, rgba(205, 245, 255, 0.94) 0%, rgba(96, 219, 255, 0.92) 38%, rgba(21, 104, 255, 0.92) 100%)',
    edge: 'rgba(0, 225, 255, 0.76)',
    glow: 'rgba(0, 207, 255, 0.72)',
    inner: 'rgba(180, 246, 255, 0.6)',
    ring: 'rgba(130, 236, 255, 0.85)',
    king: 'rgba(208, 250, 255, 0.92)',
  },
  red: {
    core: 'radial-gradient(circle at 28% 24%, rgba(255, 226, 244, 0.96) 0%, rgba(255, 110, 205, 0.9) 36%, rgba(214, 35, 98, 0.92) 100%)',
    edge: 'rgba(255, 105, 190, 0.72)',
    glow: 'rgba(255, 64, 155, 0.7)',
    inner: 'rgba(255, 194, 232, 0.58)',
    ring: 'rgba(255, 184, 223, 0.84)',
    king: 'rgba(255, 232, 246, 0.92)',
  },
};

const getTheme = (color) => PIECE_THEME[color] ?? PIECE_THEME.red;

const Piece = ({ color, isKing, mode = 'idle', isSelected = false }) => {
  const theme = getTheme(color);
  const [kingFlashActive, setKingFlashActive] = useState(false);
  const kingInitializedRef = useRef(false);

  useEffect(() => {
    if (!isKing) {
      kingInitializedRef.current = false;
      setKingFlashActive(false);
      return undefined;
    }

    if (!kingInitializedRef.current) {
      kingInitializedRef.current = true;
      setKingFlashActive(true);
      const timeoutId = setTimeout(() => setKingFlashActive(false), 150);
      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [isKing]);

  const modeClass =
    mode === 'moving'
      ? 'cp-piece-moving'
      : mode === 'pre-capture'
        ? 'cp-piece-pre-capture'
        : '';

  const hoverClass = mode === 'idle' ? 'hover:scale-110' : '';

  return (
    <div className="cp-piece-shell relative w-full h-full flex items-center justify-center p-1">
      <div
        className={`cp-piece-core w-[70%] h-[70%] rounded-full flex items-center justify-center transition-transform duration-150 ${hoverClass} ${modeClass} ${isSelected ? 'cp-piece-selected' : ''} ${isKing ? 'cp-piece-king' : ''} ${kingFlashActive ? 'cp-piece-king-enter' : ''}`}
        style={{
          '--cp-piece-core': theme.core,
          '--cp-piece-edge': theme.edge,
          '--cp-piece-glow': theme.glow,
          '--cp-piece-inner': theme.inner,
          '--cp-piece-ring': theme.ring,
          '--cp-piece-king': theme.king,
        }}
      >
        <span className="cp-piece-core-shine" />
        <span className="cp-piece-ring cp-piece-ring-primary" />

        {isKing && (
          <>
            <span className="cp-piece-ring cp-piece-ring-secondary" />
            <span className="cp-piece-king-orbit" />
            {kingFlashActive && <span className="cp-piece-king-burst" />}
            <svg className="cp-piece-crown w-[55%] h-[55%]" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 2L15 8.5L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L9 8.5L12 2Z"
              />
            </svg>
          </>
        )}
      </div>
    </div>
  );
};

export default Piece;
