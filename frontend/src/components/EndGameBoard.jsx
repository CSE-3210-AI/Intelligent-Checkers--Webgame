import Board from './Board';

const EndGameBoard = () => {
  const pieces = Array.from({ length: 8 }, () => Array(8).fill(null));

  pieces[0][1] = { color: 'blue', isKing: false };
  pieces[1][0] = { color: 'blue', isKing: false };
  pieces[0][5] = { color: 'red', isKing: false };
  pieces[3][2] = { color: 'blue', isKing: false };
  pieces[4][5] = { color: 'blue', isKing: false };
  
  pieces[4][7] = { color: 'red', isKing: false };
  pieces[5][0] = { color: 'red', isKing: false };
  pieces[6][7] = { color: 'red', isKing: false };
  pieces[7][0] = { color: 'red', isKing: false };

  return <Board pieces={pieces} />;
};

export default EndGameBoard;
