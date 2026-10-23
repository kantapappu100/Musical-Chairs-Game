import { Player, PlayerAccessory } from '../types/game';

export interface PlayerPreset {
  name: string;
  color: string;
  secondaryColor: string;
  accessory: PlayerAccessory;
}

export const PLAYER_PRESETS: PlayerPreset[] = [
  { name: 'Alex', color: '#3B82F6', secondaryColor: '#1D4ED8', accessory: 'headphones' }, // Blue
  { name: 'Bella', color: '#EC4899', secondaryColor: '#BE185D', accessory: 'party-hat' },  // Pink
  { name: 'Charlie', color: '#10B981', secondaryColor: '#047857', accessory: 'cap' },       // Emerald
  { name: 'Daisy', color: '#F59E0B', secondaryColor: '#B45309', accessory: 'flower' },     // Amber
  { name: 'Ethan', color: '#8B5CF6', secondaryColor: '#6D28D9', accessory: 'sunglasses' }, // Purple
  { name: 'Fiona', color: '#EF4444', secondaryColor: '#B91C1C', accessory: 'bow' },        // Red
  { name: 'George', color: '#06B6D4', secondaryColor: '#0E7490', accessory: 'headphones' }, // Cyan
  { name: 'Hannah', color: '#14B8A6', secondaryColor: '#0F766E', accessory: 'party-hat' },  // Teal
  { name: 'Ian', color: '#F97316', secondaryColor: '#C2410C', accessory: 'cap' },          // Orange
  { name: 'Julia', color: '#6366F1', secondaryColor: '#4338CA', accessory: 'sunglasses' }, // Indigo
  { name: 'Kevin', color: '#84CC16', secondaryColor: '#4D7C0F', accessory: 'flower' },     // Lime
  { name: 'Luna', color: '#E11D48', secondaryColor: '#9F1239', accessory: 'bow' },         // Rose
];

export function generateInitialPlayers(
  count: number,
  userPlaysAsP1 = true,
  customUserName = 'Player 1'
): Player[] {
  const players: Player[] = [];
  const safeCount = Math.min(Math.max(count, 3), 10);
  const resolvedUserName = customUserName.trim() || 'Player 1';

  for (let i = 0; i < safeCount; i++) {
    const preset = PLAYER_PRESETS[i % PLAYER_PRESETS.length];
    const angle = (i / safeCount) * (Math.PI * 2);
    const isUser = userPlaysAsP1 && i === 0;

    players.push({
      id: `p-${i + 1}`,
      name: isUser ? resolvedUserName : preset.name,
      number: i + 1,
      color: preset.color,
      secondaryColor: preset.secondaryColor,
      accessory: preset.accessory,
      isUser,
      status: 'ready',
      eliminatedRound: null,
      angle,
      radius: 200, // starting perimeter distance
      x: 0,
      y: 0,
      assignedChairId: null,
      reactionDelayMs: isUser ? 0 : 80 + Math.random() * 220, // bots have natural human-like reaction time
      scrambleSpeed: 2.8 + Math.random() * 0.8,
      danceStep: Math.random() * 10,
      speechBubble: null,
    });
  }

  return players;
}
