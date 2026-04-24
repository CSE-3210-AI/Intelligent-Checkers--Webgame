import Piece from './Piece';
import PreCaptureHintAura from './PreCaptureHintAura';

/**
 * Square - a single cell on the checkers board.
 */
const Square = ({
  isDark,
  piece,
  suppressPiece = false,
  isHighlighted,
  isSelected,
  isLastMove,
  isMoveable = false,
  isPreCaptureCandidate = false,
  onClick,
}) => {
  const bgColor = isDark
    ? 'cp-square-dark bg-gradient-to-br from-[#061226] via-[#0a1d35] to-[#030b18]'
    : 'cp-square-light bg-gradient-to-br from-[#152741] via-[#102238] to-[#0a172a]';
  const visiblePiece = suppressPiece ? null : piece;

  return (
    <div
      className={`cp-square aspect-square ${bgColor} flex items-center justify-center relative transition-all duration-200 ${
        onClick && isDark ? 'cp-square-interactive cursor-pointer hover:scale-[1.02]' : ''
      } ${isLastMove ? 'z-30' : ''}`}
      onClick={onClick}
    >
      <div className="cp-square-grid absolute inset-0 pointer-events-none" />

      {isLastMove && (
        <div className="cp-last-move-ring absolute inset-[4px] pointer-events-none z-30" />
      )}

      {isSelected && (
        <div className="cp-selected-overlay absolute inset-[3px] pointer-events-none z-10" />
      )}

      {isMoveable && !!visiblePiece && !isSelected && (
        <div className="cp-moveable-outline absolute inset-[6px] pointer-events-none z-[12]" />
      )}

      {isHighlighted && !visiblePiece && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="cp-highlight-dot" />
        </div>
      )}

      {isHighlighted && visiblePiece && (
        <div className="cp-highlight-ring absolute inset-[3px] pointer-events-none z-20" />
      )}

      {isPreCaptureCandidate && !!visiblePiece && (
        <PreCaptureHintAura color={visiblePiece.color} />
      )}

      {visiblePiece && (
        <Piece
          color={visiblePiece.color}
          isKing={visiblePiece.isKing}
          isSelected={isSelected}
        />
      )}
    </div>
  );
};

export default Square;
