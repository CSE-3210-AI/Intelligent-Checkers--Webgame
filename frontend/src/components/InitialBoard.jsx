import Board from './Board';

const InitialBoard = () => {
  const pieces = Array.from({ length: 8 }, () => Array(8).fill(null));

  // Blue pieces (top 3 rows) - 12 pieces total on dark squares
  pieces[0][1] = { color: 'blue', isKing: false };
  pieces[0][3] = { color: 'blue', isKing: false };
  pieces[0][5] = { color: 'blue', isKing: false };
  pieces[0][7] = { color: 'blue', isKing: false };
  
  pieces[1][0] = { color: 'blue', isKing: false };
  pieces[1][2] = { color: 'blue', isKing: false };
  pieces[1][4] = { color: 'blue', isKing: false };
  pieces[1][6] = { color: 'blue', isKing: false };
  
  pieces[2][1] = { color: 'blue', isKing: false };
  pieces[2][3] = { color: 'blue', isKing: false };
  pieces[2][5] = { color: 'blue', isKing: false };
  pieces[2][7] = { color: 'blue', isKing: false };

  // Red pieces (bottom 3 rows) - 12 pieces total on dark squares
  pieces[5][0] = { color: 'red', isKing: false };
  pieces[5][2] = { color: 'red', isKing: false };
  pieces[5][4] = { color: 'red', isKing: false };
  pieces[5][6] = { color: 'red', isKing: false };
  
  pieces[6][1] = { color: 'red', isKing: false };
  pieces[6][3] = { color: 'red', isKing: false };
  pieces[6][5] = { color: 'red', isKing: false };
  pieces[6][7] = { color: 'red', isKing: false };
  
  pieces[7][0] = { color: 'red', isKing: false };
  pieces[7][2] = { color: 'red', isKing: false };
  pieces[7][4] = { color: 'red', isKing: false };
  pieces[7][6] = { color: 'red', isKing: false };

  return <Board pieces={pieces} />;
};

export default InitialBoard;
