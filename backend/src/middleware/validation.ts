import { RoomSettings } from '../models/Room.js';
import { CONFIG } from '../config/constants.js';

export function validateRoomSettings(settings: Partial<RoomSettings>): Partial<RoomSettings> {
  const validated: Partial<RoomSettings> = {};

  if (settings.maxPlayers !== undefined) {
    validated.maxPlayers = Math.min(
      Math.max(settings.maxPlayers, CONFIG.MIN_PLAYERS),
      CONFIG.MAX_PLAYERS
    );
  }

  if (settings.rounds !== undefined) {
    validated.rounds = Math.min(
      Math.max(settings.rounds, CONFIG.MIN_ROUNDS),
      CONFIG.MAX_ROUNDS
    );
  }

  if (settings.drawTime !== undefined) {
    validated.drawTime = Math.min(
      Math.max(settings.drawTime, CONFIG.MIN_DRAW_TIME),
      CONFIG.MAX_DRAW_TIME
    );
  }

  if (settings.wordChoicesCount !== undefined) {
    validated.wordChoicesCount = Math.min(
      Math.max(settings.wordChoicesCount, CONFIG.MIN_WORD_CHOICES),
      CONFIG.MAX_WORD_CHOICES
    );
  }

  if (settings.hintsEnabled !== undefined) {
    validated.hintsEnabled = Boolean(settings.hintsEnabled);
  }

  return validated;
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}
