import { useMemo } from "react";
import { Crown, RotateCcw, Home } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useGameContext } from "@/context/GameContext";

export function GameOver() {
  const { players, isHost, returnToLobby, leaveRoom } = useGameContext();
  const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const max = Math.max(1, ...sorted.map((p) => p.score));
  const podium = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
  const heights = [110, 150, 80]; // positions: 2nd, 1st, 3rd

  return (
    <div className="relative min-h-screen px-4 py-10 max-w-4xl mx-auto overflow-hidden">
      <Confetti />
      <div className="text-center mb-8">
        <h1 className="font-display text-display anim-pop">Game Over!</h1>
        <p className="text-body-md text-muted-foreground">Final scores below - well drawn.</p>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 sm:gap-6 mb-10">
        {podium.map((p, i) => {
          if (!p) return null;
          const isFirst = i === 1;
          const colors = ["#C0C0C0", "#FFD54A", "#CD7F32"];
          return (
            <div key={p.id} className="flex flex-col items-center anim-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="relative">
                {isFirst && <Crown className="absolute -top-7 left-1/2 -translate-x-1/2 text-[#FFD54A]" size={32} />}
                <Avatar id={p.avatar} size={isFirst ? 72 : 56} />
              </div>
              <div className="font-display text-subtitle mt-2">{p.name}</div>
              <div className="text-caption text-muted-foreground">{p.score} pts</div>
              <div
                className="mt-2 w-20 sm:w-28 rounded-t-2xl border-2 flex items-start justify-center pt-2 font-display text-heading"
                style={{
                  height: heights[i],
                  background: colors[i],
                  borderColor: "#2D3436",
                  borderBottom: "none",
                }}
              >
                {i === 0 ? "2" : i === 1 ? "1" : "3"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div className="card-hand p-5 mb-8">
        <h2 className="font-display text-subtitle mb-3">Final Leaderboard</h2>
        <ul className="space-y-3">
          {sorted.map((p, idx) => (
            <li key={p.id} className="flex items-center gap-3">
              <span className="font-display w-6 text-center text-muted-foreground">{idx + 1}</span>
              <Avatar id={p.avatar} size={32} />
              <span className="font-bold text-body-md w-24 truncate">{p.name}</span>
              <div className="flex-1 h-3 rounded-full bg-muted border-2" style={{ borderColor: "#2D3436" }}>
                <div className="h-full rounded-full" style={{ width: `${(p.score / max) * 100}%`, background: "#FF6B6B" }} />
              </div>
              <span className="font-display text-subtitle w-12 text-right">{p.score}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {isHost && (
          <button
            className="btn-3d btn-coral"
            onClick={returnToLobby}
          >
            <RotateCcw size={16} /> Return to Lobby
          </button>
        )}
        <button className="btn-3d btn-ghost" onClick={returnToLobby}>
          <Home size={16} /> Back to Lobby
        </button>
        <button
          className="text-caption underline text-muted-foreground"
          onClick={leaveRoom}
        >
          Leave Game
        </button>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 60 });
  const palette = ["#FF6B6B", "#4ECDC4", "#FFEAA7", "#A78BFA", "#6FCF7B", "#F2994A"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const cx = (Math.random() - 0.5) * 200;
        const cr = (Math.random() * 720) + 360;
        const delay = Math.random() * 1.5;
        const dur = 3 + Math.random() * 2.5;
        const color = palette[i % palette.length];
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              top: -20,
              left: `${left}%`,
              width: 8 + Math.random() * 6,
              height: 12 + Math.random() * 8,
              background: color,
              borderRadius: 2,
              transform: `rotate(${Math.random() * 360}deg)`,
              ["--cx" as any]: `${cx}px`,
              ["--cr" as any]: `${cr}deg`,
              animation: `confettiFall ${dur}s ${delay}s linear forwards`,
            }}
          />
        );
      })}
    </div>
  );
}
