export const CONFIG = {
  // Room settings defaults
  DEFAULT_MAX_PLAYERS: 10,
  DEFAULT_ROUNDS: 3,
  DEFAULT_DRAW_TIME: 80,
  DEFAULT_WORD_CHOICES: 3,
  DEFAULT_HINTS_ENABLED: true,

  // Game limits
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 20,
  MIN_ROUNDS: 1,
  MAX_ROUNDS: 10,
  MIN_DRAW_TIME: 30,
  MAX_DRAW_TIME: 300,
  MIN_WORD_CHOICES: 1,
  MAX_WORD_CHOICES: 5,

  // Timing
  WORD_SELECTION_TIMEOUT: 15,
  ROUND_INTERMISSION: 8,
  HINT_REVEAL_INTERVALS: [0.33, 0.66], // Reveal at 33% and 66% of draw time
  GAME_OVER_DISPLAY_TIME: 30,

  // Scoring
  BASE_GUESS_POINTS: 500,
  GUESS_DECAY_PER_PLAYER: 50,
  MIN_GUESS_POINTS: 100,
  DRAWER_POINTS_PER_GUESSER: 50,
  BONUS_ALL_GUESSED: 100,

  // Room management
  ROOM_CODE_LENGTH: 6,
  MAX_ROOMS: 1000,
  ROOM_INACTIVITY_TIMEOUT: 3600000, // 1 hour

  // Rate limiting
  GUESS_RATE_LIMIT: 3, // guesses per second
  CHAT_RATE_LIMIT: 5, // messages per second
  DRAW_RATE_LIMIT: 60, // draw events per second

  // Canvas
  MAX_STROKE_HISTORY: 500,
  MAX_STROKE_POINTS: 1000,
} as const;

export const SOCKET_EVENTS = {
  // Room events
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_CREATED: 'room_created',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  ROOM_ERROR: 'room_error',

  // Game events
  START_GAME: 'start_game',
  GAME_STARTED: 'game_started',
  GAME_STATE_UPDATE: 'game_state_update',
  ROUND_START: 'round_start',
  WORD_SELECTION: 'word_selection',
  WORD_CHOSEN: 'word_chosen',
  ROUND_END: 'round_end',
  GAME_OVER: 'game_over',
  RETURN_TO_LOBBY: 'return_to_lobby',

  // Canvas events
  DRAW_STROKE: 'draw_stroke',
  STROKE_BROADCAST: 'stroke_broadcast',
  CANVAS_CLEAR: 'canvas_clear',
  CANVAS_UNDO: 'canvas_undo',
  CANVAS_SNAPSHOT: 'canvas_snapshot',
  CANVAS_HISTORY: 'canvas_history',

  // Chat events
  SUBMIT_GUESS: 'submit_guess',
  GUESS_RESULT: 'guess_result',
  SEND_CHAT: 'send_chat',
  CHAT_MESSAGE: 'chat_message',
  SYSTEM_MESSAGE: 'system_message',

  // Timer
  TIMER_SYNC: 'timer_sync',
  HINT_REVEAL: 'hint_reveal',

  // Connection
  RECONNECT_STATE: 'reconnect_state',
  PING: 'ping',
  PONG: 'pong',
} as const;
