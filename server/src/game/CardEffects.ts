import type { ServerGameState, ServerPlayer, Card, CardType } from '../types.js';
import { shuffleDeck } from './Deck.js';

/**
 * Apply card effects. Returns updated game state and any messages.
 * Some effects change the phase (e.g., target_select, dark_vision).
 */

export function applyShadowStep(state: ServerGameState, player: ServerPlayer): ServerGameState {
  // Skip draw phase — just advance to next turn
  state.message = `${player.name} used Shadow Step — skipped their draw!`;
  advanceToNextTurn(state);
  return state;
}

export function applyDarkVision(state: ServerGameState, player: ServerPlayer): ServerGameState {
  const topCards = state.deck.slice(0, 3);
  state.phase = 'dark_vision';
  state.pendingAction = {
    type: 'dark_vision',
    sourcePlayerId: player.id,
    peekedCards: topCards,
  };
  state.message = `${player.name} is using Dark Vision...`;
  return state;
}

export function applyChaosShuffle(state: ServerGameState, player: ServerPlayer): ServerGameState {
  state.deck = shuffleDeck(state.deck);
  state.message = `${player.name} used Chaos Shuffle — the deck has been reshuffled!`;
  // Move to draw phase
  state.phase = 'draw_phase';
  return state;
}

export function applyDoomDraw(state: ServerGameState, _player: ServerPlayer, target: ServerPlayer): ServerGameState {
  // Force target to draw 2 cards
  let drawn = 0;
  for (let i = 0; i < 2; i++) {
    if (state.deck.length === 0) break;
    const card = state.deck.shift()!;

    // Check if drawn card is Demon's Bargain
    if (card.type === 'demons_bargain') {
      return handleDemonDraw(state, target, card);
    }

    target.hand.push(card);
    drawn++;
  }

  state.message = `${target.name} was forced to draw ${drawn} cards!`;
  state.phase = 'draw_phase';
  return state;
}

export function applySoulSteal(state: ServerGameState, player: ServerPlayer, target: ServerPlayer): ServerGameState {
  if (target.hand.length === 0) {
    state.message = `${target.name} has no cards to steal!`;
    state.phase = 'draw_phase';
    return state;
  }

  // Steal a random card
  const randomIndex = Math.floor(Math.random() * target.hand.length);
  const stolenCard = target.hand.splice(randomIndex, 1)[0];
  player.hand.push(stolenCard);

  state.message = `${player.name} stole a card from ${target.name}!`;
  state.phase = 'draw_phase';
  return state;
}

export function applyCursedGift(state: ServerGameState, player: ServerPlayer, target: ServerPlayer, giftCard: Card): ServerGameState {
  // Remove card from player's hand and give to target
  const idx = player.hand.findIndex(c => c.id === giftCard.id);
  if (idx === -1) {
    state.message = 'Card not found in hand!';
    return state;
  }

  player.hand.splice(idx, 1);
  target.hand.push(giftCard);

  state.message = `${player.name} gave a cursed gift to ${target.name}!`;
  state.phase = 'draw_phase';
  return state;
}

export function handleDemonDraw(state: ServerGameState, player: ServerPlayer, demonCard: Card): ServerGameState {
  // Check if player has Counter Spell
  const counterSpellIndex = player.hand.findIndex(c => c.type === 'counter_spell');

  state.phase = 'demon_reveal';
  state.pendingAction = {
    type: 'demon_reveal',
    sourcePlayerId: player.id,
    cardType: 'demons_bargain',
  };
  state.message = `${player.name} drew a Demon's Bargain!`;

  // Store the demon card temporarily in discard (will be moved if counter spelled)
  state.discardPile.push(demonCard);

  return state;
}

export function handleCounterSpell(state: ServerGameState, player: ServerPlayer, counterSpellCardId: string): ServerGameState {
  // Remove counter spell from hand
  const idx = player.hand.findIndex(c => c.id === counterSpellCardId);
  if (idx === -1) return state;

  const counterCard = player.hand.splice(idx, 1)[0];
  state.discardPile.push(counterCard);

  // Move to reinsert phase — player chooses where to put demon's bargain
  state.phase = 'counter_spell_reinsert';
  state.pendingAction = {
    type: 'counter_spell_reinsert',
    sourcePlayerId: player.id,
  };
  state.message = `${player.name} used Counter Spell! Choose where to reinsert the Demon's Bargain.`;

  return state;
}

export function handleReinsertDemon(state: ServerGameState, position: number): ServerGameState {
  // Find the demon's bargain in the discard pile (most recently added)
  const demonIdx = state.discardPile.findLastIndex(c => c.type === 'demons_bargain');
  if (demonIdx === -1) {
    advanceToNextTurn(state);
    return state;
  }

  const demonCard = state.discardPile.splice(demonIdx, 1)[0];

  // Clamp position
  const insertPos = Math.max(0, Math.min(position, state.deck.length));
  state.deck.splice(insertPos, 0, demonCard);

  state.message = `Demon's Bargain reinserted into the deck!`;
  advanceToNextTurn(state);
  return state;
}

export function eliminatePlayer(state: ServerGameState, player: ServerPlayer): ServerGameState {
  player.isAlive = false;

  // Discard their hand
  state.discardPile.push(...player.hand);
  player.hand = [];

  state.message = `${player.name} has been eliminated!`;

  // Check win condition
  const alivePlayers = state.players.filter(p => p.isAlive);
  if (alivePlayers.length === 1) {
    state.winner = alivePlayers[0].id;
    state.phase = 'game_over';
    state.message = `${alivePlayers[0].name} wins!`;
    return state;
  }

  advanceToNextTurn(state);
  return state;
}

export function handlePairSteal(
  state: ServerGameState,
  player: ServerPlayer,
  card1Id: string,
  card2Id: string,
  target: ServerPlayer,
  requestedType: CardType
): ServerGameState {
  // Validate pair
  const card1 = player.hand.find(c => c.id === card1Id);
  const card2 = player.hand.find(c => c.id === card2Id);

  if (!card1 || !card2 || card1.type !== card2.type) {
    state.message = 'Invalid pair!';
    return state;
  }

  // Discard the pair
  player.hand = player.hand.filter(c => c.id !== card1Id && c.id !== card2Id);
  state.discardPile.push(card1, card2);

  // Try to steal requested card type from target
  const targetCardIdx = target.hand.findIndex(c => c.type === requestedType);
  if (targetCardIdx !== -1) {
    const stolen = target.hand.splice(targetCardIdx, 1)[0];
    player.hand.push(stolen);
    state.message = `${player.name} used a pair to steal a ${stolen.name} from ${target.name}!`;
  } else {
    state.message = `${target.name} doesn't have that card type. Pair wasted!`;
  }

  return state;
}

export function advanceToNextTurn(state: ServerGameState): void {
  const alivePlayers = state.players.filter(p => p.isAlive);
  if (alivePlayers.length <= 1) {
    if (alivePlayers.length === 1) {
      state.winner = alivePlayers[0].id;
      state.phase = 'game_over';
      state.message = `${alivePlayers[0].name} wins!`;
    }
    return;
  }

  // Find next alive player
  let nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
  while (!state.players[nextIdx].isAlive) {
    nextIdx = (nextIdx + 1) % state.players.length;
  }

  state.currentPlayerIndex = nextIdx;
  state.turnNumber++;
  state.phase = 'playing';
  state.pendingAction = null;
  state.message = `${state.players[nextIdx].name}'s turn`;
}
