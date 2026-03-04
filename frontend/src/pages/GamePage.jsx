import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Home, Clock, Trophy, Users } from 'lucide-react';
import InitialBoard from '../components/InitialBoard';
import MidGameBoard from '../components/MidGameBoard';
import EndGameBoard from '../components/EndGameBoard';
import AnotherGameState from '../components/AnotherGameState';

const GamePage = () => {
  const [activeBoard, setActiveBoard] = useState('initial');
  const navigate = useNavigate();

  const boards = {
    initial: <InitialBoard />,
    midgame: <MidGameBoard />,
    endgame: <EndGameBoard />,
    another: <AnotherGameState />
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col items-center justify-center p-8">
      <div className="max-w-7xl w-full">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md"
            >
              <Home className="w-5 h-5 mr-2" />
              Home
            </Button>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-wide">
              Checkers Game
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardContent className="p-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white font-semibold text-sm">12:45</span>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardContent className="p-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-semibold text-sm">vs AI</span>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 border-white/20 backdrop-blur-md overflow-hidden">
              <CardContent className="p-6">
                {/* Board State Tabs */}
                <Tabs value={activeBoard} onValueChange={setActiveBoard} className="w-full mb-6">
                  <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md">
                    <TabsTrigger value="initial" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                      Initial
                    </TabsTrigger>
                    <TabsTrigger value="midgame" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                      Mid Game
                    </TabsTrigger>
                    <TabsTrigger value="endgame" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                      End Game
                    </TabsTrigger>
                    <TabsTrigger value="another" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
                      Another
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Board Display */}
                <div className="flex justify-center">
                  {boards[activeBoard]}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Info Sidebar */}
          <div className="space-y-6">
            {/* Players Card */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Player 1</p>
                      <p className="text-white/60 text-sm">Blue Pieces</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white">12</Badge>
                </div>
                
                <Separator className="bg-white/20" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">AI Opponent</p>
                      <p className="text-white/60 text-sm">Red Pieces</p>
                    </div>
                  </div>
                  <Badge className="bg-red-500 hover:bg-red-600 text-white">12</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Game Status */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-white font-bold text-lg mb-4">Game Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Current Turn</span>
                    <Badge variant="outline" className="bg-blue-500/20 border-blue-400 text-blue-100">
                      Player 1
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Move Count</span>
                    <span className="text-white font-semibold">24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Captures</span>
                    <span className="text-white font-semibold">3 - 2</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-md">
              <CardContent className="p-6 space-y-3">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold" size="lg">
                  New Game
                </Button>
                <Button className="w-full" variant="outline" size="lg">
                  Undo Move
                </Button>
                <Button className="w-full" variant="outline" size="lg">
                  Resign
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Text */}
        <Card className="mt-8 bg-white/10 border-white/20 backdrop-blur-md">
          <CardContent className="p-6">
            <p className="text-white/80 text-center">
              A pixel-perfect implementation of a Checkers game board using React and TailwindCSS.
              Switch between different game states to see various board configurations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GamePage;
