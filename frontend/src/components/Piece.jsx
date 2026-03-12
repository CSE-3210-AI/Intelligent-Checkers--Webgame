const Piece = ({ color, isKing }) => {
  const colorClasses = color === 'blue'
    ? 'bg-gradient-to-br from-blue-400 to-blue-700'
    : 'bg-gradient-to-br from-red-400 to-red-700';

  return (
    <div className="relative w-full h-full flex items-center justify-center p-1">
      <div className={`w-[70%] h-[70%] rounded-full ${colorClasses} border-4 border-black shadow-xl flex items-center justify-center transition-transform duration-150 hover:scale-110`}
        style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.4), 0 0 0 4px #fff3 inset' }}>
        {isKing && (
          <svg className="w-[55%] h-[55%]" viewBox="0 0 24 24" fill="gold">
            <path d="M12 2L15 8.5L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L9 8.5L12 2Z" />
          </svg>
        )}
      </div>
    </div>
  );
};

export default Piece;
