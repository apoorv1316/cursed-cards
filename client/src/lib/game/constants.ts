export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const AVATAR_ICONS = ['🧙', '🧹', '🔮', '💀'];
export const AVATAR_NAMES = ['Necromancer', 'Witch', 'Warlock', 'Lich'];
export const AVATAR_COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const CARD_TYPE_COLORS: Record<string, string> = {
  shadow_step: '#6B21A8',
  dark_vision: '#1D4ED8',
  chaos_shuffle: '#DC2626',
  doom_draw: '#B91C1C',
  hex_block: '#059669',
  soul_steal: '#7C3AED',
  cursed_gift: '#CA8A04',
  counter_spell: '#0EA5E9',
  demons_bargain: '#991B1B',
};
