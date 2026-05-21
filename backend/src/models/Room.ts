import { Player, PlayerData } from './Player.js';
import { Stroke, StrokeData } from './Stroke.js';
import { CONFIG } from '../config/constants.js';
import { WordService } from '../services/WordService.js';
import { ScoringService } from '../services/ScoringService.js';
import { TimerService } from '../services/TimerService.js';
import { Server } from 'socket.io';

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordChoicesCount: number;
  hintsEnabled: boolean;
}

export type GamePhase = 'LOBBY' | 'WORD_SELECTION' | 'DRAWING' | 'INTERMISSION' | 'GAME_OVER';

export class Room {
  public readonly id: string;
  public readonly settings: RoomSettings;
  public readonly players: Map<string, Player> = new Map();
  public phase: GamePhase = 'LOBBY';
  public currentRound: number = 0;
  public currentDrawerId: string | null = null;
  public currentWord: string = '';
  public wordOptions: string[] = [];
  public hintTemplate: string[] = [];

  private readonly strokes: Stroke[] = [];
  private readonly wordService: WordService;
  private readonly scoringService: ScoringService;
  private readonly timerService: TimerService;
  private readonly io: Server;
  private drawerIndex: number = 0;
  private usedWords: Set<string> = new Set();
  private inactivityTimeout: NodeJS.Timeout | null = null;

  constructor(id: string, io: Server, settings?: Partial<RoomSettings>) {
    this.id = id;
    this.io = io;
    this.settings = {
      maxPlayers: settings?.maxPlayers ?? CONFIG.DEFAULT_MAX_PLAYERS,
      rounds: settings?.rounds ?? CONFIG.DEFAULT_ROUNDS,
      drawTime: settings?.drawTime ?? CONFIG.DEFAULT_DRAW_TIME,
      wordChoicesCount: settings?.wordChoicesCount ?? CONFIG.DEFAULT_WORD_CHOICES,
      hintsEnabled: settings?.hintsEnabled ?? CONFIG.DEFAULT_HINTS_ENABLED,
    };

    this.wordService = new WordService();
    this.scoringService = new ScoringService();
    this.timerService = new TimerService();
  }

  // --- Player Management ---

  public addPlayer(id: string, name: string, avatar: string): Player {
    const isHost = this.players.size === 0;
    const player = new Player(id, name, avatar, isHost);
    this.players.set(id, player);
    this.resetInactivityTimer();
    return player;
  }

  public removePlayer(id: string): boolean {
    const player = this.players.get(id);
    if (!player) return this.players.size === 0;

    this.players.delete(id);

    if (this.players.size > 0) {
      // Reassign host if needed
      if (player.isHost) {
        const newHost = this.players.values().next().value;
        if (newHost) {
          newHost.isHost = true;
        }
      }

      // Handle drawer disconnect
      if (this.phase === 'DRAWING' && this.currentDrawerId === id) {
        this.broadcastSystem(`${player.name} disconnected! Skipping round...`);
        this.endRound();
      }
    }

    this.broadcastState();
    return this.players.size === 0;
  }

  public reconnectPlayer(socketId: string, playerId: string): Player | null {
    const player = this.players.get(playerId);
    if (!player) return null;

    player.setConnected(true);
    // Re-map socket ID (player might have new socket)
    this.players.delete(playerId);
    player.id = socketId;
    this.players.set(socketId, player);

    return player;
  }

  public disconnectPlayer(socketId: string): void {
    const player = this.players.get(socketId);
    if (player) {
      player.setConnected(false);
      this.broadcastState();
    }
  }

  // --- Game Flow ---

  public startGame(): boolean {
    if (this.phase !== 'LOBBY') return false;
    if (this.players.size < CONFIG.MIN_PLAYERS) return false;

    this.phase = 'WORD_SELECTION';
    this.currentRound = 1;
    this.drawerIndex = 0;
    this.usedWords.clear();

    this.startTurn();
    return true;
  }

