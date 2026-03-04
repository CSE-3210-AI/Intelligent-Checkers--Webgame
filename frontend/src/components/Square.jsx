import Piece from './Piece';

const Square = ({ isDark, piece, isHighlighted }) => {
  const bgColor = isDark ? 'bg-[#8B6F47]' : 'bg-[#F0E6D2]';

  return (
    <div className={`aspect-square ${bgColor} flex items-center justify-center relative`}>
      {isHighlighted && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#D4B896] opacity-70"></div>
        </div>
      )}
      {piece && <Piece color={piece.color} isKing={piece.isKing} />}
    </div>
  );
};

export default Square;
