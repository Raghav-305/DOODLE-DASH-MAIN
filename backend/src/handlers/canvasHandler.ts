import { Server, Socket } from 'socket.io';
import { RoomManager } from '../models/RoomManager.js';

export function registerCanvasHandlers(io: Server, socket: Socket): void {
  const roomManager = RoomManager.getInstance();

  socket.on('draw_stroke', (data: { roomId: string; stroke: any }) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;
    if (room.currentDrawerId !== socket.id) return;

    const stroke = room.addStroke(data.stroke);
    console.log('[canvas] stroke received', {
      roomId: room.id,
      drawerId: socket.id,
      points: data.stroke?.points?.length ?? 0,
    });

    // Broadcast to all EXCEPT sender
    socket.to(room.id).emit('stroke_broadcast', stroke.toJSON());
  });

  socket.on('canvas_clear', (data: { roomId: string }) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;
    if (room.currentDrawerId !== socket.id) return;

    room.clearCanvas();
    io.to(room.id).emit('canvas_clear');
  });

  socket.on('canvas_undo', (data: { roomId: string }) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) return;
    if (room.currentDrawerId !== socket.id) return;

    room.undoStroke();
    io.to(room.id).emit('canvas_undo');
  });
}