  private startTurn(): void {
    this.strokes.length = 0; // Clear canvas history
    this.io.to(this.id).emit('canvas_clear');

    const playerIds = Array.from(this.players.keys());

    // Cycle through all players before incrementing round
    if (this.drawerIndex >= playerIds.length) {
      this.drawerIndex = 0;
      this.currentRound++;
    }

    // Check if game is over
    if (this.currentRound > this.settings.rounds) {
      this.endGame();
      return;
    }

    this.currentDrawerId = playerIds[this.drawerIndex];
    this.phase = 'WORD_SELECTION';

    // Reset round state for all players
    this.players.forEach(p => p.resetForNewRound());

    // Select word options
    this.wordOptions = this.wordService.getWordOptions(
      this.settings.wordChoicesCount,
      this.usedWords
    );
    this.currentWord = '';
    this.hintTemplate = [];

    // Send state update
    this.broadcastState();

    // Emit word selection to drawer
    const drawer = this.players.get(this.currentDrawerId);
    if (drawer) {
      this.io.to(drawer.id).emit('word_selection', {
        words: this.wordOptions,
        timeout: CONFIG.WORD_SELECTION_TIMEOUT,
      });
    }

    // Auto-select timeout
    this.timerService.startTimer(CONFIG.WORD_SELECTION_TIMEOUT, () => {
      if (this.phase === 'WORD_SELECTION') {
        this.selectWord(this.currentDrawerId!, this.wordOptions[0]);
      }
    });
  }

  public selectWord(playerId: string, word: string): boolean {
    if (this.phase !== 'WORD_SELECTION') return false;
    if (playerId !== this.currentDrawerId) return false;
    if (!this.wordOptions.includes(word.toLowerCase())) return false;

    this.timerService.clearTimer();
    this.currentWord = word.toLowerCase().trim();
    this.usedWords.add(this.currentWord);
    this.phase = 'DRAWING';

    // Initialize hint template
    this.hintTemplate = this.currentWord.split('').map(char =>
      char === ' ' ? ' ' : '_'
    );

    // Notify all players
    this.io.to(this.id).emit('round_start', {
      drawerId: this.currentDrawerId,
      drawerName: this.players.get(this.currentDrawerId)?.name,
      drawTime: this.settings.drawTime,
      hintTemplate: this.hintTemplate.join(' '),
      round: this.currentRound,
      totalRounds: this.settings.rounds,
    });

    this.broadcastState();

    // Start draw timer with hint intervals
    this.timerService.startTimer(
      this.settings.drawTime,
      () => this.endRound(),
      (elapsed, total) => {
        this.broadcastTimer(elapsed, total);
        // Reveal hints at intervals
        if (this.settings.hintsEnabled) {
          const progress = elapsed / total;
          for (const interval of CONFIG.HINT_REVEAL_INTERVALS) {
            if (Math.abs(progress - interval) < 0.02) {
              this.revealHint();
            }
          }
        }
      }
    );

    return true;
  }

  private revealHint(): void {
    const hiddenIndices: number[] = [];
    this.hintTemplate.forEach((char, i) => {
      if (char === '_') hiddenIndices.push(i);
    });

    if (hiddenIndices.length <= 1) return; // Keep at least one hidden

    // Reveal random hidden letter
    const randomIdx = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    this.hintTemplate[randomIdx] = this.currentWord[randomIdx];

    this.io.to(this.id).emit('hint_reveal', {
      hintTemplate: this.hintTemplate.join(' '),
    });
  }

  public handleGuess(playerId: string, guess: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    if (player.hasGuessed) return;
    if (playerId === this.currentDrawerId) return;
    if (this.phase !== 'DRAWING') return;

    const cleanGuess = guess.toLowerCase().trim();

    if (cleanGuess === this.currentWord) {
      player.hasGuessed = true;

      // Calculate points
      const guessersCount = Array.from(this.players.values())
        .filter(p => p.hasGuessed).length;
      const points = this.scoringService.calculateGuessPoints(guessersCount);
      player.addScore(points);

      // Award drawer
      const drawer = this.players.get(this.currentDrawerId!);
      if (drawer) {
        drawer.addScore(CONFIG.DRAWER_POINTS_PER_GUESSER);
      }

      // Notify all
      this.io.to(this.id).emit('guess_result', {
        playerId,
        playerName: player.name,
        correct: true,
        points,
        guessersCount,
      });

      this.broadcastState();

      // Check if all guessers have guessed
      const totalGuessers = this.players.size - 1;
      const correctGuessers = Array.from(this.players.values())
        .filter(p => p.hasGuessed).length;

      if (correctGuessers >= totalGuessers) {
        // Bonus for drawer
        if (drawer) drawer.addScore(CONFIG.BONUS_ALL_GUESSED);
        this.endRound();
      }
    } else {
      // Wrong guess - broadcast as chat (if close, maybe hint?)
      this.io.to(this.id).emit('chat_message', {
        playerId,
        playerName: player.name,
        text: guess,
        isGuess: true,
        isClose: this.isGuessClose(cleanGuess),
      });
    }
  }

