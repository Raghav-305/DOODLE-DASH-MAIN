export interface StrokePoint {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
}

export interface StrokeData {
  points: StrokePoint[];
  color: string;
  size: number;
  tool: 'pen' | 'eraser';
  timestamp: number;
}

export class Stroke {
  public readonly id: string;
  public points: StrokePoint[];
  public color: string;
  public size: number;
  public tool: 'pen' | 'eraser';
  public timestamp: number;

  constructor(data: Omit<StrokeData, 'timestamp'> & { timestamp?: number }) {
    this.id = `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.points = data.points;
    this.color = data.color;
    this.size = data.size;
    this.tool = data.tool;
    this.timestamp = data.timestamp ?? Date.now();
  }

  public toJSON(): StrokeData {
    return {
      points: this.points,
      color: this.color,
      size: this.size,
      tool: this.tool,
      timestamp: this.timestamp,
    };
  }
}
