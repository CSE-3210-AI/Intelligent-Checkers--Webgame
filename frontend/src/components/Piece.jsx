const Piece = ({ color, isKing }) => {
  const colorClasses = color === 'blue' 
    ? 'bg-[#00CED1]' 
    : 'bg-[#FF6B6B]';

  return (
    <div className="relative w-full h-full flex items-center justify-center p-3">
      <div className={`w-[70%] h-[70%] rounded-full ${colorClasses} border-[5px] border-black shadow-2xl flex items-center justify-center`}>
        {isKing && (
          <svg className="w-[55%] h-[55%]" viewBox="0 0 24 24" fill="black">
            <path d="M12 2L15 8.5L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L9 8.5L12 2Z" />
          </svg>
        )}
      </div>
    </div>
  );
};

export default Piece;
