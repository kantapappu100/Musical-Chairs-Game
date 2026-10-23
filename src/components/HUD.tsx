import React from 'react';
import { GamePhase } from '../types/game';
import { Users, Armchair, Flame, Clock } from 'lucide-react';

interface HUDProps {
  round: number;
  remainingPlayersCount: number;
  remainingChairsCount: number;
  countdownSeconds: number;
  totalDuration: number;
  phase: GamePhase;
  liveMessage: string;
}

export const HUD: React.FC<HUDProps> = ({
  round,
  remainingPlayersCount,
  remainingChairsCount,
  countdownSeconds,
  totalDuration,
  phase,
  liveMessage,
}) => {
  const progressPercent = Math.max(0, Math.min(100, (countdownSeconds / totalDuration) * 100));
  const isUrgent = phase === 'DANCING' && countdownSeconds <= 5;
  const isScrambling = phase === 'HORN_SCRAMBLE';

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 p-3 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-sm text-slate-100 shadow-md">
        {/* Round Badge */}
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/80 rounded-lg border border-slate-700/50">
          <div className="p-2 rounded-md bg-amber-500/10 text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Round</div>
            <div className="text-xl font-bold font-mono tabular-nums text-amber-300">#{round}</div>
          </div>
        </div>

        {/* Remaining Players */}
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/80 rounded-lg border border-slate-700/50">
          <div className="p-2 rounded-md bg-blue-500/10 text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Players</div>
            <div className="text-xl font-bold font-mono tabular-nums text-blue-300">
              {remainingPlayersCount}
            </div>
          </div>
        </div>

        {/* Available Chairs */}
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/80 rounded-lg border border-slate-700/50">
          <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400">
            <Armchair className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Chairs</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-emerald-300">
                {remainingChairsCount}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({remainingPlayersCount} - 1)
              </span>
            </div>
          </div>
        </div>

        {/* 30-Second Countdown Timer */}
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
            isUrgent
              ? 'bg-rose-950/80 border-rose-500/60 animate-pulse text-rose-300'
              : isScrambling
              ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
              : 'bg-slate-800/80 border-slate-700/50 text-slate-200'
          }`}
        >
          <div className={`p-2 rounded-md ${isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-purple-500/10 text-purple-400'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <span>Timer</span>
              <span className="font-mono text-[10px] text-slate-400">30s limit</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums">
              {countdownSeconds.toFixed(1)}s
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar & Live Ticker */}
      <div className="flex flex-col gap-1.5">
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60 relative">
          <div
            className={`h-full transition-all duration-100 ${
              isUrgent
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 animate-pulse'
                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Live Commentary Message */}
        <div className="flex items-center justify-between px-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span
              className={`w-2 h-2 rounded-full ${
                phase === 'DANCING'
                  ? 'bg-emerald-400 animate-ping'
                  : phase === 'HORN_SCRAMBLE'
                  ? 'bg-rose-500 animate-bounce'
                  : 'bg-slate-400'
              }`}
            />
            <span className="font-medium text-slate-200 truncate">{liveMessage}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono shrink-0 hidden sm:block">
            Chairs = Players - 1
          </div>
        </div>
      </div>
    </div>
  );
};