  private isGuessClose(guess: string): boolean {
    // Levenshtein distance check for "close" guesses
    const distance = this.levenshteinDistance(guess, this.currentWord);
    return distance <= 2 && guess.length === this.currentWord.length;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // --- Canvas Management ---

  public addStroke(strokeData: StrokeData): Stroke {
    // Limit stroke history
    if (this.strokes.length >= CONFIG.MAX_STROKE_HISTORY) {
      this.strokes.shift();
    }

    const stroke = new Stroke(strokeData);
    this.strokes.push(stroke);
    return stroke;
  }

  public undoStroke(): Stroke | null {
    return this.strokes.pop() ?? null;
  }

  public clearCanvas(): void {
    this.strokes.length = 0;
  }

  public getCanvasHistory(): StrokeData[] {
    return this.strokes.map(s => s.toJSON());
  }

  // --- Round/Game End ---

  private endRound(): void {
    this.timerService.clearTimer();
    this.phase = 'INTERMISSION';

    this.io.to(this.id).emit('round_end', {
      word: this.currentWord,
      drawerId: this.currentDrawerId,
      players: this.getPlayerData(),
      round: this.currentRound,
    });

    // Move to next drawer
    this.drawerIndex++;

    // Intermission timer
    setTimeout(() => {
      this.startTurn();
    }, CONFIG.ROUND_INTERMISSION * 1000);
  }

  private endGame(): void {
    this.timerService.clearTimer();
    this.phase = 'GAME_OVER';

    const leaderboard = this.getPlayerData()
      .sort((a, b) => b.score - a.score);

    this.io.to(this.id).emit('game_over', {
      leaderboard,
      rounds: this.settings.rounds,
    });

    // Auto-return to lobby after display time
    setTimeout(() => {
      this.returnToLobby();
    }, CONFIG.GAME_OVER_DISPLAY_TIME * 1000);
  }

  public returnToLobby(): void {
    this.phase = 'LOBBY';
    this.currentRound = 0;
    this.currentDrawerId = null;
    this.currentWord = '';
    this.wordOptions = [];
    this.hintTemplate = [];
    this.strokes.length = 0;
    this.drawerIndex = 0;
    this.usedWords.clear();

    // Reset player scores but keep readiness
    this.players.forEach(p => {
      p.score = 0;
      p.roundScore = 0;
      p.hasGuessed = false;
      p.scoreGainedThisRound = 0;
    });

    this.timerService.clearTimer();
    this.broadcastState();
  }

  // --- Broadcasting ---

  public broadcastState(): void {
    const state = {
      phase: this.phase,
      round: this.currentRound,
      totalRounds: this.settings.rounds,
      drawerId: this.currentDrawerId,
      drawerName: this.currentDrawerId ? this.players.get(this.currentDrawerId)?.name : null,
      wordTemplate: this.phase === 'DRAWING' ? this.hintTemplate.join(' ') : null,
      wordLength: this.currentWord.length,
      players: this.getPlayerData(),
      settings: this.settings,
    };

    this.io.to(this.id).emit('game_state_update', state);
  }

  public broadcastSystem(message: string): void {
    this.io.to(this.id).emit('system_message', { text: message, timestamp: Date.now() });
  }

  private broadcastTimer(elapsed: number, total: number): void {
    this.io.to(this.id).emit('timer_sync', {
      elapsed,
      total,
      remaining: total - elapsed,
    });
  }

  public getPlayerData(): PlayerData[] {
    return Array.from(this.players.values()).map(p => p.toJSON());
  }

  // --- Inactivity Management ---

  private resetInactivityTimer(): void {
    if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
    this.inactivityTimeout = setTimeout(() => {
      // Room will be cleaned up by manager if empty
    }, CONFIG.ROOM_INACTIVITY_TIMEOUT);
  }

  public destroy(): void {
    this.timerService.clearTimer();
    if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
    this.players.clear();
    this.strokes.length = 0;
  }
}
