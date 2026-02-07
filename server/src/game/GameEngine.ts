import type { ServerGameState, ServerPlayer, GameStateForPlayer, Card, CardType } from '../types.js';
import { createDeck, shuffleDeck, dealHands } from './Deck.js';
import {
  applyShadowStep,
  applyDarkVision,
  applyChaosShuffle,
  applyDoomDraw,
  applySoulSteal,
  applyCursedGift,
  handleDemonDraw,
  handleCounterSpell,
  handleReinsertDemon,
  eliminatePlayer,
  handlePairSteal,
  advanceToNextTurn,
} from './CardEffects.js';

const HEX_BLOCK_WINDOW_MS = 3000;

// Cards that can be hex-blocked (action cards targeting others)
const HEXABLE_CARDS: CardType[] = ['doom_draw', 'soul_steal', 'cursed_gift', 'chaos_shuffle'];

export class GameEngine {
  state: ServerGameState;

  constructor(roomCode: string, players: ServerPlayer[]) {
    this.state = {
      roomCode,
      phase: 'waiting',
      players,
      currentPlayerIndex: 0,
      deck: [],
      discardPile: [],
      turnNumber: 0,
      pendingAction: null,
      winner: null,
      message: 'Waiting for players...',
    };
  }

  startGame(): void {
    const deck = shuffleDeck(createDeck());
    const { hands, remainingDeck } = dealHands(deck, this.state.players.length);

    this.state.players.forEach((player, i) => {
      player.hand = hands[i];
      player.isAlive = true;
    });

    this.state.deck = remainingDeck;
    this.state.phase = 'playing';
    this.state.currentPlayerIndex = 0;
    this.state.turnNumber = 1;
    this.state.message = `${this.state.players[0].name}'s turn`;
  }

  getCurrentPlayer(): ServerPlayer {
    return this.state.players[this.state.currentPlayerIndex];
  }

  getPlayerById(id: string): ServerPlayer | undefined {
    return this.state.players.find(p => p.id === id);
  }

