import Board from './Board';

const InitialBoard = () => {
  const pieces = Array.from({ length: 8 }, () => Array(8).fill(null));

  // Blue pieces (top)
  [0, 2].forEach(col => pieces[0][col] = { color: 'blue', isKing: false });
  [1, 3, 5, 7].forEach(col => pieces[1][col] = { color: 'blue', isKing: false });
  [0, 2, 4, 6].forEach(col => pieces[2][col] = { color: 'blue', isKing: false });

  // Red pieces (bottom)
  [1, 3, 5, 7].forEach(col => pieces[5][col] = { color: 'red', isKing: false });
  [0, 2, 4, 6].forEach(col => pieces[6][col] = { color: 'red', isKing: false });
  [1, 3, 5, 7].forEach(col => pieces[7][col] = { color: 'red', isKing: false });

  return <Board pieces={pieces} />;
};

export default InitialBoard;
