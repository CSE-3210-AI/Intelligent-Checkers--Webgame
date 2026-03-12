import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Home from './pages/Home'
import AISelection from './pages/AISelection'
import GamePage from './pages/GamePage'
import MeetAgents from './pages/MeetAgents'
import SelectInternalAgent from './pages/SelectInternalAgent'
import TournamentModeSelection from './pages/TournamentModeSelection'
import TournamentInternal from './pages/TournamentInternal'
import TournamentOnline from './pages/TournamentOnline'

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ai-selection" element={<AISelection />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/meet-agents" element={<MeetAgents />} />
          <Route path="/select-internal-agent" element={<SelectInternalAgent />} />
          <Route path="/tournaments" element={<TournamentModeSelection />} />
          <Route path="/tournament/internal" element={<TournamentInternal />} />
          <Route path="/tournament/online" element={<TournamentOnline />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App
