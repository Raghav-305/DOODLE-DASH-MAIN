import { useMemo } from "react";
import { useGameContext } from "@/context/GameContext";
import { GameCanvas } from "@/components/GameCanvas";
import { Chat } from "@/components/Chat";
import { Leaderboard } from "@/components/Leaderboard";

export function Game() {
  const {
    players,
    settings,
    round,
    phase,
    currentPlayerId,
    drawerId,
    wordChoices,
    currentWord,
    wordTemplate,
    timeLeft,
    selectWord,
    submitMessage,
  } = useGameContext();

  const drawer = useMemo(() => players.find((p) => p.id === drawerId) ?? players[0], [drawerId, players]);
  const isDrawer = drawer?.id === currentPlayerId;
  const me = players.find((p) => p.id === currentPlayerId);

  const onGuess = (text: string) => {
    submitMessage(text, phase === "DRAWING" && !isDrawer && !me?.guessed);
  };

  const timerColor = timeLeft > 30 ? "#6FCF7B" : timeLeft > 10 ? "#F2C94C" : "#EB5757";
  const timerPct = Math.max(0, Math.min(1, timeLeft / settings.drawTime));
  const wordDisplay = isDrawer ? currentWord.toUpperCase() : wordTemplate;
  const mode = isDrawer ? "drawer" : me?.guessed ? "guessed" : "guessing";

  const overlay =
    phase === "WORD_SELECTION" ? (
      isDrawer ? (
        <div className="w-full h-full p-6 flex flex-col items-center justify-center" style={{ background: "rgba(255,255,255,0.92)" }}>
          <h3 className="font-display text-heading mb-4">Choose your word!</h3>
          <div className="grid sm:grid-cols-3 gap-3 w-full max-w-2xl">
            {wordChoices.slice(0, settings.wordChoices).map((word) => (
              <button
                key={word}
                onClick={() => selectWord(word)}
                className="card-soft p-4 hover:-translate-y-1 transition-transform active:scale-95"
              >
                <div className="font-display text-subtitle mb-1">{word.toUpperCase()}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-6" style={{ background: "rgba(255,248,240,0.96)" }}>
          <p className="font-display text-heading">{drawer?.name} is choosing a word</p>
          <p className="text-caption text-muted-foreground mt-1 anim-bounce-dots">
            Get ready<span>.</span><span>.</span><span>.</span>
          </p>
        </div>
      )
    ) : phase === "INTERMISSION" ? (
      <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: "rgba(255,248,240,0.96)" }}>
        <p className="text-caption text-muted-foreground">The word was</p>
        <h3 className="font-display text-display anim-pop">{currentWord.toUpperCase()}</h3>
        <p className="mt-3 text-body-md text-muted-foreground">Next round soon...</p>
      </div>
    ) : null;

  return (
    <div className="min-h-screen px-4 py-5 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="chip" style={{ background: "#FFEAA7", padding: "6px 12px", fontSize: 14 }}>
          Round {round} / {settings.rounds}
        </span>

        <CircleTimer seconds={timeLeft} pct={timerPct} color={timerColor} />

        <div className="card-soft px-4 py-2 max-w-sm">
          <div className="text-caption text-muted-foreground">
            {isDrawer ? "Your word" : "Guess the word"}
          </div>
          <div className="font-display text-subtitle tracking-[0.2em]">
            {phase === "DRAWING" ? wordDisplay : "-"}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr_300px] gap-4">
        <div className="hidden lg:block">
          <Leaderboard players={players} currentId={currentPlayerId} />
        </div>
        <GameCanvas isDrawer={isDrawer && phase === "DRAWING"} overlay={overlay} />
        <div className="hidden lg:block">
          <Chat mode={mode} onGuess={onGuess} />
        </div>
      </div>

      <div className="lg:hidden mt-4 grid gap-4">
        <Leaderboard players={players} currentId={currentPlayerId} />
        <Chat mode={mode} onGuess={onGuess} />
      </div>
    </div>
  );
}

function CircleTimer({ seconds, pct, color }: { seconds: number; pct: number; color: string }) {
  const r = 48;
  const C = 2 * Math.PI * r;
  return (
    <div className={`relative ${seconds <= 10 ? "anim-shake" : ""}`} style={{ width: 110, height: 110 }}>
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="white" stroke="#F0E7D6" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: "stroke-dashoffset 200ms linear, stroke 200ms" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-display text-heading">
        {Math.max(0, seconds)}
      </div>
    </div>
  );
}
