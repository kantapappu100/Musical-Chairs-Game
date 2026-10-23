import React from 'react';
import { Player } from '../types/game';
import { UserMinus, ArrowRight, Sparkles } from 'lucide-react';

interface EliminationAlertProps {
  eliminatedPlayer: Player | null;
  round: number;
  remainingPlayers: number;
  remainingChairs: number;
  onNextRound: () => void;
  autoNextTimer: number;
}

export const EliminationAlert: React.FC<EliminationAlertProps> = ({
  eliminatedPlayer,
  round,
  remainingPlayers,
  remainingChairs,
  onNextRound,
  autoNextTimer,
}) => {
  if (!eliminatedPlayer) return null;

  return (
    <div className="w-full p-4 bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border border-rose-500/40 rounded-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
          <UserMinus className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Round {round} Elimination
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-300 font-mono">1 Chair Removed</span>
          </div>
          <div className="text-sm font-semibold text-slate-100 mt-0.5">
            <span className="text-rose-300 font-bold">{eliminatedPlayer.name}</span> couldn't grab a
            chair and is out!
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Next Round: {remainingPlayers} Players competing for {remainingChairs} Chairs
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <button
          onClick={onNextRound}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow-md active:scale-95 transition-all text-xs whitespace-nowrap"
        >
          <span>Next Round ({autoNextTimer}s)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
