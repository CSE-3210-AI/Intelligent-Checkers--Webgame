import React, { useState, useRef, useState as useReactState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Bot, Trophy, Gamepad2, ArrowRight, ChevronLeft, ChevronDown, LogOut } from 'lucide-react';
import { useUser } from '@/context/UserContext';

const Home = () => {
  const [selectedMode, setSelectedMode] = useState('ai1-ai2');
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [dropdown, setDropdown] = useReactState(false);
  const dropdownRef = useRef();
  // Close dropdown on outside click
  function handleClickOutside(e) {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setDropdown(false);
    }
  }
  // Attach event listener
  React.useEffect(() => {
    if (dropdown) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdown]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-slate-100 to-blue-100 flex flex-col">
      {/* Header */}
      <header className="w-full px-8 py-5 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-black">
              StellarCheckers
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button className="px-4 py-2 rounded-md transition-colors text-black font-medium bg-transparent hover:bg-[#e6f0fa] focus:bg-[#e6f0fa]" onClick={() => navigate('#how-to-play')}>
              How to Play
            </button>
            <button className="px-4 py-2 rounded-md transition-colors text-black font-medium bg-transparent hover:bg-[#e6f0fa] focus:bg-[#e6f0fa] flex items-center" onClick={() => navigate('/tournaments')}>
              <Trophy className="w-4 h-4 mr-2" />
              Tournaments
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-md transition-colors text-black font-medium bg-transparent hover:bg-[#e6f0fa] focus:bg-[#e6f0fa]">
              Rankings
            </button>
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 focus:bg-blue-100 transition"
                  onClick={() => setDropdown((d) => !d)}
                >
                  <span className="font-bold">{user.username}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {dropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md text-left"
                      onClick={() => { logout(); setDropdown(false); navigate('/'); }}
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="font-semibold bg-white text-black border-slate-300 hover:bg-[#e6f0fa] hover:text-black"
                onClick={() => navigate('/signin')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <div className="max-w-5xl w-full mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="mb-4 px-4 py-2 bg-blue-50 border-blue-200 text-blue-700">
              <Trophy className="w-4 h-4 mr-2" />
              Ready for Battle
            </Badge>

            <h1 className="text-6xl font-extrabold bg-linear-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent mb-6">
              Select Game Mode
            </h1>
            
            <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
              Choose your challenge. Whether it's a friendly match or a test against our
              advanced AI, the board awaits your first move.
            </p>
          </div>

          {/* Tournament mode selection is now under the Tournaments section. */}

          {/* Action Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-4xl mx-auto">
            <Card className="flex-1 max-w-sm bg-linear-to-br from-white to-slate-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500 uppercase tracking-wide mb-2 text-center">Selected Mode</p>
                <p className="text-xl font-bold text-slate-900 text-center">
                  {selectedMode === 'ai1-ai2' ? 'AI1 vs AI2' : 'Our AI vs Online AI'}
                </p>
              </CardContent>
            </Card>
            <Button 
              size="lg"
              className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                if (selectedMode === 'our-vs-online') {
                  navigate('/select-internal-agent');
                } else {
                  navigate('/meet-agents');
                }
              }}
            >
              Continue to Benchmark
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-8 py-6 border-t border-slate-200 bg-white/80 backdrop-blur-md mt-auto">
        <div className="max-w-7xl mx-auto">
          <Separator className="mb-6" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600">
            <p className="text-center md:text-left font-medium">© 2026 StellarCheckers. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Button variant="link" size="sm" className="text-slate-600 hover:text-slate-900 bg-white">Terms of Service</Button>
              <Button variant="link" size="sm" className="text-slate-600 hover:text-slate-900 bg-white">Privacy Policy</Button>
              <Button variant="link" size="sm" className="text-slate-600 hover:text-slate-900 bg-white">Contact</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
