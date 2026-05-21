import { Server, Socket } from 'socket.io';
import { RoomManager } from '../models/RoomManager.js';
import { sanitizeMessage } from '../utils/sanitizer.js';

export function registerChatHandlers(io: Server, socket: Socket): void {
  const roomManager = RoomManager.getInstance();

  socket.on('submit_guess', (data: { roomId: string; text: string }) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;

    const cleanedText = sanitizeMessage(data.text);
    if (!cleanedText || cleanedText.length > 50) return;

    console.log('[chat] guess submitted', { roomId: room.id, playerId: socket.id });
    room.handleGuess(socket.id, cleanedText);
  });

  socket.on('send_chat', (data: { roomId: string; text: string }) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const cleanedText = sanitizeMessage(data.text);
    if (!cleanedText || cleanedText.length > 200) return;

    console.log('[chat] message sent', { roomId: room.id, playerId: socket.id });

    // If player is guessing (hasn't guessed yet), only send to other guessers
    if (room.phase === 'DRAWING' && !player.hasGuessed && socket.id !== room.currentDrawerId) {
      // Send only to players who also haven't guessed (to prevent hint sharing)
      room.players.forEach((p) => {
        if (!p.hasGuessed || p.id === socket.id) {
          io.to(p.id).emit('chat_message', {
            playerId: socket.id,
            playerName: player.name,
            text: cleanedText,
            isGuess: false,
          });
        }
      });
    } else {
      // Send to everyone
      io.to(room.id).emit('chat_message', {
        playerId: socket.id,
        playerName: player.name,
        text: cleanedText,
        isGuess: false,
      });
    }
  });
}
