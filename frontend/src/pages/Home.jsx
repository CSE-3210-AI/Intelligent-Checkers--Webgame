import React, { useRef, useState as useReactState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, Gamepad2, ChevronDown, LogOut } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import './Home.css';

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
    <div className="bg-container relative min-h-screen overflow-hidden">
      <div className="home-bg-media absolute inset-0 z-0" aria-hidden="true" />
      <div className="home-bg-overlay absolute inset-0 z-10" aria-hidden="true" />

      <div className="content relative z-20 flex min-h-screen flex-col text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">
        <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-black/60 px-5 py-4 backdrop-blur-md md:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 via-blue-500 to-indigo-600 shadow-[0_0_14px_rgba(34,211,238,0.65)]">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-wide text-white">CheckersAI</span>
            </div>

            <nav className="hidden items-center gap-6 md:flex" />

            <div className="flex items-center gap-3">
              <button className="rounded-md bg-transparent px-4 py-2 font-medium text-white/90 transition hover:bg-cyan-400/15 hover:text-cyan-100 hover:shadow-[0_0_12px_rgba(34,211,238,0.35)]">
                Rankings
              </button>

              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    className="flex items-center gap-2 rounded-md border border-cyan-300/35 bg-black/45 px-4 py-2 font-semibold text-white transition hover:bg-cyan-500/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                    onClick={() => setDropdown((d) => !d)}
                  >
                    <span className="font-bold">{user.username}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {dropdown && (
                    <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-white/15 bg-black/80 p-1 shadow-[0_18px_38px_rgba(0,0,0,0.5)] backdrop-blur-md">
                      <button
                        className="flex w-full items-center gap-2 rounded-md px-4 py-2 text-left text-red-200 transition hover:bg-red-500/20 hover:text-red-100"
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
                  className="border-cyan-300/45 bg-black/45 font-semibold text-white hover:bg-cyan-500/20 hover:text-white hover:shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                  onClick={() => navigate('/signin')}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-5 py-14 md:px-8 md:py-16">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-14 space-y-4 text-center md:mb-16">
              <Badge variant="outline" className="mb-4 border-cyan-300/50 bg-black/45 px-4 py-2 text-cyan-100">
                <Trophy className="mr-2 h-4 w-4" />
                Ready for Battle
              </Badge>

              <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
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
                className="h-16 min-w-[230px] rounded-xl border border-cyan-200/35 bg-linear-to-r from-cyan-500 to-blue-600 px-10 text-lg font-extrabold text-white shadow-[0_0_15px_rgba(0,198,255,0.6)] transition-all duration-200 hover:scale-[1.03] hover:brightness-110 hover:shadow-[0_0_26px_rgba(0,198,255,0.8)]"
                onClick={() => navigate('/how-to-play')}
              >
                How to Play
              </Button>

              <Button
                size="lg"
                className="h-16 min-w-[230px] rounded-xl border border-blue-300/35 bg-linear-to-r from-blue-500 via-blue-600 to-indigo-600 px-10 text-lg font-extrabold text-white shadow-[0_0_18px_rgba(59,130,246,0.58)] transition-all duration-200 hover:scale-[1.03] hover:brightness-110 hover:shadow-[0_0_28px_rgba(59,130,246,0.85)]"
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
    </div>
  );
};

export default Home;
