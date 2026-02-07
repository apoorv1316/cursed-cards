// ============================================
// Cursed Cards — Server Types (includes shared types)
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
  color: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: number;
  handCount: number;
  isAlive: boolean;
  isHost: boolean;
  isConnected: boolean;
}

export type GamePhase =
  | 'waiting'
  | 'playing'
  | 'draw_phase'
  | 'hex_window'
  | 'demon_reveal'
  | 'counter_spell_reinsert'
  | 'target_select'
  | 'dark_vision'
  | 'game_over';

export interface PendingAction {
  type: 'hex_window' | 'demon_reveal' | 'counter_spell_reinsert' | 'target_select' | 'dark_vision';
  sourcePlayerId: string;
  targetPlayerId?: string;
  cardType?: CardType;
  peekedCards?: Card[];
  hexDeadline?: number;
  respondedPlayers?: string[];
}

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
  winner: string | null;
  message: string;
}

export interface LobbyState {
  roomCode: string;
  players: Player[];
  hostId: string;
}

/** Server-side player with full hand info */
export interface ServerPlayer {
  id: string;
  name: string;
  avatar: number;
  hand: Card[];
  isAlive: boolean;
  isHost: boolean;
  isConnected: boolean;
  disconnectTimer?: ReturnType<typeof setTimeout>;
}

export interface ServerGameState {
  roomCode: string;
  phase: GamePhase;
  players: ServerPlayer[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  turnNumber: number;
  pendingAction: PendingAction | null;
  winner: string | null;
  message: string;
  hexTimer?: ReturnType<typeof setTimeout>;
}
