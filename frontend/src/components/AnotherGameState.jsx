import Board from './Board';

const AnotherGameState = () => {
  const pieces = Array.from({ length: 8 }, () => Array(8).fill(null));

  pieces[1][4] = { color: 'red', isKing: true };
  pieces[3][2] = { color: 'blue', isKing: false };
  
  pieces[4][5] = { color: 'red', isKing: false };
  pieces[4][7] = { color: 'red', isKing: false };
  pieces[5][0] = { color: 'red', isKing: false };
  pieces[7][0] = { color: 'red', isKing: false };

  const highlights = [
    [1, 3],
    [1, 5],
    [2, 2],
    [2, 6]
  ];

  return <Board pieces={pieces} highlights={highlights} />;
};

export default AnotherGameState;
