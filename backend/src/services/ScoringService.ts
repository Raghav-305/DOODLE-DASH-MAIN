import { CONFIG } from '../config/constants.js';

export class ScoringService {
  public calculateGuessPoints(guessPosition: number): number {
    // First guesser gets most points, each subsequent gets less
    const points = CONFIG.BASE_GUESS_POINTS - (guessPosition * CONFIG.GUESS_DECAY_PER_PLAYER);
    return Math.max(points, CONFIG.MIN_GUESS_POINTS);
  }

  public calculateDrawerPoints(totalGuessers: number, correctGuessers: number): number {
    let points = correctGuessers * CONFIG.DRAWER_POINTS_PER_GUESSER;

    // Bonus if everyone guessed correctly
    if (correctGuessers >= totalGuessers) {
      points += CONFIG.BONUS_ALL_GUESSED;
    }

    return points;
  }

  public calculateTimeBonus(timeRemaining: number, totalTime: number): number {
    // Bonus points for guessing quickly
    const percentage = timeRemaining / totalTime;
    return Math.floor(percentage * 200);
  }
}
