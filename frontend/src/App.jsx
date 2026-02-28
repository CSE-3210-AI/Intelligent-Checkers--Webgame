import { useState } from 'react'
import InitialBoard from './components/InitialBoard'
import MidGameBoard from './components/MidGameBoard'
import EndGameBoard from './components/EndGameBoard'
import AnotherGameState from './components/AnotherGameState'

function App() {
  const [activeBoard, setActiveBoard] = useState('initial')

  const boards = {
    initial: <InitialBoard />,
    midgame: <MidGameBoard />,
    endgame: <EndGameBoard />,
    another: <AnotherGameState />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold text-white mb-8 tracking-wide">Checkers Game</h1>
      
      <div className="mb-6 flex gap-4">
        <button 
          onClick={() => setActiveBoard('initial')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeBoard === 'initial' 
              ? 'bg-cyan-500 text-white shadow-lg scale-105' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Initial Setup
        </button>
        <button 
          onClick={() => setActiveBoard('midgame')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeBoard === 'midgame' 
              ? 'bg-cyan-500 text-white shadow-lg scale-105' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Mid Game
        </button>
        <button 
          onClick={() => setActiveBoard('endgame')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeBoard === 'endgame' 
              ? 'bg-cyan-500 text-white shadow-lg scale-105' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          End Game
        </button>
        <button 
          onClick={() => setActiveBoard('another')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeBoard === 'another' 
              ? 'bg-cyan-500 text-white shadow-lg scale-105' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Another State
        </button>
      </div>

      <div className="shadow-2xl rounded-lg overflow-hidden">
        {boards[activeBoard]}
      </div>

      <p className="text-gray-400 mt-8 text-center max-w-2xl">
        A pixel-perfect implementation of a Checkers game board using React and TailwindCSS.
        <br />
        Switch between different game states to see various board configurations.
      </p>
    </div>
  )
}

export default App
