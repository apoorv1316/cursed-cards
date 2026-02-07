// ============================================
// Cursed Cards — Shared Types
// ============================================

export type CardType =
  | 'shadow_step'
  | 'dark_vision'
  | 'chaos_shuffle'
  | 'doom_draw'
  | 'hex_block'
  | 'soul_steal'
  | 'cursed_gift'
  | 'counter_spell'
  | 'demons_bargain';

export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
  color: string; // border/accent color
}

export interface Player {
  id: string;
  name: string;
  avatar: number; // 0-3 avatar index
  handCount: number;
  isAlive: boolean;
  isHost: boolean;
  isConnected: boolean;
}

export interface PlayerPrivate extends Player {
  hand: Card[];
}

/** Game state sent to a specific player (they see their own hand, not others') */
export interface GameStateForPlayer {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  currentPlayerId: string;
  myHand: Card[];
  myId: string;
  deckCount: number;
  discardPile: Card[];
  turnNumber: number;
  pendingAction: PendingAction | null;
  winner: string | null; // player id
  message: string; // status message shown to all
}

export type GamePhase =
  | 'waiting'      // in lobby
  | 'playing'      // normal play
  | 'draw_phase'   // current player must draw
  | 'hex_window'   // waiting for hex block responses
  | 'demon_reveal' // demon's bargain was drawn
  | 'counter_spell_reinsert' // player choosing where to put demon's bargain back
  | 'target_select' // player choosing a target
  | 'dark_vision'  // player peeking at top 3
  | 'game_over';

export interface PendingAction {
  type: 'hex_window' | 'demon_reveal' | 'counter_spell_reinsert' | 'target_select' | 'dark_vision';
  sourcePlayerId: string;
  targetPlayerId?: string;
  cardType?: CardType;
  peekedCards?: Card[]; // for dark vision
  hexDeadline?: number; // timestamp
  respondedPlayers?: string[]; // players who passed on hex block
}

export interface LobbyState {
  roomCode: string;
  players: Player[];
  hostId: string;
}

// ============================================
// Socket Events
// ============================================

export interface ClientToServerEvents {
  'create_room': (data: { playerName: string }) => void;
  'join_room': (data: { roomCode: string; playerName: string }) => void;
  'start_game': () => void;
  'play_card': (data: { cardId: string; targetPlayerId?: string }) => void;
  'draw_card': () => void;
  'hex_block_response': (data: { useHexBlock: boolean; cardId?: string }) => void;
  'counter_spell_response': (data: { useCounterSpell: boolean; cardId?: string; reinsertPosition?: number }) => void;
  'dark_vision_done': () => void;
  'pair_steal': (data: { cardId1: string; cardId2: string; targetPlayerId: string; requestedCardType: CardType }) => void;
  'reinsert_demon': (data: { position: number }) => void;
}

export interface ServerToClientEvents {
  'room_created': (data: { roomCode: string }) => void;
  'lobby_update': (data: LobbyState) => void;
  'game_state': (data: GameStateForPlayer) => void;
  'error': (data: { message: string }) => void;
  'player_joined': (data: { playerName: string }) => void;
  'player_left': (data: { playerName: string }) => void;
  'card_played': (data: { playerName: string; card: Card }) => void;
  'demon_drawn': (data: { playerId: string; playerName: string }) => void;
  'player_eliminated': (data: { playerId: string; playerName: string }) => void;
  'counter_spell_used': (data: { playerName: string }) => void;
  'hex_block_used': (data: { blockerName: string; blockedAction: string }) => void;
  'game_over': (data: { winnerId: string; winnerName: string }) => void;
}
