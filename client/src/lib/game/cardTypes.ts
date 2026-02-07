import type { CardType } from './types';

export interface CardTypeInfo {
  type: CardType;
  name: string;
  description: string;
  color: string;
  icon: string;
  category: 'action' | 'defense' | 'danger';
}

export const CARD_INFO: Record<CardType, CardTypeInfo> = {
  shadow_step: {
    type: 'shadow_step',
    name: 'Shadow Step',
    description: 'Skip your draw phase this turn. End your turn safely.',
    color: '#6B21A8',
    icon: '👣',
    category: 'defense',
  },
  dark_vision: {
    type: 'dark_vision',
    name: 'Dark Vision',
    description: 'Peek at the top 3 cards of the deck.',
    color: '#1D4ED8',
    icon: '👁',
    category: 'action',
  },
  chaos_shuffle: {
    type: 'chaos_shuffle',
    name: 'Chaos Shuffle',
    description: 'Shuffle the entire deck.',
    color: '#DC2626',
    icon: '🌀',
    category: 'action',
  },
  doom_draw: {
    type: 'doom_draw',
    name: 'Doom Draw',
    description: 'Force another player to draw 2 cards immediately.',
    color: '#B91C1C',
    icon: '⚡',
    category: 'action',
  },
  hex_block: {
    type: 'hex_block',
    name: 'Hex Block',
    description: "Cancel any action card played by another player.",
    color: '#059669',
    icon: '🛡',
    category: 'defense',
  },
  soul_steal: {
    type: 'soul_steal',
    name: 'Soul Steal',
    description: "Steal a random card from another player's hand.",
    color: '#7C3AED',
    icon: '👻',
    category: 'action',
  },
  cursed_gift: {
    type: 'cursed_gift',
    name: 'Cursed Gift',
    description: 'Give one of your cards to another player.',
    color: '#CA8A04',
    icon: '🎁',
    category: 'action',
  },
  counter_spell: {
    type: 'counter_spell',
    name: 'Counter Spell',
    description: "When you draw a Demon's Bargain, play this to survive and reinsert it into the deck.",
    color: '#0EA5E9',
    icon: '✨',
    category: 'defense',
  },
  demons_bargain: {
    type: 'demons_bargain',
    name: "Demon's Bargain",
    description: "If you draw this and can't Counter Spell, you are eliminated!",
    color: '#991B1B',
    icon: '😈',
    category: 'danger',
  },
};
