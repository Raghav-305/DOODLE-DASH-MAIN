import { createFileRoute } from "@tanstack/react-router";
import { GameProvider, useGameContext } from "@/context/GameContext";
import { Landing } from "@/components/Landing";
import { Lobby } from "@/components/Lobby";
import { Game } from "@/components/Game";
import { GameOver } from "@/components/GameOver";
import { useSocket } from "@/hooks/useSocket";
import { ConnectionBanner } from "@/components/ConnectionBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DoodleGuess — Draw, guess, and laugh with friends" },
      { name: "description", content: "A playful multiplayer drawing & guessing game. Create a room, invite friends, and doodle your way to victory." },
      { property: "og:title", content: "DoodleGuess" },
      { property: "og:description", content: "Draw, guess, and laugh with friends in this playful multiplayer party game." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}

function Shell() {
  const { view } = useGameContext();
  const { state } = useSocket();
  return (
    <>
      <ConnectionBanner state={state} />
      <main key={view} className="anim-fade-in">
        {view === "LANDING" && <Landing />}
        {view === "LOBBY" && <Lobby />}
        {view === "GAME" && <Game />}
        {view === "GAME_OVER" && <GameOver />}
      </main>
    </>
  );
}
