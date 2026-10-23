import React, { useEffect, useRef } from 'react';
import { Player, Chair, GamePhase } from '../types/game';

interface ArenaCanvasProps {
  phase: GamePhase;
  players: Player[];
  chairs: Chair[];
  eliminatedPlayerId: string | null;
  winnerPlayer: Player | null;
  onChairClick?: (chairId: string) => void;
  onPlayerClick?: (player: Player) => void;
  beatPulse?: number; // 0 to 1 pulsating with music
}

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({
  phase,
  players,
  chairs,
  eliminatedPlayerId,
  winnerPlayer,
  onChairClick,
  beatPulse = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep references to mutable rendering states for smooth 60fps animations
  const animStateRef = useRef<{
    time: number;
    particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
      life: number;
      type: 'note' | 'dust' | 'sparkle' | 'poof';
    }>;
  }>({
    time: 0,
    particles: [],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;
      animStateRef.current.time += dt;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // --- 1. ARENA DANCE FLOOR BACKGROUND ---
      // Luxury dark oak / ballroom party parquet floor with radial gradient
      const baseFloorGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        40,
        centerX,
        centerY,
        Math.max(width, height) * 0.65
      );
      baseFloorGrad.addColorStop(0, '#2D1B36'); // Vibrant deep disco plum center
      baseFloorGrad.addColorStop(0.5, '#1B1429');
      baseFloorGrad.addColorStop(1, '#0F0B18');
      ctx.fillStyle = baseFloorGrad;
      ctx.fillRect(0, 0, width, height);

      // Radial dance rings that pulse to the music beat
      const baseRingRadius = Math.min(width, height) * 0.38;
      const pulseExpand = (beatPulse || 0) * 12;

      ctx.save();
      // Outer dance track boundary ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRingRadius + pulseExpand + 40, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 + (beatPulse || 0) * 0.15})`;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 12]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner chair boundary ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 135, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center decorative floor decal (Musical Notes / Vinyl motif)
      ctx.beginPath();
      ctx.arc(centerX, centerY, 44, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 11, 24, 0.85)';
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center musical icon
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♫', centerX, centerY - 2);

      // Stage ambient lighting sweeps
      const lightSweepAngle = animStateRef.current.time * 0.8;
      const spotGrad = ctx.createRadialGradient(
        centerX + Math.cos(lightSweepAngle) * 160,
        centerY + Math.sin(lightSweepAngle) * 160,
        10,
        centerX,
        centerY,
        280
      );
      spotGrad.addColorStop(0, 'rgba(236, 72, 153, 0.15)');
      spotGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRingRadius + 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- 2. UPDATE & DRAW PARTICLES (Notes, Dust, Confetti) ---
      // Spawn musical notes when dancing
      if (phase === 'DANCING' && Math.random() < 0.25) {
        const randPlayer = players.find((p) => p.status === 'dancing');
        if (randPlayer) {
          animStateRef.current.particles.push({
            x: randPlayer.x + (Math.random() - 0.5) * 20,
            y: randPlayer.y - 25,
            vx: (Math.random() - 0.5) * 25,
            vy: -40 - Math.random() * 30,
            color: ['#F472B6', '#60A5FA', '#FBBF24', '#34D399'][Math.floor(Math.random() * 4)],
            size: 14 + Math.random() * 6,
            alpha: 1,
            life: 1.2,
            type: 'note',
          });
        }
      }

      // Spawn dust when scrambling
      if (phase === 'HORN_SCRAMBLE' && Math.random() < 0.5) {
        players.forEach((p) => {
          if (p.status === 'scrambling') {
            animStateRef.current.particles.push({
              x: p.x + (Math.random() - 0.5) * 16,
              y: p.y + 12 + (Math.random() - 0.5) * 8,
              vx: (Math.random() - 0.5) * 20,
              vy: (Math.random() - 0.5) * 20,
              color: '#D4D4D8',
              size: 4 + Math.random() * 5,
              alpha: 0.7,
              life: 0.6,
              type: 'dust',
            });
          }
        });
      }

      // Render & decay particles
      const particles = animStateRef.current.particles;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life);

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.type === 'note') {
          ctx.font = `${p.size}px sans-serif`;
          ctx.fillStyle = p.color;
          ctx.textAlign = 'center';
          ctx.fillText('♪', p.x, p.y);
        } else if (p.type === 'dust') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        } else if (p.type === 'sparkle') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
        ctx.restore();
      }

      // --- 3. RENDER CHAIRS (In circular formation) ---
      chairs.forEach((chair) => {
        if (chair.isRemoving) return;

        ctx.save();
        ctx.translate(chair.x, chair.y);

        // Chair drop shadow
        ctx.beginPath();
        ctx.ellipse(0, 14, 22, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();

        // Check if occupied
        const isOccupied = !!chair.occupiedByPlayerId;

        // Chair legs (4 small stylized pegs)
        ctx.fillStyle = '#78350F'; // Dark walnut wood
        ctx.fillRect(-14, 4, 4, 12);
        ctx.fillRect(10, 4, 4, 12);
        ctx.fillRect(-12, -4, 3, 10);
        ctx.fillRect(9, -4, 3, 10);

        // Seat cushion
        const seatGrad = ctx.createLinearGradient(-16, -14, 16, 14);
        if (isOccupied) {
          seatGrad.addColorStop(0, '#10B981'); // Friendly green when occupied
          seatGrad.addColorStop(1, '#059669');
        } else {
          // Warm glowing unoccupied velvet chair cushion
          seatGrad.addColorStop(0, chair.color || '#F59E0B');
          seatGrad.addColorStop(1, '#D97706');
        }

        // Seat base
        ctx.beginPath();
        ctx.roundRect(-18, -14, 36, 28, 8);
        ctx.fillStyle = seatGrad;
        ctx.fill();
        ctx.lineWidth = isOccupied ? 2 : 3;
        ctx.strokeStyle = isOccupied ? '#34D399' : '#FEF3C7';
        ctx.stroke();

        // Chair backrest (rotated towards the center or outward)
        // Backrest positioned along angle
        ctx.save();
        ctx.rotate(chair.angle - Math.PI / 2); // face outwards
        ctx.beginPath();
        ctx.roundRect(-16, -20, 32, 9, 4);
        ctx.fillStyle = '#92400E';
        ctx.fill();
        ctx.strokeStyle = '#FEF3C7';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Little backrest slats
        ctx.fillStyle = '#B45309';
        ctx.fillRect(-8, -11, 4, 8);
        ctx.fillRect(4, -11, 4, 8);
        ctx.restore();

        // Chair number badge
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${chair.index + 1}`, 0, 0);

        // Unoccupied indicator pulse during scramble
        if (!isOccupied && phase === 'HORN_SCRAMBLE') {
          const pulse = Math.sin(animStateRef.current.time * 12) * 4;
          ctx.beginPath();
          ctx.arc(0, 0, 22 + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.restore();
      });

      // --- 4. RENDER ELIMINATED BENCH / SPECTATOR ROW ---
      // Draw bleachers / spectator bench on the bottom-right or bottom-left of arena
      const eliminatedPlayers = players.filter((p) => p.status === 'eliminated');
      if (eliminatedPlayers.length > 0) {
        ctx.save();
        const benchX = 40;
        const benchY = height - 52;
        const benchWidth = Math.max(160, eliminatedPlayers.length * 38 + 30);

        // Bench background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.beginPath();
        ctx.roundRect(benchX, benchY - 14, benchWidth, 48, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('CHEERING DUGOUT', benchX + 10, benchY - 2);

        // Render mini eliminated players on the bench cheering!
        eliminatedPlayers.forEach((ep, idx) => {
          const px = benchX + 24 + idx * 36;
          const py = benchY + 18;
          drawMiniCheerer(ctx, ep, px, py, animStateRef.current.time + idx);
        });
        ctx.restore();
      }

      // --- 5. RENDER ACTIVE PLAYERS ---
      // Sort players by Y so those in foreground render on top
      const sortedActivePlayers = [...players]
        .filter((p) => p.status !== 'eliminated')
        .sort((a, b) => a.y - b.y);

      sortedActivePlayers.forEach((player) => {
        drawPlayer(
          ctx,
          player,
          phase,
          eliminatedPlayerId,
          winnerPlayer,
          animStateRef.current.time
        );
      });

      // --- 6. DRAMATIC ELIMINATION SPOTLIGHT ---
      if (phase === 'ELIMINATION_SPOTLIGHT' && eliminatedPlayerId) {
        const eliminatedPlayer = players.find((p) => p.id === eliminatedPlayerId);
        if (eliminatedPlayer) {
          ctx.save();
          // Darken the rest of the arena
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.fillRect(0, 0, width, height);

          // Clear spotlight on eliminated player
          ctx.globalCompositeOperation = 'destination-out';
          const spot = ctx.createRadialGradient(
            eliminatedPlayer.x,
            eliminatedPlayer.y,
            10,
            eliminatedPlayer.x,
            eliminatedPlayer.y,
            90
          );
          spot.addColorStop(0, 'rgba(0,0,0,1)');
          spot.addColorStop(0.7, 'rgba(0,0,0,0.85)');
          spot.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = spot;
          ctx.beginPath();
          ctx.arc(eliminatedPlayer.x, eliminatedPlayer.y, 90, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalCompositeOperation = 'source-over';

          // Golden spotlight ring
          ctx.beginPath();
          ctx.arc(eliminatedPlayer.x, eliminatedPlayer.y, 45, 0, Math.PI * 2);
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Redraw eliminated player crisp on top
          drawPlayer(
            ctx,
            eliminatedPlayer,
            phase,
            eliminatedPlayerId,
            winnerPlayer,
            animStateRef.current.time
          );

          // Sad / funny speech bubble
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.roundRect(eliminatedPlayer.x - 70, eliminatedPlayer.y - 75, 140, 32, 8);
          ctx.fill();
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Bubble tail
          ctx.beginPath();
          ctx.moveTo(eliminatedPlayer.x - 6, eliminatedPlayer.y - 43);
          ctx.lineTo(eliminatedPlayer.x, eliminatedPlayer.y - 32);
          ctx.lineTo(eliminatedPlayer.x + 6, eliminatedPlayer.y - 43);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          ctx.fillStyle = '#991B1B';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText("Aw no chair for me! 😅", eliminatedPlayer.x, eliminatedPlayer.y - 54);

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [phase, players, chairs, eliminatedPlayerId, winnerPlayer, beatPulse]);

  // Handle canvas clicks (e.g., clicking on a chair to scramble to it when playing as user)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onChairClick) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if clicked near any chair
    for (const chair of chairs) {
      const dist = Math.hypot(chair.x - clickX, chair.y - clickY);
      if (dist <= 35) {
        onChairClick(chair.id);
        break;
      }
    }
  };

  return (
    <div className="relative w-full aspect-square max-w-[680px] mx-auto flex items-center justify-center rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950">
      <canvas
        ref={canvasRef}
        width={720}
        height={720}
        onClick={handleCanvasClick}
        className="w-full h-full object-contain cursor-pointer select-none"
      />
    </div>
  );
};

/**
 * Draws an active player on the arena dance floor
 */
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  phase: GamePhase,
  eliminatedPlayerId: string | null,
  winnerPlayer: Player | null,
  time: number
) {
  ctx.save();

  const isEliminated = player.id === eliminatedPlayerId;
  const isWinner = winnerPlayer?.id === player.id;
  const isSeated = player.status === 'seated';

  // Bounce bob for dance movement
  let bounceY = 0;
  if (player.status === 'dancing') {
    bounceY = -Math.abs(Math.sin(time * 8 + player.danceStep)) * 8;
  } else if (player.status === 'scrambling') {
    bounceY = -Math.abs(Math.sin(time * 16)) * 6;
  }

  const px = player.x;
  const py = player.y + bounceY;

  // Drop Shadow
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 16, 16, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fill();

  // If Player 1 is the user, highlight with a glowing marker ring
  if (player.isUser) {
    ctx.beginPath();
    ctx.arc(px, py + 16, 20, 0, Math.PI * 2);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // "YOU" tag above player
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.roundRect(px - 18, py - 38, 36, 14, 4);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU', px, py - 31);
  }

  // Player Body (Round cute bean/avatar style)
  const bodyGrad = ctx.createRadialGradient(
    px - 4,
    py - 4,
    3,
    px,
    py,
    22
  );
  bodyGrad.addColorStop(0, player.color);
  bodyGrad.addColorStop(1, player.secondaryColor);

  ctx.beginPath();
  ctx.arc(px, py, 18, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  // Expressive Eyes
  const eyeOffset = player.status === 'scrambling' ? 2 : 0;
  ctx.fillStyle = '#FFFFFF';

  if (isEliminated) {
    // X_X eyes or sad teary eyes
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    // Left eye X
    ctx.beginPath();
    ctx.moveTo(px - 9, py - 4);
    ctx.lineTo(px - 3, py + 2);
    ctx.moveTo(px - 3, py - 4);
    ctx.lineTo(px - 9, py + 2);
    ctx.stroke();
    // Right eye X
    ctx.beginPath();
    ctx.moveTo(px + 3, py - 4);
    ctx.lineTo(px + 9, py + 2);
    ctx.moveTo(px + 9, py - 4);
    ctx.lineTo(px + 3, py + 2);
    ctx.stroke();
  } else if (player.status === 'scrambling') {
    // Wide panicked scrambler eyes
    ctx.beginPath();
    ctx.arc(px - 6, py - 2 + eyeOffset, 4, 0, Math.PI * 2);
    ctx.arc(px + 6, py - 2 + eyeOffset, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(px - 5, py - 2 + eyeOffset, 2, 0, Math.PI * 2);
    ctx.arc(px + 7, py - 2 + eyeOffset, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Happy dancing / seated eyes
    ctx.beginPath();
    ctx.arc(px - 6, py - 2, 3.5, 0, Math.PI * 2);
    ctx.arc(px + 6, py - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(px - 5, py - 2, 1.8, 0, Math.PI * 2);
    ctx.arc(px + 7, py - 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smile / Mouth
  ctx.beginPath();
  if (isEliminated) {
    // Downwards wavy mouth
    ctx.arc(px, py + 10, 5, Math.PI * 1.1, Math.PI * 1.9, false);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  } else if (player.status === 'scrambling') {
    // O-shaped gasp mouth :O
    ctx.arc(px, py + 7, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#991B1B';
    ctx.fill();
  } else {
    // Cheerful smile :)
    ctx.arc(px, py + 3, 5, 0.1, Math.PI - 0.1, false);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Accessories (hats, headphones, sunglasses, crown)
  drawAccessory(ctx, player.accessory, px, py - 14, isWinner);

  // Winner Crown & Radiant Victory Aura
  if (isWinner) {
    ctx.beginPath();
    ctx.arc(px, py, 26, 0, Math.PI * 2);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑', px, py - 28);
  }

  // Player Name and Number Pill
  const labelText = player.name;
  ctx.font = 'bold 9px sans-serif';
  const textWidth = ctx.measureText(labelText).width;
  const pillWidth = Math.max(52, textWidth + 14);

  ctx.fillStyle = player.isUser ? '#0284C7' : 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(px - pillWidth / 2, py + 22, pillWidth, 15, 7);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, px, py + 29);

  // Seated icon confirmation
  if (isSeated) {
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(px + 14, py - 10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', px + 14, py - 10);
  }

  ctx.restore();
}

/**
 * Draws character accessories (sunglasses, headphones, party hats, bows)
 */
function drawAccessory(
  ctx: CanvasRenderingContext2D,
  accessory: string,
  x: number,
  y: number,
  isWinner: boolean
) {
  ctx.save();
  if (accessory === 'sunglasses') {
    // Cool retro shades
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.roundRect(x - 12, y + 8, 10, 6, 2);
    ctx.roundRect(x + 2, y + 8, 10, 6, 2);
    ctx.fill();
    ctx.fillRect(x - 2, y + 10, 4, 2); // bridge
  } else if (accessory === 'party-hat') {
    // Party cone hat
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x - 8, y + 2);
    ctx.lineTo(x + 8, y + 2);
    ctx.closePath();
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pom pom on top
    ctx.beginPath();
    ctx.arc(x, y - 11, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#EC4899';
    ctx.fill();
  } else if (accessory === 'headphones') {
    // DJ headphones band and earcups
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y + 8, 14, Math.PI, 0, false);
    ctx.stroke();

    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.roundRect(x - 18, y + 5, 5, 10, 2);
    ctx.roundRect(x + 13, y + 5, 5, 10, 2);
    ctx.fill();
  } else if (accessory === 'cap') {
    // Baseball cap
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(x, y + 4, 12, Math.PI, 0, false);
    ctx.fill();
    // Cap visor
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 5, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (accessory === 'bow') {
    // Pink ribbon bow
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.ellipse(x - 6, y + 3, 6, 4, -0.3, 0, Math.PI * 2);
    ctx.ellipse(x + 6, y + 3, 6, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y + 3, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#DB2777';
    ctx.fill();
  } else if (accessory === 'flower') {
    // Cute daisy flower
    ctx.fillStyle = '#FEF08A';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + 7 + Math.cos(angle) * 4, y + 3 + Math.sin(angle) * 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x + 7, y + 3, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws a mini cheering eliminated player sitting on the dugout bench
 */
function drawMiniCheerer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  x: number,
  y: number,
  time: number
) {
  ctx.save();
  const hop = -Math.abs(Math.sin(time * 6)) * 4;

  ctx.beginPath();
  ctx.arc(x, y + hop, 11, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cheering eyes and smile
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(x - 3, y + hop - 1, 1.5, 0, Math.PI * 2);
  ctx.arc(x + 3, y + hop - 1, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y + hop + 2, 3, 0, Math.PI);
  ctx.stroke();

  // Mini flag waving
  ctx.fillStyle = '#FBBF24';
  ctx.fillRect(x + 8, y + hop - 8, 6, 4);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + hop + 2);
  ctx.lineTo(x + 8, y + hop - 8);
  ctx.stroke();

  ctx.restore();
}
