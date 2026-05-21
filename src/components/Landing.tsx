import { useState } from "react";
import { PlusCircle, LogIn, Sparkles } from "lucide-react";
import { Avatar, AVATAR_IDS } from "@/components/Avatar";
import { useGameContext } from "@/context/GameContext";
import { CodeInput } from "@/components/ui/CodeInput";
import { SettingsModal } from "@/components/SettingsModal";

export function Landing() {
  const { playerName, setPlayerName, playerAvatar, setPlayerAvatar, joinRoom } = useGameContext();
  const [code, setCode] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const canCreate = playerName.trim().length >= 2;
  const canJoin = canCreate && code.length === 6;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        {/* Logo */}
        <div className="text-center mb-8 anim-fade-in">
          <div className="inline-flex items-center gap-3">
            <Sparkles className="text-coral" size={28} />
            <h1 className="font-display text-display" style={{ color: "#2D3436" }}>
              Doodle<span style={{ color: "#FF6B6B" }}>Guess</span>
            </h1>
            <Sparkles className="text-teal" size={28} />
          </div>
          <svg viewBox="0 0 200 12" className="mx-auto mt-1 w-56 h-3">
            <path d="M2 6 Q 20 1, 40 6 T 80 6 T 120 6 T 160 6 T 198 6"
              stroke="#FF6B6B" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
          <p className="mt-3 italic text-body-md text-muted-foreground">
            Draw, guess, and laugh with friends!
          </p>
        </div>

        {/* Main card */}
        <div className="card-hand p-6 md:p-8 anim-slide-up">
          {/* Avatar */}
          <label className="block font-display text-subtitle mb-3">Pick a doodle</label>
          <div className="grid grid-cols-9 gap-2 sm:gap-3 mb-6 max-w-md mx-auto">
            {AVATAR_IDS.map((id) => {
              const selected = id === playerAvatar;
              return (
                <button
                  key={id}
                  onClick={() => setPlayerAvatar(id)}
                  className="rounded-2xl transition-transform hover:scale-110 active:scale-95"
                  style={{
                    padding: 3,
                    background: selected ? "#FFEAA7" : "transparent",
                    boxShadow: selected ? "0 0 0 2px #FF6B6B, 0 0 14px rgba(255,107,107,0.35)" : "none",
                    borderRadius: 14,
                  }}
                  aria-label={`avatar ${id}`}
                >
                  <Avatar id={id} size={48} />
                </button>
              );
            })}
          </div>

          {/* Name */}
          <label className="block font-display text-subtitle mb-2">Your Name</label>
          <input
            className="input-sketch mb-6"
            placeholder="Enter your nickname..."
            value={playerName}
            maxLength={16}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <hr className="divider-dashed" />

          {/* Actions */}
          <div className="grid md:grid-cols-2 gap-5 mt-2">
            {/* Create */}
            <div className="card-soft p-5">
              <div className="flex items-center gap-2 mb-2">
                <PlusCircle size={22} className="text-coral" />
                <h3 className="font-display text-subtitle">Create Room</h3>
              </div>
              <p className="text-caption text-muted-foreground mb-4">
                Set the rules and invite your crew.
              </p>
              <button
                className="btn-3d btn-coral w-full"
                disabled={!canCreate}
                onClick={() => setShowSettings(true)}
              >
                Create Private Room
              </button>
            </div>

            {/* Join */}
            <div className="card-soft p-5">
              <div className="flex items-center gap-2 mb-2">
                <LogIn size={22} className="text-teal" />
                <h3 className="font-display text-subtitle">Join Room</h3>
              </div>
              <p className="text-caption text-muted-foreground mb-3">
                Enter the 6-character room code.
              </p>
              <CodeInput value={code} onChange={setCode} />
              <button
                className="btn-3d btn-teal w-full mt-4"
                disabled={!canJoin}
                onClick={() => joinRoom(code)}
              >
                Join Game
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-caption text-muted-foreground mt-6">
          Made with squiggles. v1.0
        </p>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onCreate={() => {
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}
