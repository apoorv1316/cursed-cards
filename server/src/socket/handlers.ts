import type { Server, Socket } from 'socket.io';
import { createRoom, getRoom, getRoomByPlayerId, deleteRoom } from '../game/GameRoom.js';

export function registerHandlers(io: Server, socket: Socket): void {
  // Helper: broadcast game state to all players in room
  function broadcastGameState(roomCode: string): void {
    const room = getRoom(roomCode);
    if (!room?.engine) return;

    for (const player of room.players) {
      if (player.isConnected) {
        io.to(player.id).emit('game_state', room.engine.getStateForPlayer(player.id));
      }
    }
  }

  // ─── Helper: remove player from any existing room ───
  function leaveCurrentRoom() {
    const room = getRoomByPlayerId(socket.id);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    const playerName = player?.name || 'Unknown';

    socket.leave(room.code);
    room.removePlayer(socket.id);
    io.to(room.code).emit('player_left', { playerName });

    if (room.engine) {
      broadcastGameState(room.code);
    } else {
      io.to(room.code).emit('lobby_update', room.getLobbyState());
    }

    if (room.isEmpty()) {
      deleteRoom(room.code);
    }
  }

  // ─── Leave Room ───
  socket.on('leave_room', () => {
    leaveCurrentRoom();
  });

  // ─── Validate Name ───
  function validateName(raw: string): { name?: string; error?: string } {
    const name = raw?.trim().slice(0, 20) || '';
    if (name.length < 2) return { error: 'Name must be at least 2 characters' };
    if (name.length > 20) return { error: 'Name must be 20 characters or less' };
    if (!/^[a-zA-Z0-9 _\-]+$/.test(name)) return { error: 'Name can only contain letters, numbers, spaces, hyphens and underscores' };
    return { name };
  }

  // ─── Create Room ───
  socket.on('create_room', ({ playerName, avatar }: { playerName: string; avatar?: number }) => {
    // Auto-leave any existing room
    leaveCurrentRoom();

    const nameResult = validateName(playerName);
    if (nameResult.error) {
      socket.emit('error', { message: nameResult.error });
      return;
    }

    const avatarIdx = (typeof avatar === 'number' && avatar >= 0 && avatar <= 3) ? avatar : 0;
    const room = createRoom(socket.id, nameResult.name!, avatarIdx);
    socket.join(room.code);
    socket.emit('room_created', { roomCode: room.code });
    io.to(room.code).emit('lobby_update', room.getLobbyState());
  });

  // ─── Join Room ───
  socket.on('join_room', ({ roomCode, playerName, avatar }: { roomCode: string; playerName: string; avatar?: number }) => {
    // Auto-leave any existing room
    leaveCurrentRoom();

    const code = roomCode?.toUpperCase().trim() || '';
    if (!/^[A-Z]{4}$/.test(code)) {
      socket.emit('error', { message: 'Room code must be 4 letters' });
      return;
    }

    const room = getRoom(code);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.engine) {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    if (room.players.length >= 4) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    const nameResult = validateName(playerName);
    if (nameResult.error) {
      socket.emit('error', { message: nameResult.error });
      return;
    }

    const avatarIdx = (typeof avatar === 'number' && avatar >= 0 && avatar <= 3) ? avatar : 0;
    const result = room.addPlayer(socket.id, nameResult.name!, false, avatarIdx);

    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }

    socket.join(code);
    io.to(code).emit('player_joined', { playerName: nameResult.name! });
    io.to(code).emit('lobby_update', room.getLobbyState());
  });

  // ─── Start Game ───
  socket.on('start_game', () => {
    const room = getRoomByPlayerId(socket.id);
    if (!room) return;

    if (room.hostId !== socket.id) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }

    if (!room.startGame()) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    broadcastGameState(room.code);
  });

  // ─── Play Card ───
  socket.on('play_card', ({ cardId, targetPlayerId }: { cardId: string; targetPlayerId?: string }) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room?.engine) return;

    // If we're in target_select phase, handle differently
    if (room.engine.state.phase === 'target_select' && targetPlayerId) {
      const result = room.engine.playCardWithTarget(
        socket.id,
        targetPlayerId,
        undefined,
        () => broadcastGameState(room.code)
      );

      if (!result.success) {
        socket.emit('error', { message: result.error || 'Invalid action' });
        return;
      }

      // Emit card_played event
      const pa = room.engine.state.pendingAction;
      broadcastGameState(room.code);
      return;
    }

    const result = room.engine.playCard(
      socket.id,
      cardId,
      targetPlayerId,
      () => broadcastGameState(room.code)
    );

    if (!result.success) {
      socket.emit('error', { message: result.error || 'Invalid action' });
      return;
    }

    broadcastGameState(room.code);
  });

  // ─── Draw Card ───
  socket.on('draw_card', () => {
    const room = getRoomByPlayerId(socket.id);
    if (!room?.engine) return;

    const result = room.engine.drawCard(socket.id);

    if (!result.success) {
      socket.emit('error', { message: result.error || 'Cannot draw' });
      return;
    }

    // If demon was drawn, broadcast special event
    if (result.drawnCard?.type === 'demons_bargain') {
      const player = room.engine.getPlayerById(socket.id);
      io.to(room.code).emit('demon_drawn', {
        playerId: socket.id,
        playerName: player?.name || 'Unknown',
      });
    }

    broadcastGameState(room.code);
  });

  // ─── Hex Block Response ───
  socket.on('hex_block_response', ({ useHexBlock, cardId }: { useHexBlock: boolean; cardId?: string }) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room?.engine) return;

    room.engine.hexBlockResponse(socket.id, useHexBlock, cardId);

    if (useHexBlock && cardId) {
      const player = room.engine.getPlayerById(socket.id);
      io.to(room.code).emit('hex_block_used', {
        blockerName: player?.name || 'Unknown',
        blockedAction: room.engine.state.pendingAction?.cardType || 'action',
      });
    }

    broadcastGameState(room.code);
  });

  // ─── Counter Spell Response ───
  socket.on('counter_spell_response', ({ useCounterSpell, cardId }: { useCounterSpell: boolean; cardId?: string }) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room?.engine) return;

    room.engine.counterSpellResponse(socket.id, useCounterSpell, cardId);

    if (useCounterSpell) {
      const player = room.engine.getPlayerById(socket.id);
      io.to(room.code).emit('counter_spell_used', {
        playerName: player?.name || 'Unknown',
      });
    }

    // Check if player was eliminated
    const player = room.engine.getPlayerById(socket.id);
    if (player && !player.isAlive) {
      io.to(room.code).emit('player_eliminated', {
        playerId: socket.id,
        playerName: player.name,
      });
    }

    // Check for game over
    if (room.engine.state.phase === 'game_over' && room.engine.state.winner) {
      const winner = room.engine.getPlayerById(room.engine.state.winner);
      io.to(room.code).emit('game_over', {
        winnerId: room.engine.state.winner,
        winnerName: winner?.name || 'Unknown',
      });
    }

    broadcastGameState(room.code);
  });

  // ─── Dark Vision Done ───
  socket.on('dark_vision_done', () => {
    const room = getRoomByPlayerId(socket.id);
    if (!room?.engine) return;

    room.engine.darkVisionDone(socket.id);
    broadcastGameState(room.code);
  });

  // ─── Pair Steal ───
  socket.on('pair_steal', ({
    cardId1, cardId2, targetPlayerId, requestedCardType
  }: { cardId1: string; cardId2: string; targetPlayerId: string; requestedCardType: string }) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room?.engine) return;

    const result = room.engine.pairSteal(
      socket.id,
      cardId1,
      cardId2,
      targetPlayerId,
      requestedCardType as any
    );

    if (!result.success) {
      socket.emit('error', { message: result.error || 'Invalid pair steal' });
      return;
    }

    broadcastGameState(room.code);
  });

  // ─── Reinsert Demon ───
  socket.on('reinsert_demon', ({ position }: { position: number }) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room?.engine) return;

    room.engine.reinsertDemon(position);
    broadcastGameState(room.code);
  });

  // ─── Disconnect ───
  socket.on('disconnect', () => {
    leaveCurrentRoom();
  });
}
