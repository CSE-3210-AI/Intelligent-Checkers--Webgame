import React, { useRef, useState as useReactState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, Gamepad2, ChevronDown, LogOut } from 'lucide-react';
import { useUser } from '@/context/UserContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [dropdown, setDropdown] = useReactState(false);
  const dropdownRef = useRef();

  function handleClickOutside(e) {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setDropdown(false);
    }
  }

  React.useEffect(() => {
    if (dropdown) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdown]);

  return (
    <div className="relative flex min-h-screen flex-col text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">
        <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-black/60 px-4 py-3 backdrop-blur-md md:px-8 md:py-4">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 via-blue-500 to-indigo-600 shadow-[0_0_14px_rgba(34,211,238,0.65)]">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-bold tracking-wide text-white sm:text-xl">CheckersAI</span>
            </div>

            <nav className="hidden items-center gap-6 md:flex" />

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button className="CyberButton CyberButton--secondary hidden rounded-md px-4 py-2 font-medium sm:inline-flex">
                Rankings
              </button>

              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    className="CyberButton CyberButton--secondary flex items-center gap-2 rounded-md px-4 py-2 font-semibold"
                    onClick={() => setDropdown((d) => !d)}
                  >
                    <span className="font-bold">{user.username}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {dropdown && (
                    <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-white/15 bg-black/80 p-1 shadow-[0_18px_38px_rgba(0,0,0,0.5)] backdrop-blur-md">
                      <button
                        className="CyberButton CyberButton--danger flex w-full items-center gap-2 rounded-md px-4 py-2 text-left"
                        onClick={() => {
                          logout();
                          setDropdown(false);
                          navigate('/');
                        }}
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 border-cyan-300/45 bg-black/45 px-4 font-semibold text-white hover:bg-cyan-500/20 hover:text-white hover:shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                  onClick={() => navigate('/signin')}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 md:px-8 md:py-16">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-14 space-y-4 text-center md:mb-16">
              <Badge variant="outline" className="mb-4 border-cyan-300/50 bg-black/45 px-4 py-2 text-cyan-100">
                <Trophy className="mr-2 h-4 w-4" />
                Ready for Battle
              </Badge>

              <h1 className="cyber-heading mb-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-6xl">
                Welcome to CheckersAI
              </h1>

              <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-100 md:text-lg">
                Choose your challenge. Whether it&apos;s a friendly match or a test against our
                advanced AI, the board awaits your first move.
              </p>
            </div>

            <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-5 sm:flex-row">
              <Button
                size="lg"
                className="app-action-button"
                onClick={() => navigate('/how-to-play')}
              >
                How to Play
              </Button>

              <Button
                size="lg"
                className="app-action-button"
                onClick={() => navigate('/tournaments')}
              >
                Tournaments
              </Button>
            </div>
          </div>
        </main>

        <footer className="mt-auto w-full border-t border-white/15 bg-black/45 px-5 py-6 backdrop-blur-md md:px-8">
          <div className="mx-auto max-w-7xl">
            <Separator className="mb-6 bg-white/20" />
            <div className="flex flex-col items-center justify-between gap-4 text-sm text-slate-100 md:flex-row">
              <p className="text-center font-medium md:text-left">© 2026 StellarCheckers. All rights reserved.</p>
              <div className="flex flex-wrap justify-center gap-6">
                <Button variant="link" size="sm" className="text-slate-100/90 hover:text-white">
                  Terms of Service
                </Button>
                <Button variant="link" size="sm" className="text-slate-100/90 hover:text-white">
                  Privacy Policy
                </Button>
                <Button variant="link" size="sm" className="text-slate-100/90 hover:text-white">
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </footer>
    </div>
  );
};

export default Home;
