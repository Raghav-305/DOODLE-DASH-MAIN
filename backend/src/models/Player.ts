export interface PlayerData {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  hasGuessed: boolean;
  scoreGainedThisRound: number;
  roundScore: number;
}

export class Player {
  public id: string;
  public name: string;
  public avatar: string;
  public score: number = 0;
  public roundScore: number = 0;
  public isHost: boolean;
  public isReady: boolean = false;
  public isConnected: boolean = true;
  public hasGuessed: boolean = false;
  public scoreGainedThisRound: number = 0;

  constructor(id: string, name: string, avatar: string, isHost: boolean = false) {
    this.id = id;
    this.name = name;
    this.avatar = avatar;
    this.isHost = isHost;
  }

  public resetForNewRound(): void {
    this.hasGuessed = false;
    this.roundScore = 0;
    this.scoreGainedThisRound = 0;
  }

  public addScore(points: number): void {
    this.score += points;
    this.roundScore += points;
    this.scoreGainedThisRound = points;
  }

  public setConnected(connected: boolean): void {
    this.isConnected = connected;
  }

  public toJSON(): PlayerData {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      score: this.score,
      isHost: this.isHost,
      isReady: this.isReady,
      isConnected: this.isConnected,
      hasGuessed: this.hasGuessed,
      scoreGainedThisRound: this.scoreGainedThisRound,
      roundScore: this.roundScore,
    };
  }
}
