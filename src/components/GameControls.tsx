import React from 'react';
import { GamePhase } from '../types/game';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Music,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';

interface GameControlsProps {
  phase: GamePhase;
  isPaused: boolean;
  onStartGame: () => void;
  onTogglePause: () => void;
  onRestartGame: () => void;
  onDropBeatEarly: () => void;
  onUserRushChair?: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  isUserPlaying: boolean;
  userPlayerSeated: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  phase,
  isPaused,
  onStartGame,
  onTogglePause,
  onRestartGame,
  onDropBeatEarly,
  onUserRushChair,
  onOpenSettings,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
  isUserPlaying,
  userPlayerSeated,
}) => {
  const canStart = phase === 'SETUP' || phase === 'ROUND_READY';
  const isDancing = phase === 'DANCING';
  const isScrambling = phase === 'HORN_SCRAMBLE';

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-sm shadow-md">
      {/* Primary Actions Group */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {canStart && (
          <button
            onClick={onStartGame}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-950/30 active:scale-95 transition-all text-sm whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Game</span>
          </button>
        )}

        {(isDancing || isScrambling) && (
          <button
            onClick={onTogglePause}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 font-semibold rounded-lg border text-sm whitespace-nowrap active:scale-95 transition-all ${
              isPaused
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            )}
          </button>
        )}

        {/* Drop Beat Now / Fast Forward to Scramble (convenient for testing or skipping long wait) */}
        {isDancing && !isPaused && (
          <button
            onClick={onDropBeatEarly}
            title="Stop the music right now and blast the horn"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-semibold whitespace-nowrap active:scale-95 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            <span>Drop Beat Early</span>
          </button>
        )}

        {/* User Interactive Scramble Trigger */}
        {isScrambling && isUserPlaying && !userPlayerSeated && onUserRushChair && (
          <button
            onClick={onUserRushChair}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-sky-950/50 animate-bounce active:scale-90 transition-all text-sm whitespace-nowrap"
          >
            <span>RUSH TO CHAIR! (Space)</span>
          </button>
        )}

        {/* Restart Button */}
        <button
          onClick={onRestartGame}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg active:scale-95 transition-colors whitespace-nowrap"
          title="Restart Game"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Restart</span>
        </button>
      </div>

      {/* Secondary Controls: Audio & Player Setup */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {/* Toggle Player Setup / Rules */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-300 transition-colors"
          title="Configure Players"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-xs">Players Setup</span>
        </button>

        {/* Music Toggle */}
        <button
          onClick={onToggleMusic}
          className={`p-2 rounded-lg border text-xs transition-colors ${
            musicEnabled
              ? 'bg-purple-950/50 border-purple-500/50 text-purple-300'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}
          title={musicEnabled ? 'Mute Music' : 'Enable Music'}
        >
          <Music className="w-4 h-4" />
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-lg border text-xs transition-colors ${
            soundEnabled
              ? 'bg-blue-950/50 border-blue-500/50 text-blue-300'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}
          title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
