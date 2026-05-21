export class TimerService {
  private timer: NodeJS.Timeout | null = null;
  private interval: NodeJS.Timeout | null = null;
  private elapsed: number = 0;
  private total: number = 0;

  public startTimer(
    seconds: number,
    onComplete: () => void,
    onTick?: (elapsed: number, total: number) => void
  ): void {
    this.clearTimer();
    this.total = seconds;
    this.elapsed = 0;

    if (onTick) {
      this.interval = setInterval(() => {
        this.elapsed++;
        onTick(this.elapsed, this.total);

        if (this.elapsed >= this.total) {
          this.clearTimer();
        }
      }, 1000);
    }

    this.timer = setTimeout(() => {
      this.clearTimer();
      onComplete();
    }, seconds * 1000);
  }

  public clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.elapsed = 0;
    this.total = 0;
  }

  public getElapsed(): number {
    return this.elapsed;
  }

  public getRemaining(): number {
    return this.total - this.elapsed;
  }

  public isRunning(): boolean {
    return this.timer !== null;
  }
}
