import React, { useState, useEffect } from 'react';
import { Player } from '../types/game';
import { Users, Armchair, Sparkles, Check, Gamepad2, Eye, UserCheck } from 'lucide-react';

interface PlayerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onSelectCount: (count: number) => void;
  isUserPlaying: boolean;
  onToggleUserPlaying: (enabled: boolean) => void;
  userName: string;
  onSaveUserName: (name: string) => void;
  players: Player[];
  onConfirm: () => void;
}

export const PlayerSetupModal: React.FC<PlayerSetupModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onSelectCount,
  isUserPlaying,
  onToggleUserPlaying,
  userName,
  onSaveUserName,
  players,
  onConfirm,
}) => {
  const [tempName, setTempName] = useState<string>(userName || '');
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTempName(userName || '');
      setSavedFeedback(false);
    }
  }, [isOpen, userName]);

  if (!isOpen) return null;

  const chairsCount = selectedCount - 1;

  const handleSaveName = () => {
    const finalName = tempName.trim() || 'Player 1';
    onSaveUserName(finalName);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1800);
  };

  const handleConfirmAll = () => {
    if (isUserPlaying) {
      const finalName = tempName.trim() || 'Player 1';
      onSaveUserName(finalName);
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Musical Chairs Setup</h2>
              <p className="text-xs text-slate-400">Configure players, custom name & circular chairs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded-md hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* 1. Select Number of Players (Requirement 1) */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Select Number of Players</span>
            <span className="text-xs font-mono text-purple-400 font-bold">{selectedCount} Players</span>
          </label>

          {/* Quick Player Count Buttons (3, 4, 5, 6, 7, 8, 10) */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {[3, 4, 5, 6, 7, 8, 10].map((num) => {
              const isSelected = selectedCount === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onSelectCount(num)}
                  className={`py-2 px-1 text-sm font-bold rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
                  }`}
                >
                  {num} {num === 5 && <span className="block text-[9px] font-normal opacity-90">(Default)</span>}
                </button>
              );
            })}
          </div>

          {/* Formula Callout */}
          <div className="flex items-center justify-between p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl mt-1 text-xs">
            <div className="flex items-center gap-2 text-purple-200">
              <Users className="w-4 h-4 text-purple-400" />
              <span>{selectedCount} Players</span>
            </div>
            <div className="font-mono text-slate-400">⟶</div>
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <Armchair className="w-4 h-4 text-emerald-400" />
              <span>{chairsCount} Chairs</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              (Formula: Chairs = Players - 1)
            </div>
          </div>
        </div>

        {/* 2. Play Mode Selector (Interactive Player vs Spectator) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Game Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onToggleUserPlaying(true)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                isUserPlaying
                  ? 'bg-sky-950/40 border-sky-500/60 text-sky-200'
                  : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Gamepad2 className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">Play as Player 1</div>
                <div className="text-[11px] text-slate-400">Enter custom name & scramble!</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onToggleUserPlaying(false)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                !isUserPlaying
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                  : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Eye className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">Spectator Mode</div>
                <div className="text-[11px] text-slate-400">Watch the AI contestants battle</div>
              </div>
            </button>
          </div>
        </div>

        {/* 3. Player 1 Name Customization (Displayed when Play as Player 1 is active) */}
        {isUserPlaying && (
          <div className="flex flex-col gap-2 p-3.5 bg-sky-950/30 border border-sky-500/40 rounded-xl text-xs">
            <div className="flex items-center justify-between">
              <label htmlFor="p1-name-input" className="font-semibold text-sky-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Player 1 Name</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Current: <strong className="text-sky-300 font-bold">{tempName.trim() || 'Player 1'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                id="p1-name-input"
                type="text"
                value={tempName}
                onChange={(e) => {
                  setTempName(e.target.value);
                  setSavedFeedback(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveName();
                  }
                }}
                maxLength={16}
                placeholder="Enter your name (Default: Player 1)"
                className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-lg text-slate-100 placeholder:text-slate-500 text-xs outline-none transition-colors"
              />

              <button
                type="button"
                onClick={handleSaveName}
                className={`px-4 py-2 font-semibold rounded-lg text-xs transition-all active:scale-95 flex items-center gap-1.5 shrink-0 ${
                  savedFeedback
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                }`}
              >
                {savedFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save</span>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              Default is <span className="text-slate-300 font-medium">Player 1</span> if left blank. Your custom name appears above your avatar, in round summaries, and on the Winner screen.
            </p>
          </div>
        )}

        {/* 4. Player Preview Lineup */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Starting Contestants ({selectedCount})
          </div>
          <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
            {players.slice(0, selectedCount).map((p, idx) => {
              const displayName =
                idx === 0 && isUserPlaying
                  ? tempName.trim() || 'Player 1'
                  : p.name;

              return (
                <div
                  key={p.id}
                  className="flex flex-col items-center gap-1 min-w-[58px] p-2 rounded-lg bg-slate-800/60 border border-slate-700/50"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold border-2 border-white/60 shadow-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    {idx === 0 && isUserPlaying ? '★' : p.number}
                  </div>
                  <span className="text-[10px] text-slate-300 truncate max-w-[54px] text-center">
                    {displayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirmation Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleConfirmAll}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-950/50 active:scale-98 transition-all text-sm"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Arrange Arena ({selectedCount} Players & {chairsCount} Chairs)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
