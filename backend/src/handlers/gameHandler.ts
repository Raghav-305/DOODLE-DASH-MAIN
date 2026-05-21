import { Server, Socket } from 'socket.io';
import { RoomManager } from '../models/RoomManager.js';

export function registerGameHandlers(_io: Server, socket: Socket): void {
  const roomManager = RoomManager.getInstance();

  socket.on('start_game', (data: { roomId: string }) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player?.isHost) {
      socket.emit('room_error', { message: 'Only the host can start the game' });
      return;
    }

    if (room.players.size < 2) {
      socket.emit('room_error', { message: 'Need at least 2 players to start' });
      return;
    }

    const started = room.startGame();
    if (started) {
      console.log('[game] started', { roomId: room.id, hostId: socket.id });
    }
    if (!started) {
      socket.emit('room_error', { message: 'Cannot start game right now' });
    }
  });

  socket.on('select_word', (data: { roomId: string; word: string }) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;

    const success = room.selectWord(socket.id, data.word);
    if (success) {
      console.log('[game] word selected', { roomId: room.id, drawerId: socket.id });
    }
    if (!success) {
      socket.emit('room_error', { message: 'Failed to select word' });
    }
  });

  socket.on('return_to_lobby', (data: { roomId: string }) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player?.isHost) {
      socket.emit('room_error', { message: 'Only the host can return to lobby' });
      return;
    }

    room.returnToLobby();
  });
}
