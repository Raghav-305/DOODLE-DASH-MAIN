import { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { useGameContext, RoomSettings } from "@/context/GameContext";
import { SketchSlider } from "@/components/ui/SketchSlider";
import { SketchToggle } from "@/components/ui/SketchToggle";

interface Props { onClose: () => void; onCreate: () => void }

const ROUNDS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const TIMES = [30, 60, 90, 120];

export function SettingsModal({ onClose, onCreate }: Props) {
  const { settings, setSettings, createRoom } = useGameContext();
  const [draft, setDraft] = useState<RoomSettings>(settings);
  const update = <K extends keyof RoomSettings>(k: K, v: RoomSettings[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in"
      style={{ background: "rgba(0,0,0,0.32)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="card-hand bg-white w-full max-w-md p-6 anim-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <h2 className="font-display text-heading">Room Settings</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 hover:rotate-90 transition-transform">
            <X size={20} />
          </button>
        </div>
        <p className="text-caption text-muted-foreground mb-5">Tweak the chaos to taste.</p>

        {/* Max players */}
        <Section label="Max Players">
          <SketchSlider value={draft.maxPlayers} min={2} max={12} onChange={(v) => update("maxPlayers", v)} />
        </Section>

        {/* Rounds */}
        <Section label="Rounds">
          <div className="flex flex-wrap gap-2">
            {ROUNDS.map((r) => (
              <button
                key={r}
                onClick={() => update("rounds", r)}
                className="chip transition-transform active:scale-95"
                style={{
                  background: draft.rounds === r ? "#FF6B6B" : "white",
                  color: draft.rounds === r ? "white" : "#2D3436",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </Section>

        {/* Draw time */}
        <Section label="Draw Time">
          <div className="grid grid-cols-4 border-2 rounded-xl overflow-hidden" style={{ borderColor: "#2D3436" }}>
            {TIMES.map((t, i) => (
              <button
                key={t}
                onClick={() => update("drawTime", t)}
                className="py-2 font-bold text-body-md transition-colors"
                style={{
                  background: draft.drawTime === t ? "#4ECDC4" : "white",
                  color: draft.drawTime === t ? "white" : "#2D3436",
                  borderLeft: i === 0 ? "none" : "2px solid #2D3436",
                }}
              >
                {t}s
              </button>
            ))}
          </div>
        </Section>

        {/* Word choices stepper */}
        <Section label="Word Choices">
          <div className="flex items-center gap-3">
            <Stepper value={draft.wordChoices} min={2} max={5} onChange={(v) => update("wordChoices", v)} />
            <span className="text-caption text-muted-foreground">words per turn</span>
          </div>
        </Section>

        {/* Hints */}
        <Section label="Hints">
          <SketchToggle checked={draft.hints} onChange={(b) => update("hints", b)} label={draft.hints ? "On" : "Off"} />
        </Section>

        <button
          className="btn-3d btn-coral w-full mt-6"
          onClick={() => { setSettings(draft); createRoom(draft); onCreate(); }}
        >
          Create Room
        </button>
        <button onClick={onClose} className="block mx-auto mt-3 text-caption underline text-muted-foreground">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b-2 border-dashed last:border-b-0" style={{ borderColor: "#E8DFD0" }}>
      <div className="font-display text-subtitle mb-2">{label}</div>
      {children}
    </div>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        className="w-9 h-9 rounded-full border-2 bg-white flex items-center justify-center active:scale-95"
        style={{ borderColor: "#2D3436" }}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={16} />
      </button>
      <span className="font-display text-subtitle w-8 text-center">{value}</span>
      <button
        className="w-9 h-9 rounded-full border-2 bg-white flex items-center justify-center active:scale-95"
        style={{ borderColor: "#2D3436" }}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
