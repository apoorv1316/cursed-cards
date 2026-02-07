import { writable, derived } from 'svelte/store';
import type { GameStateForPlayer, LobbyState, Card, Player } from '../game/types';

// Game state
export const gameState = writable<GameStateForPlayer | null>(null);
export const lobbyState = writable<LobbyState | null>(null);

// UI state
export const selectedCard = writable<Card | null>(null);
export const showCardDetail = writable(false);
export const previewHovered = writable(false);
export const showHowToPlay = writable(false);
export const notification = writable<string | null>(null);

// Derived stores
export const myHand = derived(gameState, ($gs) => $gs?.myHand ?? []);
export const isMyTurn = derived(gameState, ($gs) =>
  $gs ? $gs.currentPlayerId === $gs.myId : false
);
export const currentPlayer = derived(gameState, ($gs) => {
  if (!$gs) return null;
  return $gs.players.find(p => p.id === $gs.currentPlayerId) ?? null;
});
export const opponents = derived(gameState, ($gs) => {
  if (!$gs) return [];
  return $gs.players.filter(p => p.id !== $gs.myId);
});
export const alivePlayers = derived(gameState, ($gs) => {
  if (!$gs) return [];
  return $gs.players.filter(p => p.isAlive);
});
export const me = derived(gameState, ($gs) => {
  if (!$gs) return null;
  return $gs.players.find(p => p.id === $gs.myId) ?? null;
});
export const amAlive = derived(me, ($me) => $me?.isAlive ?? false);

export function showNotification(msg: string, duration = 3000) {
  notification.set(msg);
  setTimeout(() => notification.set(null), duration);
}

export function resetGameState() {
  gameState.set(null);
  lobbyState.set(null);
  selectedCard.set(null);
  showCardDetail.set(false);
}
