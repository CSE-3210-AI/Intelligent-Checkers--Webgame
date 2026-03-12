import Piece from './Piece';

/**
 * Square – a single cell on the checkers board.
 *
 * Props
 * -----
 * isDark        bool    – dark (playable) or light square
 * piece         object|null – { color, isKing } or null
 * isHighlighted bool    – legal move destination for the selected piece
 * isSelected    bool    – this square's piece is currently selected
 * isMoveable    bool    – this piece can make a legal move this turn
 * onClick       fn|undefined – click handler from Board
 */
const Square = ({ isDark, piece, isHighlighted, isSelected, isMoveable, isLastMove, onClick }) => {
  const bgColor = isDark ? 'bg-gradient-to-br from-[#b08d57] to-[#7c5c2e]' : 'bg-[#F0E6D2]';

  return (
    <div
      className={`aspect-square ${bgColor} flex items-center justify-center relative transition-all duration-200
        ${onClick && isDark ? 'cursor-pointer hover:scale-105' : ''}
        ${isLastMove ? 'z-30' : ''}
      `}
      onClick={onClick}
    >
      {/* Last move highlight (yellow outline) */}
      {isLastMove && (
        <div className="absolute inset-0 rounded-lg border-4 border-yellow-400 animate-pulse pointer-events-none z-30" />
      )}

      {/* Green overlay – marks the currently selected piece's square */}
      {isSelected && (
        <div className="absolute inset-0 bg-green-400/40 pointer-events-none z-10 rounded-lg" />
      )}

      {/* Destination dot – shown on empty dark squares the selected piece can reach */}
      {isHighlighted && !piece && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-8 h-8 rounded-full bg-yellow-400/75" />
        </div>
      )}

      {/* Destination ring – shown when a capture lands on an (edge-case) occupied square */}
      {isHighlighted && piece && (
        <div className="absolute inset-0 ring-2 ring-inset ring-yellow-400 pointer-events-none z-20 rounded-lg" />
      )}

      {/* Moveable ring – amber ring around pieces that can legally move this turn */}
      {isMoveable && !isSelected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-[80%] h-[80%] rounded-full border-[3px] border-yellow-400/80" />
        </div>
      )}

      {piece && <Piece color={piece.color} isKing={piece.isKing} />}
    </div>
  );
};

export default Square;
