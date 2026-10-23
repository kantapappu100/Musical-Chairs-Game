/**
 * Musical Chairs Game
 * Full implementation adhering strictly to all requirements:
 * 1. Player selection with Formula: Chairs = Players - 1
 * 2. Circular chair & player arrangement
 * 3. Start game with walking/dancing players, upbeat music, and 30s countdown
 * 4. Stop music immediately at 0s, sound loud horn, players scramble
 * 5. Eliminate 1 player left without chair, remove 1 chair
 * 6. Repeat rounds until 1 remains
 * 7. Announce Winner with celebratory confetti, crown, and victory music
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Player,
  Chair,
  GamePhase,
  RoundRecord,
} from './types/game';
import { generateInitialPlayers } from './utils/playerPresets';
import { soundEngine } from './utils/audio';
import { ArenaCanvas3D } from './components/ArenaCanvas3D';
import { HUD } from './components/HUD';
import { GameControls } from './components/GameControls';
import { PlayerSetupModal } from './components/PlayerSetupModal';
import { WinnerModal } from './components/WinnerModal';
import { EliminationAlert } from './components/EliminationAlert';
import {
  Music,
  Users,
  Armchair,
  Info,
  Trophy,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

const TIMER_DURATION = 30.0; // 30-second countdown as requested

export default function App() {
  // Game Setup State
  const [initialPlayerCount, setInitialPlayerCount] = useState<number>(5);
  const [isUserPlaying, setIsUserPlaying] = useState<boolean>(true);
  const [userPlayerName, setUserPlayerName] = useState<string>('Player 1');
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);

  // Active Game State
  const [phase, setPhase] = useState<GamePhase>('SETUP');
  const [round, setRound] = useState<number>(1);
  const [players, setPlayers] = useState<Player[]>([]);
  const [chairs, setChairs] = useState<Chair[]>([]);
  const [countdown, setCountdown] = useState<number>(TIMER_DURATION);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [liveMessage, setLiveMessage] = useState<string>(
    'Select players and click Start Game to begin!'
  );
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [winnerPlayer, setWinnerPlayer] = useState<Player | null>(null);
  const [roundHistory, setRoundHistory] = useState<RoundRecord[]>([]);
  const [autoNextTimer, setAutoNextTimer] = useState<number>(5);

  // Audio settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [beatPulse, setBeatPulse] = useState<number>(0);

  // Center coordinate of the 720x720 arena
  const ARENA_CENTER = 360;

  /**
   * Helper to arrange chairs in a circular formation
   * Chairs = Active Players - 1
   */
  const buildChairsForActiveCount = useCallback((activeCount: number): Chair[] => {
    const chairCount = Math.max(1, activeCount - 1);
    const newChairs: Chair[] = [];

    // If only 1 chair remains (final showdown between 2 players), place in center
    const radius = chairCount === 1 ? 0 : Math.min(130, 48 + chairCount * 14);

    const chairColors = ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'];

    for (let i = 0; i < chairCount; i++) {
      const angle = (i / chairCount) * Math.PI * 2;
      const x = ARENA_CENTER + Math.cos(angle) * radius;
      const y = ARENA_CENTER + Math.sin(angle) * radius;

      newChairs.push({
        id: `chair-${i + 1}`,
        index: i,
        angle,
        radius,
        x,
        y,
        occupiedByPlayerId: null,
        color: chairColors[i % chairColors.length],
      });
    }

    return newChairs;
  }, []);

  /**
   * Helper to arrange players in an outer circle around chairs
   */
  const arrangePlayersInCircle = useCallback(
    (currentPlayers: Player[], chairRadius: number): Player[] => {
      const active = currentPlayers.filter((p) => p.status !== 'eliminated');
      const activeCount = active.length;
      const playerRadius = Math.max(chairRadius + 80, 190);

      let activeIndex = 0;
      return currentPlayers.map((p) => {
        if (p.status === 'eliminated') return p;

        const angle = (activeIndex / activeCount) * Math.PI * 2;
        activeIndex++;
        const x = ARENA_CENTER + Math.cos(angle) * playerRadius;
        const y = ARENA_CENTER + Math.sin(angle) * playerRadius;

        return {
          ...p,
          angle,
          radius: playerRadius,
          x,
          y,
          status: 'ready',
          assignedChairId: null,
          speechBubble: null,
        };
      });
    },
    []
  );

  /**
   * Initialize a new game tournament
   */
  const initGame = useCallback(
    (playerCount: number, userPlays: boolean, customName = userPlayerName) => {
      soundEngine.stopMusic();
      const initialList = generateInitialPlayers(playerCount, userPlays, customName);
      const generatedChairs = buildChairsForActiveCount(playerCount);
      const chairRadius = generatedChairs.length > 1 ? generatedChairs[0].radius : 0;
      const arranged = arrangePlayersInCircle(initialList, chairRadius);

      setRound(1);
      setPlayers(arranged);
      setChairs(generatedChairs);
      setCountdown(TIMER_DURATION);
      setIsPaused(false);
      setEliminatedPlayer(null);
      setWinnerPlayer(null);
      setRoundHistory([]);
      setPhase('ROUND_READY');
      setLiveMessage(
        `Round 1 Ready! ${playerCount} Players · ${generatedChairs.length} Chairs. Press Start Game.`
      );
    },
    [buildChairsForActiveCount, arrangePlayersInCircle, userPlayerName]
  );

  /**
   * Save custom Player 1 name (or default to Player 1)
   */
  const handleSaveUserName = (name: string) => {
    const resolved = name.trim() || 'Player 1';
    setUserPlayerName(resolved);
    setPlayers((prev) =>
      prev.map((p) => (p.isUser ? { ...p, name: resolved } : p))
    );
  };

  // Initial setup on mount
  useEffect(() => {
    initGame(initialPlayerCount, isUserPlaying, userPlayerName);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Start or Resume the 30-second dancing round
   */
  const handleStartGame = () => {
    if (phase !== 'ROUND_READY' && phase !== 'SETUP') return;

    soundEngine.playRoundStart();
    soundEngine.startMusic();
    setPhase('DANCING');
    setIsPaused(false);
    setLiveMessage('Music is playing! Players are dancing around the chairs...');

    setPlayers((prev) =>
      prev.map((p) => (p.status !== 'eliminated' ? { ...p, status: 'dancing' } : p))
    );
  };

  /**
   * Pause / Resume Game
   */
  const handleTogglePause = () => {
    if (phase !== 'DANCING' && phase !== 'HORN_SCRAMBLE') return;

    if (!isPaused) {
      soundEngine.stopMusic();
      setIsPaused(true);
      setLiveMessage('Game Paused. Click Resume to continue.');
    } else {
      if (phase === 'DANCING') {
        soundEngine.startMusic();
      }
      setIsPaused(false);
      setLiveMessage('Game Resumed!');
    }
  };

  /**
   * Instant trigger to drop the beat early (convenient testing / skip waiting 30s)
   */
  const handleDropBeatEarly = () => {
    if (phase !== 'DANCING') return;
    triggerHornAndScramble();
  };

  /**
   * STOP MUSIC AND SOUND HORN (Requirement 4)
   * When countdown hits zero, immediately stop music, blast loud horn, and scramble
   */
  const triggerHornAndScramble = useCallback(() => {
    // Stop music immediately
    soundEngine.stopMusic();

    // Play loud horn signal
    soundEngine.playHorn();

    setPhase('HORN_SCRAMBLE');
    setLiveMessage('HORN SOUNDED! ALL PLAYERS MUST SIT ON A CHAIR NOW!');

    // Update players to scrambling status
    setPlayers((prev) =>
      prev.map((p) =>
        p.status !== 'eliminated'
          ? {
              ...p,
              status: 'scrambling',
              speechBubble: '😱',
            }
          : p
      )
    );
  }, []);

  /**
   * Player 1 (User) interactive Rush To Chair action
   */
  const handleUserRushChair = useCallback(
    (preferredChairId?: string) => {
      if (phase !== 'HORN_SCRAMBLE') return;

      setPlayers((prevPlayers) => {
        const user = prevPlayers.find((p) => p.isUser && p.status === 'scrambling');
        if (!user) return prevPlayers;

        // Find nearest unoccupied chair or target preferred chair
        const freeChairs = chairs.filter((c) => !c.occupiedByPlayerId);
        if (freeChairs.length === 0) return prevPlayers;

        let targetChair = freeChairs[0];
        if (preferredChairId) {
          const match = freeChairs.find((c) => c.id === preferredChairId);
          if (match) targetChair = match;
        } else {
          // Find closest chair
          let minDist = Infinity;
          for (const ch of freeChairs) {
            const d = Math.hypot(ch.x - user.x, ch.y - user.y);
            if (d < minDist) {
              minDist = d;
              targetChair = ch;
            }
          }
        }

        return prevPlayers.map((p) =>
          p.id === user.id ? { ...p, assignedChairId: targetChair.id } : p
        );
      });
    },
    [phase, chairs]
  );

  /**
   * Main Countdown Timer & Dancing Physics Loop
   */
  useEffect(() => {
    if (phase !== 'DANCING' || isPaused) return;

    let lastTime = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Pulse visual beats
      setBeatPulse((prev) => (prev > 0.1 ? prev - dt * 2 : (Date.now() % 480 < 100 ? 1 : 0)));

      // Update 30s Countdown
      setCountdown((prev) => {
        const next = Math.max(0, prev - dt);
        if (next <= 0) {
          triggerHornAndScramble();
          return 0;
        }
        return next;
      });

      // Move players clockwise around circular arrangement
      setPlayers((prevPlayers) => {
        const activeCount = prevPlayers.filter((p) => p.status !== 'eliminated').length;
        const walkSpeed = 0.85; // radians per second

        return prevPlayers.map((player) => {
          if (player.status === 'eliminated') return player;

          const newAngle = player.angle + walkSpeed * dt;
          const wobble = Math.sin(newAngle * 4 + player.danceStep) * 6;
          const r = player.radius + wobble;
          const x = ARENA_CENTER + Math.cos(newAngle) * r;
          const y = ARENA_CENTER + Math.sin(newAngle) * r;

          return {
            ...player,
            angle: newAngle,
            x,
            y,
            danceStep: player.danceStep + dt * 4,
          };
        });
      });
    }, 30);

    return () => clearInterval(interval);
  }, [phase, isPaused, triggerHornAndScramble]);

  /**
   * Scramble Movement & Chair Claiming Logic (Requirement 4 & 5)
   * Players scramble toward the circular chairs. Each chair holds 1 player.
   * Exactly 1 player will fail to find a chair and be eliminated!
   */
  useEffect(() => {
    if (phase !== 'HORN_SCRAMBLE' || isPaused) return;

    let lastTime = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      setChairs((currentChairs) => {
        let chairsUpdated = [...currentChairs];

        setPlayers((currentPlayers) => {
          let allClaimed = true;
          const activePlayers = currentPlayers.filter((p) => p.status !== 'eliminated');

          const updatedPlayers = currentPlayers.map((player) => {
            if (player.status === 'eliminated' || player.status === 'seated') {
              return player;
            }

            // Available chairs
            const freeChairs = chairsUpdated.filter((c) => !c.occupiedByPlayerId);

            if (freeChairs.length === 0) {
              // No chairs left anywhere! This player is stranded
              return {
                ...player,
                status: 'ready' as const,
                speechBubble: '😱',
              };
            }

            allClaimed = false;

            // Pick closest available chair
            let bestChair = freeChairs[0];
            let minDist = Infinity;
            for (const ch of freeChairs) {
              const d = Math.hypot(ch.x - player.x, ch.y - player.y);
              if (d < minDist) {
                minDist = d;
                bestChair = ch;
              }
            }

            // Move player towards target chair
            const dx = bestChair.x - player.x;
            const dy = bestChair.y - player.y;
            const dist = Math.hypot(dx, dy);
            const speed = player.scrambleSpeed * 90; // pixels per second

            if (dist <= 12) {
              // Reached chair! Claim it if still free
              if (!bestChair.occupiedByPlayerId) {
                bestChair.occupiedByPlayerId = player.id;
                soundEngine.playChairSit();
                return {
                  ...player,
                  status: 'seated' as const,
                  x: bestChair.x,
                  y: bestChair.y,
                  assignedChairId: bestChair.id,
                  speechBubble: '😅',
                };
              }
            }

            // Step toward chair
            const step = Math.min(speed * dt, dist);
            const moveX = (dx / (dist || 1)) * step;
            const moveY = (dy / (dist || 1)) * step;

            return {
              ...player,
              x: player.x + moveX,
              y: player.y + moveY,
            };
          });

          // Check if all available chairs have been occupied
          const seatedCount = updatedPlayers.filter((p) => p.status === 'seated').length;
          const totalChairs = currentChairs.length;

          if (seatedCount >= totalChairs) {
            // Exactly 1 active player is left without a chair!
            const unseated = updatedPlayers.find(
              (p) => p.status !== 'eliminated' && p.status !== 'seated'
            );

            if (unseated && phase === 'HORN_SCRAMBLE') {
              handlePlayerElimination(unseated, updatedPlayers);
            }
          }

          return updatedPlayers;
        });

        return chairsUpdated;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [phase, isPaused]);

  /**
   * ELIMINATE A PLAYER & STRICT WINNER CHECK
   * In each round, eliminate exactly one player who fails to secure a chair.
   * Winner Trigger Condition: A winner must be declared ONLY when exactly 1 player remains active (Sole Survivor).
   * As soon as the final round ends and 1 player is left, freeze the game board and display a grand Winner Modal.
   */
  const handlePlayerElimination = (unseated: Player, currentPlayers: Player[]) => {
    const activePlayersBefore = currentPlayers.filter((p) => p.status !== 'eliminated');
    const remainingActiveCount = activePlayersBefore.length - 1;

    // Record round in history
    const rec: RoundRecord = {
      round,
      playerCount: activePlayersBefore.length,
      chairCount: chairs.length,
      eliminatedPlayerName: unseated.name,
      eliminatedPlayerNumber: unseated.number,
      eliminatedPlayerColor: unseated.color,
    };
    setRoundHistory((prev) => [...prev, rec]);

    // Update players state to mark unseated player as eliminated
    const updatedWithElimination = currentPlayers.map((p) =>
      p.id === unseated.id
        ? {
            ...p,
            status: 'eliminated' as const,
            eliminatedRound: round,
            speechBubble: '😢',
          }
        : p
    );

    // WINNER TRIGGER CONDITION:
    // A winner must be declared ONLY when exactly 1 player remains active (Sole Survivor)
    if (remainingActiveCount === 1) {
      // Find the single remaining active player who claimed the final chair
      const winner = updatedWithElimination.find(
        (p) => p.id !== unseated.id && p.status !== 'eliminated'
      );

      if (winner) {
        // Freeze game board, stop music, and trigger victory fanfare precisely on winner declaration
        soundEngine.stopMusic();
        soundEngine.playVictoryFanfare();

        const crownedWinner: Player = {
          ...winner,
          status: 'winner' as const,
          speechBubble: '👑',
        };

        setPlayers(
          updatedWithElimination.map((p) =>
            p.id === winner.id ? crownedWinner : p
          )
        );
        setEliminatedPlayer(null);
        setWinnerPlayer(crownedWinner);
        setPhase('GAME_OVER');
        setLiveMessage(
          `🎉 WINNER: ${winner.name.replace(/\s*\(You\)/i, '').toUpperCase()}! Sole Survivor of Round ${round}!`
        );
        return;
      }
    }

    // Normal round elimination: exactly one player eliminated, 2 or more players remain active
    soundEngine.playElimination();
    setPhase('ELIMINATION_SPOTLIGHT');
    setEliminatedPlayer(unseated);
    setPlayers(updatedWithElimination);
    setLiveMessage(`Round ${round}: ${unseated.name} did not find a chair and is eliminated!`);

    // Auto-advance countdown
    setAutoNextTimer(5);
  };

  /**
   * Countdown for auto-advancing to the next round
   */
  useEffect(() => {
    if (phase !== 'ELIMINATION_SPOTLIGHT') return;

    const timer = setInterval(() => {
      setAutoNextTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          prepareNextRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * REPEAT EACH ROUND & DECLARE WINNER (Requirement 6 & 7)
   */
  const prepareNextRound = () => {
    const activeRemaining = players.filter((p) => p.status !== 'eliminated');

    // If only 1 player remains, declare WINNER! (Requirement 7)
    if (activeRemaining.length === 1) {
      const winner = activeRemaining[0];
      soundEngine.stopMusic();
      soundEngine.playVictoryFanfare();
      setWinnerPlayer(winner);
      setPhase('GAME_OVER');
      setLiveMessage(`TOURNAMENT COMPLETE! ${winner.name} is the Musical Chairs Champion!`);
      return;
    }

    // Otherwise, arrange remaining chairs in a circle (1 fewer chair!)
    // Formula: Number of Chairs = Number of Players - 1
    const nextChairCount = activeRemaining.length - 1;
    const newChairs = buildChairsForActiveCount(activeRemaining.length);
    const chairRadius = newChairs.length > 1 ? newChairs[0].radius : 0;
    const rearrangedPlayers = arrangePlayersInCircle(players, chairRadius);

    setRound((r) => r + 1);
    setChairs(newChairs);
    setPlayers(rearrangedPlayers);
    setCountdown(TIMER_DURATION);
    setEliminatedPlayer(null);
    setPhase('ROUND_READY');
    setLiveMessage(
      `Round ${round + 1} Ready! ${activeRemaining.length} Players competing for ${nextChairCount} Chairs.`
    );
  };

  /**
   * Keyboard shortcuts (Space to start / rush to chair, Esc to pause)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (phase === 'ROUND_READY') {
          e.preventDefault();
          handleStartGame();
        } else if (phase === 'HORN_SCRAMBLE' && isUserPlaying) {
          e.preventDefault();
          handleUserRushChair();
        } else if (phase === 'ELIMINATION_SPOTLIGHT') {
          e.preventDefault();
          prepareNextRound();
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleTogglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isUserPlaying, handleUserRushChair]);

  const activePlayers = players.filter((p) => p.status !== 'eliminated');
  const userPlayer = players.find((p) => p.isUser);
  const userPlayerSeated = userPlayer?.status === 'seated';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 select-none font-sans">
      {/* Top Header & Branding */}
      <header className="w-full max-w-6xl flex items-center justify-between gap-4 py-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-950/50">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Musical Chairs Party</span>
              <span className="text-[11px] font-mono text-purple-400 font-semibold px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40">
                Live Arena
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {activePlayers.length} Players · {chairs.length} Chairs · One eliminated every round!
            </p>
          </div>
        </div>

        {/* Quick Rule Tag */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
            <span className="text-purple-400 font-bold">Rule:</span>
            <span>Chairs = Active Players − 1</span>
          </div>

          <button
            onClick={() => setIsSetupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span className="font-medium text-xs">Players ({initialPlayerCount})</span>
          </button>
        </div>
      </header>

      {/* Main Game Stage Layout */}
      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-5 items-start">
        {/* Left / Center: Interactive Arena & Controls */}
        <div className="w-full lg:flex-1 flex flex-col gap-4">
          {/* Status HUD (Rounds, Active Players, Chairs, 30s Countdown) */}
          <HUD
            round={round}
            remainingPlayersCount={activePlayers.length}
            remainingChairsCount={chairs.length}
            countdownSeconds={countdown}
            totalDuration={TIMER_DURATION}
            phase={phase}
            liveMessage={liveMessage}
          />

          {/* Elimination Announcement Alert */}
          {phase === 'ELIMINATION_SPOTLIGHT' && eliminatedPlayer && (
            <EliminationAlert
              eliminatedPlayer={eliminatedPlayer}
              round={round}
              remainingPlayers={activePlayers.length}
              remainingChairs={Math.max(1, activePlayers.length - 1)}
              onNextRound={prepareNextRound}
              autoNextTimer={autoNextTimer}
            />
          )}

          {/* Canvas Viewport */}
          <div className="relative w-full">
            <ArenaCanvas3D
              phase={phase}
              players={players}
              chairs={chairs}
              eliminatedPlayerId={eliminatedPlayer?.id || null}
              winnerPlayer={winnerPlayer}
              onChairClick={handleUserRushChair}
              beatPulse={beatPulse}
            />

            {/* Prompt for interactive human player during scramble */}
            {phase === 'HORN_SCRAMBLE' && isUserPlaying && !userPlayerSeated && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-sky-500 text-slate-950 font-black text-xs sm:text-sm rounded-full shadow-2xl animate-pulse pointer-events-none flex items-center gap-2">
                <span>⚡ PRESS SPACE OR CLICK ANY CHAIR TO SIT!</span>
              </div>
            )}
          </div>

          {/* Game Action Controls */}
          <GameControls
            phase={phase}
            isPaused={isPaused}
            onStartGame={handleStartGame}
            onTogglePause={handleTogglePause}
            onRestartGame={() => initGame(initialPlayerCount, isUserPlaying, userPlayerName)}
            onDropBeatEarly={handleDropBeatEarly}
            onUserRushChair={isUserPlaying ? () => handleUserRushChair() : undefined}
            onOpenSettings={() => setIsSetupModalOpen(true)}
            soundEnabled={soundEnabled}
            musicEnabled={musicEnabled}
            onToggleSound={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundEngine.setSoundEnabled(next);
            }}
            onToggleMusic={() => {
              const next = !musicEnabled;
              setMusicEnabled(next);
              soundEngine.setMusicEnabled(next);
            }}
            isUserPlaying={isUserPlaying}
            userPlayerSeated={userPlayerSeated}
          />
        </div>

        {/* Right Sidebar: Active Players Roster, Rules & Dugout */}
        <aside className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
          {/* Active Contestants Panel */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Contestants ({activePlayers.length})
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {chairs.length} Chairs
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {players.map((p) => {
                const isEliminated = p.status === 'eliminated';
                const isSeated = p.status === 'seated';

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                      isEliminated
                        ? 'bg-slate-950/40 border-slate-800/40 opacity-40'
                        : isSeated
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : p.isUser
                        ? 'bg-sky-950/40 border-sky-500/40 text-sky-200'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white/60 shrink-0"
                        style={{ backgroundColor: p.color }}
                      >
                        #{p.number}
                      </div>
                      <span className="font-semibold truncate max-w-[120px]">
                        {p.name}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono">
                      {isEliminated ? (
                        <span className="text-rose-400">Out (R{p.eliminatedRound})</span>
                      ) : isSeated ? (
                        <span className="text-emerald-400 font-bold">Seated ✓</span>
                      ) : phase === 'DANCING' ? (
                        <span className="text-purple-400 animate-pulse">Dancing ♫</span>
                      ) : (
                        <span className="text-slate-400">Ready</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How It Works & Game Rules Card */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col gap-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-slate-100 font-bold border-b border-slate-800 pb-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span>Musical Chairs Rules</span>
            </div>

            <ol className="space-y-1.5 list-decimal list-inside text-slate-400 leading-relaxed">
              <li>
                <strong className="text-slate-200">Arrange:</strong> 1 fewer chair than active players.
              </li>
              <li>
                <strong className="text-slate-200">Music Starts:</strong> 30s countdown while players dance.
              </li>
              <li>
                <strong className="text-slate-200">Horn Sounds:</strong> Music stops immediately at 0s.
              </li>
              <li>
                <strong className="text-slate-200">Scramble:</strong> Everyone rushes to claim a chair.
              </li>
              <li>
                <strong className="text-slate-200">Elimination:</strong> Player without a chair is removed.
              </li>
              <li>
                <strong className="text-slate-200">Repeat:</strong> Remove 1 chair until 1 Winner remains!
              </li>
            </ol>
          </div>

          {/* Tournament Elimination History */}
          {roundHistory.length > 0 && (
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col gap-2 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" /> Round History
              </span>
              <div className="space-y-1.5">
                {roundHistory.map((hist) => (
                  <div
                    key={hist.round}
                    className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-slate-300"
                  >
                    <span className="font-mono text-slate-400">Round {hist.round}</span>
                    <span className="text-rose-300 font-medium">
                      {hist.eliminatedPlayerName} eliminated
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* Setup Modal */}
      <PlayerSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        selectedCount={initialPlayerCount}
        onSelectCount={(count) => {
          setInitialPlayerCount(count);
          initGame(count, isUserPlaying, userPlayerName);
        }}
        isUserPlaying={isUserPlaying}
        onToggleUserPlaying={(enabled) => {
          setIsUserPlaying(enabled);
          initGame(initialPlayerCount, enabled, userPlayerName);
        }}
        userName={userPlayerName}
        onSaveUserName={handleSaveUserName}
        players={players}
        onConfirm={() => {
          setIsSetupModalOpen(false);
          initGame(initialPlayerCount, isUserPlaying, userPlayerName);
        }}
      />

      {/* Final Winner Modal (Requirement 7 & Feature Requirement) */}
      <WinnerModal
        winner={winnerPlayer}
        roundsCount={round}
        history={roundHistory}
        onPlayAgain={() => {
          setWinnerPlayer(null);
          initGame(initialPlayerCount, isUserPlaying, userPlayerName);
        }}
        onOpenSetup={() => {
          setWinnerPlayer(null);
          setIsSetupModalOpen(true);
        }}
      />
    </div>
  );
}
