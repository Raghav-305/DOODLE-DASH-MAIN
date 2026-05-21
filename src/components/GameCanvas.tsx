import { useEffect, useRef } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { Undo2, Eraser, Trash2, Pencil } from "lucide-react";
import { useGameContext } from "@/context/GameContext";
import { useSocket } from "@/hooks/useSocket";
import type { Stroke } from "@/hooks/useCanvas";

interface Props {
  isDrawer: boolean;
  overlay?: React.ReactNode;
}

const COLORS = ["#2D3436", "#FFFFFF", "#FF0000", "#0000FF", "#00FF00", "#FFFF00", "#FF6B6B", "#4ECDC4", "#8B4513", "#FFA500", "#800080", "#FFC0CB"];
const SIZES = [4, 8, 16, 24];

export function GameCanvas({ isDrawer, overlay }: Props) {
  const { sendStroke, clearCanvas, undoCanvas } = useGameContext();
  const { socket } = useSocket();
  const c = useCanvas({ enabled: isDrawer, onStrokeComplete: sendStroke });
  const containerRef = useRef<HTMLDivElement>(null);

  // size canvas to container while keeping internal pixel buffer
  useEffect(() => {
    const cv = c.canvasRef.current;
    if (!cv) return;
    cv.width = 1600;
    cv.height = 1200;
    const ctx = cv.getContext("2d");
    if (ctx) { ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, cv.width, cv.height); }
  }, [c.canvasRef]);

  useEffect(() => {
    const onStroke = (stroke: Stroke) => {
      console.log("[canvas] stroke_broadcast", stroke);
      c.addRemoteStroke(stroke);
    };
    const onHistory = (strokes: Stroke[]) => {
      console.log("[canvas] canvas_history", { strokes: strokes.length });
      c.replaceStrokes(strokes);
    };
    const onClear = () => {
      console.log("[canvas] canvas_clear");
      c.clear();
    };
    const onUndo = () => {
      console.log("[canvas] canvas_undo");
      c.undo();
    };

    socket.on("stroke_broadcast", onStroke);
    socket.on("canvas_history", onHistory);
    socket.on("canvas_clear", onClear);
    socket.on("canvas_undo", onUndo);

    return () => {
      socket.off("stroke_broadcast", onStroke);
      socket.off("canvas_history", onHistory);
      socket.off("canvas_clear", onClear);
      socket.off("canvas_undo", onUndo);
    };
  }, [c, socket]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative card-soft mx-auto overflow-hidden"
        style={{ aspectRatio: "4 / 3", maxWidth: 800, padding: 0, background: "white" }}
      >
        <canvas
          ref={c.canvasRef}
          className="w-full h-full block touch-none"
          style={{ cursor: isDrawer ? (c.tool === "eraser" ? "cell" : "crosshair") : "default" }}
          onPointerDown={c.onPointerDown}
          onPointerMove={c.onPointerMove}
          onPointerUp={c.onPointerUp}
          onPointerCancel={c.onPointerUp}
          onPointerLeave={c.onPointerUp}
        />
        {overlay && (
          <div className="absolute inset-0 flex items-center justify-center">{overlay}</div>
        )}
      </div>

      {isDrawer && (
        <div className="mt-4 mx-auto max-w-3xl card-soft p-3 flex flex-wrap items-center gap-4 justify-center">
          {/* Colors */}
          <div className="flex flex-wrap gap-2">
            {COLORS.map((col) => {
              const active = c.color === col && c.tool === "pen";
              return (
                <button
                  key={col}
                  onClick={() => { c.setColor(col); c.setTool("pen"); }}
                  aria-label={`color ${col}`}
                  className="w-7 h-7 rounded-full transition-transform"
                  style={{
                    background: col,
                    border: col.toUpperCase() === "#FFFFFF" ? "2px solid #2D3436" : "1px solid rgba(0,0,0,0.1)",
                    boxShadow: active ? "0 0 0 3px #FFEAA7, 0 0 0 5px #2D3436" : "none",
                    transform: active ? "scale(1.1)" : "scale(1)",
                  }}
                />
              );
            })}
          </div>

          <span className="w-px h-7 bg-ink/20" />

          {/* Sizes */}
          <div className="flex items-center gap-2">
            {SIZES.map((s) => {
              const active = c.size === s;
              return (
                <button
                  key={s}
                  onClick={() => c.setSize(s)}
                  aria-label={`size ${s}`}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform border-2"
                  style={{ borderColor: active ? "#FF6B6B" : "transparent", background: "#FFF8F0" }}
                >
                  <span
                    className="rounded-full bg-ink"
                    style={{ width: s, height: s, background: "#2D3436" }}
                  />
                </button>
              );
            })}
          </div>

          <span className="w-px h-7 bg-ink/20" />

          {/* Tools */}
          <div className="flex items-center gap-2">
            <ToolBtn label="Undo" onClick={() => { c.undo(); undoCanvas(); }}><Undo2 size={16} /></ToolBtn>
            <ToolBtn
              label="Eraser"
              onClick={() => c.setTool(c.tool === "eraser" ? "pen" : "eraser")}
              active={c.tool === "eraser"}
            >
              <Eraser size={16} />
            </ToolBtn>
            <ToolBtn label="Pen" onClick={() => c.setTool("pen")} active={c.tool === "pen"}>
              <Pencil size={16} />
            </ToolBtn>
            <ToolBtn label="Clear" onClick={() => { if (confirm("Clear canvas?")) { c.clear(); clearCanvas(); } }}>
              <Trash2 size={16} />
            </ToolBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({ children, onClick, label, active }: { children: React.ReactNode; onClick: () => void; label: string; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-transform active:scale-95"
      style={{
        borderColor: "#2D3436",
        background: active ? "#FFEAA7" : "white",
      }}
    >
      {children}
    </button>
  );
}
