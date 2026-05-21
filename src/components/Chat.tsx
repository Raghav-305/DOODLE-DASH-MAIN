import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useGameContext } from "@/context/GameContext";

interface Props {
  mode: "guessing" | "guessed" | "drawer";
  onGuess: (text: string) => void;
}

export function Chat({ mode, onGuess }: Props) {
  const { messages, players } = useGameContext();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const placeholder =
    mode === "drawer" ? "You're drawing!" :
    mode === "guessed" ? "Chat with other guessers..." :
    "Type your guess...";

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onGuess(t);
    setText("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") send();
  };

  return (
    <div className="card-soft p-4 flex flex-col h-full min-h-[400px]">
      <h3 className="font-display text-subtitle mb-2">Chat</h3>
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {messages.map((m) => {
          if (m.type === "system") return (
            <div key={m.id} className="text-center text-caption italic text-muted-foreground anim-fade-in">
              {m.text}
            </div>
          );
          if (m.type === "correct") return (
            <div key={m.id} className="anim-pop text-center font-bold text-body-md py-1 rounded-lg"
              style={{ background: "#E8F8EA", color: "#2E7D32" }}>
              {m.text}
            </div>
          );
          if (m.type === "own") return (
            <div key={m.id} className="flex justify-end anim-slide-up">
              <div className="rounded-2xl px-3 py-1.5 text-body-md font-bold text-white" style={{ background: "#4ECDC4" }}>
                {m.text}
              </div>
            </div>
          );
          const player = players.find((p) => p.id === m.playerId || p.name === m.playerName);
          return (
            <div key={m.id} className="flex items-start gap-2 anim-slide-up">
              {player ? <Avatar id={player.avatar} size={24} /> : <div className="w-6 h-6" />}
              <div className="text-body-md">
                <span className="font-bold mr-1">{m.playerName}:</span>
                <span>{m.text}</span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          className="input-sketch"
          placeholder={placeholder}
          disabled={mode === "drawer"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          maxLength={80}
        />
        <button
          onClick={send}
          disabled={mode === "drawer" || !text.trim()}
          className="btn-3d btn-coral !p-3"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
