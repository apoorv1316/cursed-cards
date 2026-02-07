import type { Card, CardType } from '../types.js';

let cardIdCounter = 0;

interface CardTemplate {
  type: CardType;
  name: string;
  description: string;
  color: string;
  count: number;
}

const CARD_TEMPLATES: CardTemplate[] = [
  {
    type: 'shadow_step',
    name: 'Shadow Step',
    description: 'Skip your draw phase this turn. End your turn safely.',
    color: '#6B21A8', // purple
    count: 6,
  },
  {
    type: 'dark_vision',
    name: 'Dark Vision',
    description: 'Peek at the top 3 cards of the deck.',
    color: '#1D4ED8', // blue
    count: 4,
  },
  {
    type: 'chaos_shuffle',
    name: 'Chaos Shuffle',
    description: 'Shuffle the entire deck.',
    color: '#DC2626', // red
    count: 4,
  },
  {
    type: 'doom_draw',
    name: 'Doom Draw',
    description: 'Force another player to draw 2 cards immediately.',
    color: '#B91C1C', // dark red
    count: 4,
  },
  {
    type: 'hex_block',
    name: 'Hex Block',
    description: 'Cancel any action card played by another player.',
    color: '#059669', // green
    count: 5,
  },
  {
    type: 'soul_steal',
    name: 'Soul Steal',
    description: 'Steal a random card from another player\'s hand.',
    color: '#7C3AED', // violet
    count: 4,
  },
  {
    type: 'cursed_gift',
    name: 'Cursed Gift',
    description: 'Give one of your cards to another player.',
    color: '#CA8A04', // yellow/gold
    count: 4,
  },
  {
    type: 'counter_spell',
    name: 'Counter Spell',
    description: 'When you draw a Demon\'s Bargain, play this to survive and reinsert it into the deck.',
    color: '#0EA5E9', // sky blue
    count: 5,
  },
  {
    type: 'demons_bargain',
    name: "Demon's Bargain",
    description: 'If you draw this and can\'t Counter Spell, you are eliminated!',
    color: '#991B1B', // deep red
    count: 4,
  },
];

function createCard(type: CardType, name: string, description: string, color: string): Card {
  return {
    id: `card_${++cardIdCounter}`,
    type,
    name,
    description,
    color,
  };
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const template of CARD_TEMPLATES) {
    for (let i = 0; i < template.count; i++) {
      deck.push(createCard(template.type, template.name, template.description, template.color));
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal initial hands. Each player gets 7 cards with at least 1 Counter Spell guaranteed.
 * Demon's Bargain cards are removed before dealing and reinserted after.
 */
export function dealHands(deck: Card[], playerCount: number): { hands: Card[][]; remainingDeck: Card[] } {
  // Separate demon's bargain cards
  const demons = deck.filter(c => c.type === 'demons_bargain');
  let pool = shuffleDeck(deck.filter(c => c.type !== 'demons_bargain'));

  // Pull out counter spells to guarantee one per player
  const counterSpells: Card[] = [];
  const rest: Card[] = [];
  for (const card of pool) {
    if (card.type === 'counter_spell' && counterSpells.length < playerCount) {
      counterSpells.push(card);
    } else {
      rest.push(card);
    }
  }

  // Shuffle the remaining pool
  const drawPool = shuffleDeck(rest);

  const hands: Card[][] = [];
  for (let p = 0; p < playerCount; p++) {
    const hand: Card[] = [];

    // Guarantee 1 counter spell
    if (counterSpells.length > 0) {
      hand.push(counterSpells.pop()!);
    }

    // Fill rest from draw pool
    while (hand.length < 7 && drawPool.length > 0) {
      hand.push(drawPool.pop()!);
    }

    hands.push(hand);
  }

  // Remaining deck = undealt draw pool cards + any extra counter spells + demons, then shuffle
  const remainingDeck = shuffleDeck([...drawPool, ...counterSpells, ...demons]);

  return { hands, remainingDeck };
}

export function getCardTemplate(type: CardType): CardTemplate | undefined {
  return CARD_TEMPLATES.find(t => t.type === type);
}

// Total: 6+4+4+4+5+4+4+5+4 = 40 cards
