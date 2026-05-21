# Backend Integration Guide

This document explains how to integrate the DoodleGuess backend with your frontend application.

## Project Structure

Your workspace now has this structure:

```
doodle-dash-main/
├── src/                    # Frontend (existing)
│   ├── components/
│   ├── hooks/
│   ├── routes/
│   └── ...
├── backend/               # Backend (newly added)
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── handlers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.ts
│   ├── data/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── README.md
├── package.json           # Frontend package.json
├── vite.config.ts         # Frontend Vite config
└── ... (other frontend files)
```

## Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- `express` - Web framework
- `socket.io` - Real-time communication
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `sanitize-html` - Input sanitization
- TypeScript & dev tools

## Step 2: Frontend Socket Configuration

Update or create a socket configuration file in your frontend. Add this to your `src/hooks/useSocket.ts` (or create it):

```typescript
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to backend:', socketRef.current?.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from backend');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef.current;
}
```

## Step 3: Update Frontend .env

Add this to your frontend `.env.local` or `.env`:

```env
VITE_SOCKET_URL=http://localhost:4000
```

For production (Vercel/Railway):
```env
VITE_SOCKET_URL=https://your-backend-url.railway.app
```

## Step 4: Update Backend .env

The backend `.env` is pre-configured with defaults. Update for your setup:

```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173  # Your frontend URL
```

For production:
```env
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app
```

## Step 5: Running Both Locally

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```
Output should show:
```
🎨 DoodleGuess server running on port 4000
   Health check: http://localhost:4000/health
```

### Terminal 2 - Frontend:
```bash
npm run dev
```

## Step 6: Update Frontend Components

Use the socket in your game components:

```typescript
import { useSocket } from '@/hooks/useSocket';

export function GameComponent() {
  const socket = useSocket();

  const handleCreateRoom = (playerName: string) => {
    socket?.emit('create_room', {
      playerName,
      avatar: 'default',
      settings: {
        maxPlayers: 10,
        rounds: 3,
        drawTime: 80,
      }
    });

    socket?.on('room_created', (data) => {
      console.log('Room created:', data.roomId);
      // Update your UI with room info
    });
  };

  const handleJoinRoom = (roomId: string, playerName: string) => {
    socket?.emit('join_room', {
      roomId,
      playerName,
      avatar: 'default'
    });
  };

  // ... more socket event handlers
}
```

## Step 7: Frontend Socket Event Handlers

Here's a template for handling main game events:

```typescript
// Room Events
socket?.on('room_created', handleRoomCreated);
socket?.on('room_joined', handleRoomJoined);
socket?.on('player_joined', handlePlayerJoined);
socket?.on('player_left', handlePlayerLeft);
socket?.on('room_error', handleRoomError);

// Game Events
socket?.on('game_state_update', handleGameStateUpdate);
socket?.on('round_start', handleRoundStart);
socket?.on('word_selection', handleWordSelection);
socket?.on('guess_result', handleGuessResult);
socket?.on('game_over', handleGameOver);

// Canvas Events
socket?.on('stroke_broadcast', handleStrokeBroadcast);
socket?.on('canvas_clear', handleCanvasClear);
socket?.on('canvas_undo', handleCanvasUndo);

// Chat Events
socket?.on('chat_message', handleChatMessage);
socket?.on('system_message', handleSystemMessage);

// Timer Events
socket?.on('timer_sync', handleTimerSync);
socket?.on('hint_reveal', handleHintReveal);
```

## Step 8: Testing

### Health Check
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 12.345,
  "rooms": 0,
  "players": 0
}
```

### Test Connection
Open your frontend app. In the browser console, you should see:
```
Connected to backend: [socket-id]
```

## Deployment Checklist

### Backend (Railway)
- [ ] Push code to GitHub
- [ ] Create Railway project
- [ ] Connect GitHub repository
- [ ] Set `PORT=8080`
- [ ] Set `NODE_ENV=production`
- [ ] Set `CORS_ORIGIN=https://your-frontend-vercel-url`
- [ ] Copy production backend URL

### Frontend (Vercel)
- [ ] Push code to GitHub
- [ ] Create Vercel project
- [ ] Set `VITE_SOCKET_URL=https://your-production-backend-url`
- [ ] Deploy
- [ ] Test WebSocket connection

## Common Issues & Solutions

### Issue: CORS Error
**Solution**: Update `CORS_ORIGIN` in backend `.env` to match your frontend URL exactly

### Issue: Cannot connect to socket
**Solution**: 
1. Check backend is running: `curl http://localhost:4000/health`
2. Check CORS_ORIGIN matches
3. Check firewall/proxy settings

### Issue: Room not found
**Solution**:
1. Verify room code format (6 characters)
2. Check room hasn't expired (1 hour timeout)
3. Check both players are in same room

### Issue: Rate limiting errors
**Solution**: Reduce event frequency in frontend or adjust limits in `backend/.env`

## Next Steps

1. ✅ Install backend dependencies (`npm install` in backend folder)
2. ✅ Start both servers (backend on 4000, frontend on 5173)
3. ✅ Update socket connections in frontend components
4. ✅ Test room creation and joining
5. ✅ Test drawing and guessing
6. ✅ Deploy to Railway (backend) and Vercel (frontend)

## File Reference

- **Backend Config**: [backend/src/config/constants.ts](./backend/src/config/constants.ts)
- **Room Logic**: [backend/src/models/Room.ts](./backend/src/models/Room.ts)
- **Socket Handlers**: [backend/src/handlers/](./backend/src/handlers/)
- **Backend README**: [backend/README.md](./backend/README.md)

## Support

Refer to the [backend README](./backend/README.md) for detailed API documentation and troubleshooting.
