import { Trophy, Pencil, CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Player } from "@/context/GameContext";

export function Leaderboard({ players, currentId }: { players: Player[]; currentId: string }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="card-soft p-4 h-full min-h-[400px]">
      <h3 className="font-display text-subtitle mb-3 flex items-center gap-2">
        <Trophy size={18} className="text-coral" /> Leaderboard
      </h3>
      <ul className="space-y-1">
        {sorted.map((p, i) => {
          const isMe = p.id === currentId;
          return (
            <li
              key={p.id}
              className="flex items-center gap-2 px-2 py-2 rounded-xl transition-all"
              style={{
                background: isMe ? "#FFF1E1" : "transparent",
                opacity: p.guessed ? 0.6 : 1,
                border: isMe ? "2px dashed #FF6B6B" : "2px dashed transparent",
              }}
            >
              <span className="font-display w-5 text-center text-muted-foreground">{i + 1}</span>
              <Avatar id={p.avatar} size={28} />
              <span className="text-body-md font-bold flex-1 truncate">{p.name}</span>
              {p.drawing && <Pencil size={14} className="text-teal" />}
              {p.guessed && <CheckCircle2 size={14} className="text-[color:var(--color-success)]" style={{ color: "#6FCF7B" }} />}
              <span className="font-display text-subtitle">{p.score}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
