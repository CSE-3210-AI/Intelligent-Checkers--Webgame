import Piece from './Piece';

const Square = ({ isDark, piece, isHighlighted }) => {
  const bgColor = isDark ? 'bg-[#7A5A4A]' : 'bg-[#E5E5E5]';

  return (
    <div className={`aspect-square ${bgColor} flex items-center justify-center relative`}>
      {isHighlighted && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#D4B896] opacity-60"></div>
        </div>
      )}
      {piece && <Piece color={piece.color} isKing={piece.isKing} />}
    </div>
  );
};

export default Square;
