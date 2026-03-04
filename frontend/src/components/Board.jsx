import Square from './Square';

const Board = ({ pieces, highlights = [] }) => {
  const renderSquare = (row, col) => {
    const isDark = (row + col) % 2 === 1;
    const piece = pieces[row]?.[col];
    const isHighlighted = highlights.some(([r, c]) => r === row && c === col);

    return (
      <Square 
        key={`${row}-${col}`} 
        isDark={isDark} 
        piece={piece}
        isHighlighted={isHighlighted}
      />
    );
  };

  return (
    <div className="bg-black p-6 inline-block rounded-sm">
      <div className="grid grid-cols-8 gap-0 w-[640px] h-[640px]">
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 8 }, (_, col) => renderSquare(row, col))
        )}
      </div>
    </div>
  );
};

export default Board;
