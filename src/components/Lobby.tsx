import { useState } from "react";
import { Copy, Check, Crown, Users, Repeat, Clock, Lightbulb, Play, LogOut } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useGameContext } from "@/context/GameContext";

export function Lobby() {
  const { roomId, players, settings, isHost, startGame, leaveRoom } = useGameContext();
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/?room=${roomId}` : `?room=${roomId}`;

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-heading">Lobby</h1>
        <button
          onClick={() => copy(roomId)}
          className="chip bg-yellow-warm hover:scale-105 transition-transform"
          style={{ background: "#FFEAA7", paddingInline: 14, paddingBlock: 8, fontSize: 14 }}
        >
          Room: <span className="font-display tracking-wider ml-1">{roomId}</span>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Players */}
        <div className="md:col-span-3 card-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-subtitle">Players ({players.length}/{settings.maxPlayers})</h2>
            {players.length < 2 && (
              <span className="text-caption text-muted-foreground anim-bounce-dots">
                Waiting<span>.</span><span>.</span><span>.</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="card-soft p-3 flex flex-col items-center gap-2 anim-slide-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="relative">
                  <Avatar id={p.avatar} size={56} />
                  {p.isHost && (
                    <span className="chip absolute -top-2 -right-3" style={{ background: "#FFEAA7", padding: "2px 6px", fontSize: 10 }}>
                      <Crown size={10} /> HOST
                    </span>
                  )}
                </div>
                <div className="text-body-md font-bold truncate max-w-full">{p.name}</div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: p.ready ? "#6FCF7B" : "#C7C2BB", animation: p.ready ? "pulseSoft 1.6s infinite" : "none" }}
                  />
                  <span className="text-caption text-muted-foreground">{p.ready ? "Ready" : "Idle"}</span>
                </div>
                {p.id === "me" && (
                  <span className="chip" style={{ fontSize: 10, padding: "2px 8px", background: "#4ECDC4", color: "white" }}>YOU</span>
                )}
              </div>
            ))}
          </div>

          {players.length < 2 && (
            <div className="mt-6 card-soft p-5 text-center" style={{ background: "#FFF8F0" }}>
              <div className="text-4xl mb-1" aria-hidden>
                <svg width="64" height="64" viewBox="0 0 64 64" className="mx-auto">
                  <circle cx="32" cy="32" r="26" fill="#FFEAA7" stroke="#2D3436" strokeWidth="2" />
                  <path d="M22 38 Q32 46 42 38" stroke="#2D3436" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <circle cx="24" cy="28" r="2" fill="#2D3436" />
                  <circle cx="40" cy="28" r="2" fill="#2D3436" />
                </svg>
              </div>
              <p className="font-display text-subtitle mb-2">Invite friends to start!</p>
              <button onClick={() => copy(inviteUrl)} className="btn-3d btn-yellow text-body-md py-2">
                <Copy size={16} /> Copy Invite Link
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:col-span-2 card-soft p-5 flex flex-col">
          <h2 className="font-display text-subtitle mb-4">Room Info</h2>
          <ul className="space-y-3 text-body-md">
            <InfoRow icon={<Users size={18} className="text-coral" />} label={`${settings.maxPlayers} max players`} />
            <InfoRow icon={<Repeat size={18} className="text-teal" />} label={`${settings.rounds} rounds`} />
            <InfoRow icon={<Clock size={18} className="text-coral" />} label={`${settings.drawTime}s draw time`} />
            <InfoRow icon={<Lightbulb size={18} className="text-teal" />} label={`Hints ${settings.hints ? "on" : "off"}`} />
          </ul>

          <div className="flex-1" />

          <div className="mt-6">
            {isHost ? (
              <button
                className="btn-3d btn-coral w-full text-subtitle anim-pulse-soft"
                disabled={players.length < 2}
                onClick={startGame}
              >
                <Play size={18} /> Start Game
              </button>
            ) : (
              <div className="card-soft p-3 text-center text-body-md">
                Waiting for host<span className="anim-bounce-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
            )}
            <button
              onClick={leaveRoom}
              className="mt-3 mx-auto flex items-center gap-1 text-caption text-muted-foreground hover:text-ink"
            >
              <LogOut size={12} /> Leave room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl border-2 flex items-center justify-center bg-white" style={{ borderColor: "#2D3436" }}>
        {icon}
      </span>
      <span className="font-bold">{label}</span>
    </li>
  );
}
