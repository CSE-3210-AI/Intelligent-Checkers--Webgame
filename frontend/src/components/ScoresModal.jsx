import React from 'react';
import { X, Trophy } from 'lucide-react';

function getWinner(match) {
  if (match.score1 === match.score2) return null;
  return match.score1 > match.score2 ? 'player1' : 'player2';
}

const ScoresModal = ({ isOpen, onClose, matches = [], loading = false, error = null }) => {
  React.useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-3 py-6 backdrop-blur-sm sm:px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scores-modal-title"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-cyan-300/35 bg-slate-950/75 p-4 shadow-[0_0_35px_rgba(56,189,248,0.35),0_0_60px_rgba(147,51,234,0.25)] backdrop-blur-xl transition-all sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="CyberButton CyberButton--secondary absolute right-3 top-3 rounded-md px-2.5 py-1.5"
          aria-label="Close scores modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 mt-1 flex items-center gap-2 sm:mb-5">
          <Trophy className="h-5 w-5 text-cyan-300" />
          <h2 id="scores-modal-title" className="cyber-heading text-xl font-bold text-white sm:text-2xl">
            Match History
          </h2>
        </div>

        <div className="max-h-[68vh] space-y-3 overflow-y-auto pr-1 sm:max-h-[65vh]">
          {loading ? (
            <div className="rounded-xl border border-white/15 bg-black/25 px-4 py-6 text-center text-slate-200">
              Loading scores...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-300/30 bg-black/25 px-4 py-6 text-center text-rose-100">
              {error}
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-xl border border-white/15 bg-black/25 px-4 py-6 text-center text-slate-200">
              No match history yet.
            </div>
          ) : (
            matches.map((match, index) => {
              const winner = getWinner(match);
              const player1IsWinner = winner === 'player1';
              const player2IsWinner = winner === 'player2';
              const drawHeavy = Number(match.draws ?? 0) >= Math.max(Number(match.score1 ?? 0), Number(match.score2 ?? 0));
              const cardToneClass = drawHeavy
                ? 'border-slate-300/35 bg-slate-800/45'
                : 'border-cyan-200/20 bg-black/35';

              return (
                <div
                  key={`${match.player1}-${match.player2}-${match.lastPlayed ?? index}`}
                  className={`group rounded-xl border px-3 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/50 hover:shadow-[0_0_18px_rgba(34,211,238,0.2)] sm:px-4 ${cardToneClass}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-sm text-slate-100 sm:text-base">
                      <span
                        className={player1IsWinner ? 'font-extrabold text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]' : 'font-semibold'}
                      >
                        {match.player1}
                      </span>
                      <span className="mx-2 text-slate-300">vs</span>
                      <span
                        className={player2IsWinner ? 'font-extrabold text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]' : 'font-semibold'}
                      >
                        {match.player2}
                      </span>
                    </div>

                    <div className="inline-flex items-center self-start gap-2 rounded-lg border border-white/20 bg-slate-900/80 px-3 py-1.5 text-sm font-bold text-white shadow-[0_0_14px_rgba(59,130,246,0.25)] sm:self-auto sm:text-base">
                      <span>{match.score1} - {match.score2} - {match.draws ?? 0}</span>
                      <span className="text-xs font-semibold text-slate-300">(W-L-D)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-300/90">
                    Draws: {match.draws ?? 0}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoresModal;
