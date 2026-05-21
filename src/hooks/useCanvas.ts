import { useCallback, useEffect, useRef, useState } from "react";

export interface StrokePoint { x: number; y: number }
export interface Stroke {
  color: string;
  size: number;
  tool: "pen" | "eraser";
  points: StrokePoint[];
}

interface Options {
  enabled: boolean;
  onStrokeComplete?: (stroke: Stroke) => void;
}

export function useCanvas({ enabled, onStrokeComplete }: Options) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  const rafFlag = useRef(false);
  const lastPoint = useRef<StrokePoint | null>(null);

  const [color, setColor] = useState("#2D3436");
  const [size, setSize] = useState(8);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");

  const drawLine = useCallback(
    (ctx: CanvasRenderingContext2D, from: StrokePoint, to: StrokePoint, s: Stroke, w: number, h: number) => {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = s.tool === "eraser" ? "#FFFFFF" : s.color;
      ctx.lineWidth = s.size;
      const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      ctx.beginPath();
      ctx.moveTo(from.x * w, from.y * h);
      ctx.quadraticCurveTo(from.x * w, from.y * h, mid.x * w, mid.y * h);
      ctx.stroke();
    },
    [],
  );

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: w, height: h } = canvas;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
    for (const s of strokesRef.current) {
      for (let i = 1; i < s.points.length; i++) {
        drawLine(ctx, s.points[i - 1], s.points[i], s, w, h);
      }
    }
  }, [drawLine]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  const getXY = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enabled) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = getXY(e);
    lastPoint.current = p;
    currentRef.current = { color, size, tool, points: [p] };
    strokesRef.current.push(currentRef.current);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!enabled || !currentRef.current) return;
    const p = getXY(e);
    currentRef.current.points.push(p);
    if (!rafFlag.current) {
      rafFlag.current = true;
      requestAnimationFrame(() => {
        rafFlag.current = false;
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        if (!ctx || !lastPoint.current || !currentRef.current) return;
        drawLine(ctx, lastPoint.current, p, currentRef.current, c.width, c.height);
        lastPoint.current = p;
      });
    }
  };

  const onPointerUp = () => {
    if (currentRef.current && currentRef.current.points.length > 1) {
      onStrokeComplete?.(currentRef.current);
    }
    currentRef.current = null;
    lastPoint.current = null;
  };

  const undo = () => {
    strokesRef.current.pop();
    redrawAll();
  };
  const clear = () => {
    strokesRef.current = [];
    redrawAll();
  };
  const addRemoteStroke = (stroke: Stroke) => {
    strokesRef.current.push(stroke);
    redrawAll();
  };
  const replaceStrokes = (strokes: Stroke[]) => {
    strokesRef.current = strokes;
    redrawAll();
  };

  return {
    canvasRef, color, setColor, size, setSize, tool, setTool,
    onPointerDown, onPointerMove, onPointerUp, undo, clear,
    addRemoteStroke, replaceStrokes,
  };
}
