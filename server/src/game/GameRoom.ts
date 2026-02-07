import type { ServerPlayer, LobbyState } from '../types.js';
import { GameEngine } from './GameEngine.js';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const AVATAR_NAMES = ['Necromancer', 'Witch', 'Warlock', 'Lich'];

export class GameRoom {
  code: string;
  players: ServerPlayer[] = [];
  engine: GameEngine | null = null;
  hostId: string;
  createdAt: number;

  constructor(hostId: string, hostName: string, hostAvatar = 0) {
    this.code = generateRoomCode();
    this.hostId = hostId;
    this.createdAt = Date.now();

    this.addPlayer(hostId, hostName, true, hostAvatar);
  }

  addPlayer(socketId: string, name: string, isHost = false, avatar = 0): { player?: ServerPlayer; error?: string } {
    if (this.players.length >= 4) return { error: 'Room is full' };
    if (this.engine) return { error: 'Game already in progress' };

    // Check duplicate name (case-insensitive)
    const nameLower = name.toLowerCase();
    if (this.players.some(p => p.name.toLowerCase() === nameLower)) {
      return { error: 'Name already taken in this room' };
    }

    // Check duplicate avatar
    if (this.players.some(p => p.avatar === avatar)) {
      return { error: 'Avatar already taken in this room' };
    }

    // Check duplicate socket
    if (this.players.some(p => p.id === socketId)) {
      return { error: 'You are already in this room' };
    }

    const player: ServerPlayer = {
      id: socketId,
      name,
      avatar,
      hand: [],
      isAlive: true,
      isHost,
      isConnected: true,
    };

    this.players.push(player);
    return { player };
  }

  removePlayer(socketId: string): void {
    if (this.engine) {
      // Game in progress — handle via engine
      this.engine.handleDisconnect(socketId);
      return;
    }

    // In lobby — just remove
    this.players = this.players.filter(p => p.id !== socketId);

    // If host left, assign new host
    if (this.hostId === socketId && this.players.length > 0) {
      this.hostId = this.players[0].id;
      this.players[0].isHost = true;
    }
  }

  startGame(): boolean {
    if (this.players.length < 2) return false;
    if (this.engine) return false;

    this.engine = new GameEngine(this.code, this.players);
    this.engine.startGame();
    return true;
  }

  getLobbyState(): LobbyState {
    return {
      roomCode: this.code,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        handCount: 0,
        isAlive: true,
        isHost: p.isHost,
        isConnected: p.isConnected,
      })),
      hostId: this.hostId,
    };
  }

  isEmpty(): boolean {
    return this.players.length === 0 || this.players.every(p => !p.isConnected);
  }

  getAvatarName(index: number): string {
    return AVATAR_NAMES[index] || 'Sorcerer';
  }
}

// Room manager
const rooms = new Map<string, GameRoom>();

export function createRoom(hostId: string, hostName: string, hostAvatar = 0): GameRoom {
  let room: GameRoom;
  do {
    room = new GameRoom(hostId, hostName, hostAvatar);
  } while (rooms.has(room.code)); // ensure unique code

  rooms.set(room.code, room);
  return room;
}

export function getRoom(code: string): GameRoom | undefined {
  return rooms.get(code);
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
}

export function getRoomByPlayerId(socketId: string): GameRoom | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === socketId)) {
      return room;
    }
  }
  return undefined;
}

// Cleanup stale rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (room.isEmpty() && now - room.createdAt > 300_000) {
      rooms.delete(code);
    }
  }
}, 300_000);
