import Square from './Square';

/**
 * Board – renders the 8×8 checkers grid.
 *
 * Props
 * -----
 * pieces        8×8 array  – board state (null | { color, isKing })
 * highlights    [[r,c],…]  – legal destination squares for the selected piece
 * selected      [r,c]|null – currently selected piece position
 * moveable      Set<"r,c"> – positions of pieces that can legally move this turn
 * onSquareClick (row,col)  – click handler (omit for read-only / demo boards)
 */
const Board = ({
  pieces,
  highlights = [],
  selected = null,
  moveable = new Set(),
  onSquareClick,
}) => {
  const renderSquare = (row, col) => {
    const isDark = (row + col) % 2 === 1;
    const piece = pieces[row]?.[col] ?? null;
    const isHighlighted = highlights.some(([r, c]) => r === row && c === col);
    const isSelected = selected !== null && selected[0] === row && selected[1] === col;
    const isMoveable = moveable.has(`${row},${col}`);

    return (
      <Square
        key={`${row}-${col}`}
        isDark={isDark}
        piece={piece}
        isHighlighted={isHighlighted}
        isSelected={isSelected}
        isMoveable={isMoveable}
        onClick={onSquareClick ? () => onSquareClick(row, col) : undefined}
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