  /** Get sanitized state for a specific player */
  getStateForPlayer(playerId: string): GameStateForPlayer {
    const player = this.getPlayerById(playerId);

    return {
      roomCode: this.state.roomCode,
      phase: this.state.phase,
      players: this.state.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        handCount: p.hand.length,
        isAlive: p.isAlive,
        isHost: p.isHost,
        isConnected: p.isConnected,
      })),
      currentPlayerId: this.getCurrentPlayer().id,
      myHand: player?.hand ?? [],
      myId: playerId,
      deckCount: this.state.deck.length,
      discardPile: this.state.discardPile,
      turnNumber: this.state.turnNumber,
      pendingAction: this.getSanitizedPendingAction(playerId),
      winner: this.state.winner,
      message: this.state.message,
    };
  }

  private getSanitizedPendingAction(playerId: string) {
    const pa = this.state.pendingAction;
    if (!pa) return null;

    // Only show peeked cards to the player doing dark vision
    if (pa.type === 'dark_vision' && pa.sourcePlayerId !== playerId) {
      return { ...pa, peekedCards: undefined };
    }

    return pa;
  }

  /** Play a card from hand */
  playCard(
    playerId: string,
    cardId: string,
    targetPlayerId?: string,
    onHexWindowEnd?: () => void
  ): { success: boolean; error?: string } {
    const player = this.getPlayerById(playerId);
    if (!player) return { success: false, error: 'Player not found' };

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    if (this.state.phase !== 'playing') {
      return { success: false, error: 'Cannot play cards right now' };
    }

    // Find card in hand
    const cardIdx = player.hand.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return { success: false, error: 'Card not in hand' };

    const card = player.hand[cardIdx];

    // Can't play Demon's Bargain or Counter Spell directly
    if (card.type === 'demons_bargain') return { success: false, error: "Can't play Demon's Bargain" };
    if (card.type === 'counter_spell') return { success: false, error: "Counter Spell can only be used when drawing Demon's Bargain" };

    // Validate target requirement
    const needsTarget: CardType[] = ['doom_draw', 'soul_steal', 'cursed_gift'];
    if (needsTarget.includes(card.type) && !targetPlayerId) {
      // Enter target selection phase
      this.state.phase = 'target_select';
      this.state.pendingAction = {
        type: 'target_select',
        sourcePlayerId: playerId,
        cardType: card.type,
      };
      this.state.message = `${player.name} is choosing a target for ${card.name}...`;
      return { success: true };
    }

    // Remove card from hand
    player.hand.splice(cardIdx, 1);
    this.state.discardPile.push(card);

    // Check if this card is hexable — start hex window
    if (HEXABLE_CARDS.includes(card.type)) {
      const otherAlivePlayers = this.state.players.filter(p => p.isAlive && p.id !== playerId);
      const anyoneHasHexBlock = otherAlivePlayers.some(p => p.hand.some(c => c.type === 'hex_block'));

      if (anyoneHasHexBlock) {
        this.state.phase = 'hex_window';
        this.state.pendingAction = {
          type: 'hex_window',
          sourcePlayerId: playerId,
          targetPlayerId,
          cardType: card.type,
          hexDeadline: Date.now() + HEX_BLOCK_WINDOW_MS,
          respondedPlayers: [],
        };
        this.state.message = `${player.name} played ${card.name}! Others can Hex Block...`;

        // Set timeout to auto-resolve
        this.state.hexTimer = setTimeout(() => {
          this.resolveHexWindow();
          onHexWindowEnd?.();
        }, HEX_BLOCK_WINDOW_MS);

        return { success: true };
      }
    }

    // Apply effect immediately
    this.applyCardEffect(card.type, player, targetPlayerId);
    return { success: true };
  }

  /** Play a card that needs a target (after target selection) */
  playCardWithTarget(
    playerId: string,
    targetPlayerId: string,
    giftCardId?: string,
    onHexWindowEnd?: () => void
  ): { success: boolean; error?: string } {
    const pa = this.state.pendingAction;
    if (!pa || pa.type !== 'target_select' || pa.sourcePlayerId !== playerId) {
      return { success: false, error: 'No pending target selection' };
    }

    const player = this.getPlayerById(playerId)!;
    const target = this.getPlayerById(targetPlayerId);
    if (!target || !target.isAlive) return { success: false, error: 'Invalid target' };

    const cardType = pa.cardType!;

    // Find and remove the card from hand
    const cardIdx = player.hand.findIndex(c => c.type === cardType);
    if (cardIdx === -1) return { success: false, error: 'Card not in hand' };

    const card = player.hand.splice(cardIdx, 1)[0];
    this.state.discardPile.push(card);

    this.state.pendingAction = null;

    // Check hex window
    if (HEXABLE_CARDS.includes(cardType)) {
      const otherAlivePlayers = this.state.players.filter(p => p.isAlive && p.id !== playerId);
      const anyoneHasHexBlock = otherAlivePlayers.some(p => p.hand.some(c => c.type === 'hex_block'));

      if (anyoneHasHexBlock) {
        this.state.phase = 'hex_window';
        this.state.pendingAction = {
          type: 'hex_window',
          sourcePlayerId: playerId,
          targetPlayerId,
          cardType,
          hexDeadline: Date.now() + HEX_BLOCK_WINDOW_MS,
          respondedPlayers: [],
        };
        this.state.message = `${player.name} played ${card.name}! Others can Hex Block...`;

        this.state.hexTimer = setTimeout(() => {
          this.resolveHexWindow();
          onHexWindowEnd?.();
        }, HEX_BLOCK_WINDOW_MS);

        return { success: true };
      }
    }

    this.applyCardEffect(cardType, player, targetPlayerId, giftCardId);
    return { success: true };
  }

  private applyCardEffect(cardType: CardType, player: ServerPlayer, targetPlayerId?: string, giftCardId?: string): void {
    const target = targetPlayerId ? this.getPlayerById(targetPlayerId) : undefined;

    switch (cardType) {
      case 'shadow_step':
        applyShadowStep(this.state, player);
        break;
      case 'dark_vision':
        applyDarkVision(this.state, player);
        break;
      case 'chaos_shuffle':
        applyChaosShuffle(this.state, player);
        break;
      case 'doom_draw':
        if (target) applyDoomDraw(this.state, player, target);
        break;
      case 'soul_steal':
        if (target) applySoulSteal(this.state, player, target);
        break;
      case 'cursed_gift':
        if (target && giftCardId) {
          const giftCard = player.hand.find(c => c.id === giftCardId);
          if (giftCard) applyCursedGift(this.state, player, target, giftCard);
        } else if (target) {
          // Auto-pick a random card to gift
          if (player.hand.length > 0) {
            const randomIdx = Math.floor(Math.random() * player.hand.length);
            applyCursedGift(this.state, player, target, player.hand[randomIdx]);
          }
        }
        break;
      default:
        // Move to draw phase for unhandled
        this.state.phase = 'draw_phase';
    }
  }

  /** Draw a card from the deck */
  drawCard(playerId: string): { success: boolean; error?: string; drawnCard?: Card } {
    const player = this.getPlayerById(playerId);
    if (!player) return { success: false, error: 'Player not found' };

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    if (this.state.phase !== 'draw_phase' && this.state.phase !== 'playing') {
      return { success: false, error: 'Cannot draw right now' };
    }

    if (this.state.deck.length === 0) {
      // Reshuffle discard into deck
      if (this.state.discardPile.length === 0) {
        return { success: false, error: 'No cards left!' };
      }
      this.state.deck = shuffleDeck(this.state.discardPile);
      this.state.discardPile = [];
    }

    const card = this.state.deck.shift()!;

    // Check for Demon's Bargain
    if (card.type === 'demons_bargain') {
      handleDemonDraw(this.state, player, card);
      return { success: true, drawnCard: card };
    }

    player.hand.push(card);
    advanceToNextTurn(this.state);

    return { success: true, drawnCard: card };
  }

  /** Handle hex block response from a player */
  hexBlockResponse(playerId: string, useHexBlock: boolean, hexCardId?: string): void {
    const pa = this.state.pendingAction;
    if (!pa || pa.type !== 'hex_window') return;

    if (useHexBlock && hexCardId) {
      const player = this.getPlayerById(playerId);
      if (!player) return;

      const cardIdx = player.hand.findIndex(c => c.id === hexCardId && c.type === 'hex_block');
      if (cardIdx === -1) return;

      // Remove hex block from hand
      const hexCard = player.hand.splice(cardIdx, 1)[0];
      this.state.discardPile.push(hexCard);

      // Clear hex timer
      if (this.state.hexTimer) {
        clearTimeout(this.state.hexTimer);
        this.state.hexTimer = undefined;
      }

      // Block the action — move to draw phase
      this.state.message = `${player.name} used Hex Block to cancel the action!`;
      this.state.pendingAction = null;
      this.state.phase = 'draw_phase';
      return;
    }

    // Player passed
    if (!pa.respondedPlayers) pa.respondedPlayers = [];
    pa.respondedPlayers.push(playerId);

    // Check if all other alive players have responded
    const otherAlivePlayers = this.state.players.filter(
      p => p.isAlive && p.id !== pa.sourcePlayerId
    );
    if (pa.respondedPlayers.length >= otherAlivePlayers.length) {
      if (this.state.hexTimer) {
        clearTimeout(this.state.hexTimer);
        this.state.hexTimer = undefined;
      }
      this.resolveHexWindow();
    }
  }

  /** Resolve hex window (no one blocked) */
  private resolveHexWindow(): void {
    const pa = this.state.pendingAction;
    if (!pa || pa.type !== 'hex_window') return;

    const player = this.getPlayerById(pa.sourcePlayerId);
    if (!player) return;

    this.state.pendingAction = null;
    this.applyCardEffect(pa.cardType!, player, pa.targetPlayerId);
  }

  /** Handle counter spell response */
  counterSpellResponse(playerId: string, useCounterSpell: boolean, cardId?: string): void {
    if (this.state.phase !== 'demon_reveal') return;

    const player = this.getPlayerById(playerId);
    if (!player) return;

    if (useCounterSpell && cardId) {
      handleCounterSpell(this.state, player, cardId);
    } else {
      // Player is eliminated
      eliminatePlayer(this.state, player);
    }
  }

  /** Handle demon reinsert */
  reinsertDemon(position: number): void {
    if (this.state.phase !== 'counter_spell_reinsert') return;
    handleReinsertDemon(this.state, position);
  }

  /** Dark vision done */
  darkVisionDone(playerId: string): void {
    if (this.state.phase !== 'dark_vision') return;
    const pa = this.state.pendingAction;
    if (!pa || pa.sourcePlayerId !== playerId) return;

    this.state.pendingAction = null;
    this.state.phase = 'draw_phase';
    this.state.message = `${this.getPlayerById(playerId)?.name} finished peeking at the deck.`;
  }

  /** Pair steal action */
  pairSteal(
    playerId: string,
    card1Id: string,
    card2Id: string,
    targetPlayerId: string,
    requestedType: CardType
  ): { success: boolean; error?: string } {
    const player = this.getPlayerById(playerId);
    if (!player) return { success: false, error: 'Player not found' };

    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    if (this.state.phase !== 'playing') {
      return { success: false, error: 'Cannot play pairs right now' };
    }

    const target = this.getPlayerById(targetPlayerId);
    if (!target || !target.isAlive) return { success: false, error: 'Invalid target' };

    handlePairSteal(this.state, player, card1Id, card2Id, target, requestedType);
    this.state.phase = 'draw_phase';
    return { success: true };
  }

  /** Handle player disconnect */
  handleDisconnect(playerId: string): void {
    const player = this.getPlayerById(playerId);
    if (!player) return;

    player.isConnected = false;

    // Set 30s timer to eliminate
    player.disconnectTimer = setTimeout(() => {
      if (!player.isConnected && player.isAlive) {
        eliminatePlayer(this.state, player);
        this.state.message = `${player.name} was eliminated (disconnected)`;
      }
    }, 30000);
  }

  /** Handle player reconnect */
  handleReconnect(oldSocketId: string, newSocketId: string): boolean {
    const player = this.state.players.find(p => p.id === oldSocketId);
    if (!player) return false;

    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = undefined;
    }

    player.id = newSocketId;
    player.isConnected = true;
    return true;
  }
}
