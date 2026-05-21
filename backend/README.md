# DoodleGuess Backend

A real-time multiplayer drawing and guessing game backend built with Express, Socket.IO, and TypeScript.

## Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the backend directory (already provided with defaults):

```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173  # Update for production
RATE_LIMIT_WINDOW_MS=1000
RATE_LIMIT_MAX_REQUESTS=10
MAX_ROOM_INACTIVITY_MS=3600000
```

## Running the Backend

### Development Mode
```bash
npm run dev
```
Starts the server with hot-reload on `http://localhost:4000`

### Production Build
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## API Endpoints

### Health Check
- **GET** `/health` - Returns server status, uptime, room count, and player count

## Socket.IO Events

### Room Management
- `create_room` - Create a new game room
- `join_room` - Join an existing room by code
- `leave_room` - Leave the current room
- `room_created` - Room successfully created (response)
- `player_joined` - Player joined room (broadcast)
- `player_left` - Player left room (broadcast)
- `room_error` - Room operation error (response)

### Game Flow
- `start_game` - Start the game (host only)
- `game_started` - Game started (broadcast)
- `game_state_update` - Game state changed (broadcast)
- `round_start` - New round started with word options (broadcast)
- `word_selection` - Word selection for drawer (direct to drawer)
- `word_chosen` - Word selected (broadcast)
- `round_end` - Round ended with results (broadcast)
- `game_over` - Game finished with leaderboard (broadcast)
- `return_to_lobby` - Return to lobby (host only)

### Canvas & Drawing
- `draw_stroke` - Send a drawing stroke
- `stroke_broadcast` - Broadcast stroke to others (broadcast)
- `canvas_clear` - Clear the canvas
- `canvas_undo` - Undo last stroke
- `canvas_snapshot` - Get full canvas history
- `canvas_history` - Canvas history (response)

### Chat & Guessing
- `submit_guess` - Submit a guess for the word
- `guess_result` - Guess was correct/incorrect (broadcast)
- `send_chat` - Send a chat message
- `chat_message` - Receive chat message (broadcast)
- `system_message` - System notification (broadcast)

### Timing
- `timer_sync` - Timer update (broadcast)
- `hint_reveal` - Hint revealed (broadcast)

### Connection
- `reconnect_state` - Reconnection state (response)
- `ping/pong` - Keep-alive (automatic)

## Project Structure

```
src/
├── config/
│   └── constants.ts       # Game configuration and event definitions
├── models/
│   ├── Player.ts          # Player class and interface
│   ├── Room.ts            # Game room logic and management
│   ├── RoomManager.ts      # Singleton for managing all rooms
│   └── Stroke.ts          # Canvas stroke data structure
├── handlers/
│   ├── roomHandler.ts      # Room creation/joining
│   ├── gameHandler.ts      # Game flow (start, select word, etc.)
│   ├── canvasHandler.ts    # Drawing operations
│   └── chatHandler.ts      # Messaging and guessing
├── services/
│   ├── WordService.ts      # Word selection and management
│   ├── ScoringService.ts   # Point calculation
│   └── TimerService.ts     # Game timing
├── middleware/
│   ├── rateLimiter.ts      # Rate limiting for events
│   └── validation.ts       # Input validation
├── utils/
│   ├── idGenerator.ts      # Room code and player ID generation
│   └── sanitizer.ts        # Input sanitization
└── server.ts              # Main server entry point

data/
└── words.json             # Word categories for gameplay
```

## Game Flow

1. **Lobby Phase**: Players join a room
2. **Word Selection**: Drawer gets 3 word options to choose from (15s timeout)
3. **Drawing Phase**: 
   - Drawer draws the word
   - Other players try to guess
   - Hints revealed at 33% and 66% of draw time
   - Round ends when all guess or time runs out
4. **Intermission**: Score display (8 seconds)
5. **Repeat** for configured number of rounds
6. **Game Over**: Final leaderboard, auto-return to lobby after 30 seconds

## Scoring

- **Correct Guess**: Base 500 points - (50 × guesser position) = 100 minimum
- **Drawer Bonus**: 50 points per correct guesser + 100 bonus if all guess correctly
- **Time Bonus**: Calculated based on remaining time when guess submitted

## Rate Limiting

- **Guesses**: 3 per second per player
- **Chat**: 5 messages per second per player
- **Drawing**: 60 events per second per player

## Frontend Integration

Update your frontend Socket.IO client configuration:

```typescript
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
});
```

Update your `.env` file in the frontend:
```env
VITE_SOCKET_URL=http://localhost:4000
```

## Deployment

### Railway (Recommended)

1. Push to GitHub
2. Connect repository to Railway
3. Set environment variables:
   - `PORT=8080`
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-frontend.vercel.app`
4. Railway auto-detects Node.js and runs: `npm run build && npm start`

### Vercel (Frontend)

1. Set environment variable:
   - `VITE_SOCKET_URL=https://your-backend.railway.app`
2. Deploy

## Troubleshooting

### WebSocket Connection Issues
- Ensure CORS_ORIGIN matches your frontend URL exactly
- Check that both frontend and backend are running
- Verify firewall/proxy settings allow WebSocket connections

### Room Not Found
- Check room code format (6 alphanumeric characters)
- Ensure room hasn't expired (1 hour inactivity timeout)

### Rate Limiting Errors
- Reduce event emission frequency in frontend
- Check browser console for detailed error messages

## License

MIT
