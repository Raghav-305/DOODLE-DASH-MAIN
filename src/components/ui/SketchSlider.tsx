import { useRef } from "react";

interface Props { value: number; min: number; max: number; step?: number; onChange: (n: number) => void }

export function SketchSlider({ value, min, max, step = 1, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = ((value - min) / (max - min)) * 100;
  const set = (clientX: number) => {
    const t = trackRef.current; if (!t) return;
    const r = t.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const stepped = Math.round((min + p * (max - min)) / step) * step;
    onChange(Math.max(min, Math.min(max, stepped)));
  };
  return (
    <div className="flex items-center gap-3">
      <div
        ref={trackRef}
        className="relative flex-1 h-3 bg-muted rounded-full cursor-pointer border-2"
        style={{ borderColor: "#2D3436" }}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); set(e.clientX); }}
        onPointerMove={(e) => { if (e.buttons) set(e.clientX); }}
      >
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: "#FF6B6B" }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2"
          style={{ left: `calc(${pct}% - 12px)`, borderColor: "#2D3436", boxShadow: "0 2px 0 0 #2D3436" }}
        />
      </div>
      <span className="chip min-w-12 justify-center">{value}</span>
    </div>
  );
}
