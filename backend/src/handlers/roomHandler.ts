import { Server, Socket } from 'socket.io';
import { RoomManager } from '../models/RoomManager.js';
import { sanitizePlayerName } from '../utils/sanitizer.js';
import { validateRoomSettings } from '../middleware/validation.js';

export function registerRoomHandlers(_io: Server, socket: Socket): void {
  const roomManager = RoomManager.getInstance();

  socket.on('create_room', (data: { playerName: string; avatar: string; settings?: any }) => {
    try {
      const playerName = sanitizePlayerName(data.playerName);
      if (!playerName || playerName.length < 2 || playerName.length > 20) {
        socket.emit('room_error', { message: 'Name must be 2-20 characters' });
        return;
      }

      const settings = validateRoomSettings(data.settings || {});
      const room = roomManager.createRoom(settings);
      const player = room.addPlayer(socket.id, playerName, data.avatar || 'default');

      socket.join(room.id);
      socket.emit('room_created', {
        roomId: room.id,
        playerId: player.id,
        player: player.toJSON(),
      });
      console.log('[room] created', { roomId: room.id, playerId: player.id, playerName });

      room.broadcastState();
    } catch (error: any) {
      socket.emit('room_error', { message: error.message || 'Failed to create room' });
    }
  });

  socket.on('join_room', (data: { roomId: string; playerName: string; avatar: string }) => {
    try {
      const playerName = sanitizePlayerName(data.playerName);
      if (!playerName || playerName.length < 2 || playerName.length > 20) {
        socket.emit('room_error', { message: 'Name must be 2-20 characters' });
        return;
      }

      const room = roomManager.getRoom(data.roomId);
      if (!room) {
        socket.emit('room_error', { message: 'Room not found. Check the code and try again.' });
        return;
      }

      if (room.players.size >= room.settings.maxPlayers) {
        socket.emit('room_error', { message: 'Room is full' });
        return;
      }

      if (room.phase !== 'LOBBY') {
        socket.emit('room_error', { message: 'Game already in progress' });
        return;
      }

      const player = room.addPlayer(socket.id, playerName, data.avatar || 'default');
      socket.join(room.id);

      socket.emit('room_joined', {
        roomId: room.id,
        playerId: player.id,
        player: player.toJSON(),
        settings: room.settings,
        players: room.getPlayerData(),
        phase: room.phase,
      });
      console.log('[room] joined', { roomId: room.id, playerId: player.id, playerName });

      room.broadcastSystem(`${playerName} joined the room!`);
      room.broadcastState();
    } catch (error: any) {
      socket.emit('room_error', { message: error.message || 'Failed to join room' });
    }
  });

  socket.on('leave_room', () => {
    const room = roomManager.findRoomByPlayer(socket.id);
    if (room) {
      const player = room.players.get(socket.id);
      room.removePlayer(socket.id);
      socket.leave(room.id);
      if (player) {
        room.broadcastSystem(`${player.name} left the room`);
      }
      if (room.players.size === 0) {
        roomManager.removeRoom(room.id);
      }
    }
  });

  socket.on('disconnect', () => {
    const room = roomManager.findRoomByPlayer(socket.id);
    if (room) {
      room.disconnectPlayer(socket.id);
    }
  });
}
