// Socket event name constants
export const EVENTS = {
  // Client → Server
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  START_GAME: 'start_game',
  PLAY_CARD: 'play_card',
  DRAW_CARD: 'draw_card',
  HEX_BLOCK_RESPONSE: 'hex_block_response',
  COUNTER_SPELL_RESPONSE: 'counter_spell_response',
  DARK_VISION_DONE: 'dark_vision_done',
  PAIR_STEAL: 'pair_steal',
  REINSERT_DEMON: 'reinsert_demon',

  // Server → Client
  ROOM_CREATED: 'room_created',
  LOBBY_UPDATE: 'lobby_update',
  GAME_STATE: 'game_state',
  ERROR: 'error',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  CARD_PLAYED: 'card_played',
  DEMON_DRAWN: 'demon_drawn',
  PLAYER_ELIMINATED: 'player_eliminated',
  COUNTER_SPELL_USED: 'counter_spell_used',
  HEX_BLOCK_USED: 'hex_block_used',
  GAME_OVER: 'game_over',
} as const;
