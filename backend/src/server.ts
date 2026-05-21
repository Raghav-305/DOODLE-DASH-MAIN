import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { RoomManager } from './models/RoomManager.js';
import { registerRoomHandlers } from './handlers/roomHandler.js';
import { registerGameHandlers } from './handlers/gameHandler.js';
import { registerCanvasHandlers } from './handlers/canvasHandler.js';
import { registerChatHandlers } from './handlers/chatHandler.js';
import { RateLimiter } from './middleware/rateLimiter.js';
import { CONFIG } from './config/constants.js';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Health check
app.get('/health', (_, res) => {
  const roomManager = RoomManager.getInstance();
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    rooms: roomManager.getRoomCount(),
    players: roomManager.getTotalPlayerCount(),
  });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
});

// Initialize RoomManager with Socket.IO instance
const roomManager = RoomManager.getInstance();
roomManager.initialize(io);

// Initialize rate limiter
const rateLimiter = new RateLimiter();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Apply rate limiting middleware
  const originalOn = socket.on.bind(socket);
  socket.on = (event: string, listener: (...args: any[]) => void) => {
    const wrappedListener = (...args: any[]) => {
      // Rate limit guess and chat events
      if (event === 'submit_guess') {
        if (!rateLimiter.checkLimit(socket.id, 'guess', CONFIG.GUESS_RATE_LIMIT, 1000)) {
          socket.emit('room_error', { message: 'Too many guesses. Slow down!' });
          return;
        }
      }
      if (event === 'send_chat') {
        if (!rateLimiter.checkLimit(socket.id, 'chat', CONFIG.CHAT_RATE_LIMIT, 1000)) {
          return;
        }
      }
      listener(...args);
    };
    return originalOn(event, wrappedListener);
  };

  // Register all handlers
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerCanvasHandlers(io, socket);
  registerChatHandlers(io, socket);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    rateLimiter.clearUser(socket.id);

    // Clean up empty rooms
    const room = roomManager.findRoomByPlayer(socket.id);
    if (room) {
      room.disconnectPlayer(socket.id);
      // Check if room is empty after disconnect
      setTimeout(() => {
        const connectedPlayers = Array.from(room.players.values())
          .filter(p => p.isConnected).length;
        if (connectedPlayers === 0) {
          roomManager.removeRoom(room.id);
        }
      }, 5000);
    }
  });
});

const PORT = parseInt(process.env.PORT || '4000', 10);
httpServer.listen(PORT, () => {
  console.log(`🎨 DoodleGuess server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
