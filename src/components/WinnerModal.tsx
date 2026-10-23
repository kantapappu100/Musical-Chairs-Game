import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Player, RoundRecord } from '../types/game';
import { Trophy, Sparkles, RotateCcw, Award, SlidersHorizontal } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface WinnerModalProps {
  winner: Player | null;
  roundsCount: number;
  history: RoundRecord[];
  onPlayAgain: () => void;
  onOpenSetup?: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  roundsCount,
  history,
  onPlayAgain,
  onOpenSetup,
}) => {
  const confettiIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!winner) return;

    // Confetti Animation: Trigger a colorful, dynamic confetti animation bursting continuously
    const fireContinuousConfetti = () => {
      // Left side burst
      confetti({
        particleCount: 15,
        angle: 60,
        spread: 60,
        origin: { x: 0.05, y: 0.6 },
        colors: ['#F59E0B', '#EC4899', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#FBBF24'],
        zIndex: 9999,
      });

      // Right side burst
      confetti({
        particleCount: 15,
        angle: 120,
        spread: 60,
        origin: { x: 0.95, y: 0.6 },
        colors: ['#F59E0B', '#EC4899', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#FBBF24'],
        zIndex: 9999,
      });

      // Center celebratory shower
      confetti({
        particleCount: 8,
        angle: 90,
        spread: 100,
        origin: { x: 0.5, y: 0.2 },
        colors: ['#F59E0B', '#FBBF24', '#FFFFFF', '#EC4899'],
        zIndex: 9999,
      });
    };

    // Initial instant blast
    fireContinuousConfetti();

    // Continuous dynamic confetti animation across the screen
    confettiIntervalRef.current = window.setInterval(fireContinuousConfetti, 450);

    return () => {
      if (confettiIntervalRef.current !== null) {
        clearInterval(confettiIntervalRef.current);
        confettiIntervalRef.current = null;
      }
    };
  }, [winner]);

  if (!winner) return null;

  // Clean uppercase name for display (e.g. "BELLA", "ALEX")
  const cleanWinnerName = winner.name.replace(/\s*\(You\)/i, '').trim().toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-6 relative overflow-hidden">
        {/* Ambient atmospheric golden background lighting */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* 🏆 Trophy Icon / Graphic at top center */}
        <div className="relative flex flex-col items-center mt-2">
          {/* Animated Bouncing Crown */}
          <div className="text-5xl animate-bounce drop-shadow-lg select-none mb-1">
            👑
          </div>

          {/* Grand Golden Trophy Badge */}
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-1 shadow-2xl shadow-amber-500/40 rotate-1">
              <div className="w-full h-full rounded-[22px] bg-gradient-to-b from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950">
                <Trophy className="w-14 h-14 sm:w-16 sm:h-16 fill-current text-slate-950 drop-shadow-md" />
              </div>
            </div>

            {/* Sparkle decorative accents */}
            <div className="absolute -top-2 -right-2 text-2xl animate-spin duration-3000">✨</div>
            <div className="absolute -bottom-1 -left-2 text-xl animate-pulse">⭐</div>
          </div>
        </div>

        {/* Large Bold Winner Text (Requirement: e.g. "🎉 WINNER: [PLAYER NAME]!" e.g. 🎉 WINNER: BELLA!) */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Musical Chairs Champion
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 tracking-tight drop-shadow-md mt-1">
            🎉 WINNER: {cleanWinnerName}!
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Claimed the very last chair and outlasted all contestants!
          </p>
        </div>

        {/* Winner Details Card: Avatar, Player Number, and Total Rounds Survived */}
        <div className="w-full p-4 sm:p-5 bg-slate-800/90 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-4 shadow-inner">
          <div className="flex items-center gap-3.5 text-left">
            {/* Winner Avatar Graphic */}
            <div className="relative">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-extrabold text-xl border-4 border-amber-300 shadow-xl"
                style={{ backgroundColor: winner.color }}
              >
                #{winner.number}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-slate-900 shadow">
                1st
              </div>
            </div>

            {/* Winner Identity & Player Number */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold text-white">
                  {winner.name}
                </span>
                {winner.isUser && (
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky-500 text-slate-950">
                    You
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Player #{winner.number}
              </span>
            </div>
          </div>

          {/* Total Rounds Survived (Requirement: e.g., "Sole Survivor - Survived Round 5") */}
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">
              Tournament Result
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <Award className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Sole Survivor - Survived Round {roundsCount}</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              {history.length} Opponents Eliminated
            </span>
          </div>
        </div>

        {/* Elimination Recap History (Compact view) */}
        {history.length > 0 && (
          <div className="w-full bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-left">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Tournament Road to Victory
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {history.length} Round{history.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="max-h-24 overflow-y-auto space-y-1 text-xs text-slate-300 divide-y divide-slate-800/60 pr-1">
              {history.map((rec) => (
                <div key={rec.round} className="pt-1 flex items-center justify-between">
                  <span className="font-mono text-slate-400 text-[11px]">Round {rec.round}:</span>
                  <span className="text-rose-300 font-medium">
                    {rec.eliminatedPlayerName} failed to sit
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons: Prominent "Play Again" + "Change Setup" */}
        <div className="w-full flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/30 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>Play Again</span>
          </button>

          {onOpenSetup && (
            <button
              onClick={onOpenSetup}
              className="flex items-center justify-center gap-2 py-3.5 px-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl active:scale-95 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Change Setup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
