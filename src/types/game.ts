export type PlayerAccessory =
  | 'party-hat'
  | 'sunglasses'
  | 'headphones'
  | 'cap'
  | 'bow'
  | 'flower'
  | 'crown';

export type PlayerStatus =
  | 'ready'
  | 'dancing'
  | 'scrambling'
  | 'seated'
  | 'eliminated'
  | 'winner';

export interface Player {
  id: string;
  name: string;
  number: number;
  color: string;
  secondaryColor: string;
  accessory: PlayerAccessory;
  isUser: boolean;
  status: PlayerStatus;
  eliminatedRound: number | null;
  angle: number; // in radians along circular perimeter
  radius: number; // distance from arena center
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  assignedChairId: string | null;
  reactionDelayMs: number; // AI reaction time before scrambling
  scrambleSpeed: number; // scramble velocity
  danceStep: number;
  speechBubble?: string | null;
}

export interface Chair {
  id: string;
  index: number;
  angle: number; // in radians
  radius: number;
  x: number;
  y: number;
  occupiedByPlayerId: string | null;
  isRemoving?: boolean;
  color: string;
}

export type GamePhase =
  | 'SETUP'                 // Choosing player count, previewing circular layout
  | 'ROUND_READY'          // Round ready, waiting for "Start Game" or countdown
  | 'DANCING'              // Music playing! Countdown active (30s). Players moving around chairs
  | 'HORN_SCRAMBLE'        // Timer 0! Horn blasts, music cuts, players rush to chairs
  | 'ELIMINATION_SPOTLIGHT'// Spotlight on the 1 player without chair, dramatic announcement
  | 'CHAIR_REMOVAL'        // 1 chair removed, circle reconfigures smoothly
  | 'GAME_OVER';           // 1 winner left! Confetti, fanfare, podium

export interface RoundRecord {
  round: number;
  playerCount: number;
  chairCount: number;
  eliminatedPlayerName: string;
  eliminatedPlayerNumber: number;
  eliminatedPlayerColor: string;
}
