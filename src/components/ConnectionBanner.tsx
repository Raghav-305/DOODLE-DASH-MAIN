import { ConnState } from "@/hooks/useSocket";

export function ConnectionBanner({ state }: { state: ConnState }) {
  if (state === "connected") return null;
  const text =
    state === "connecting" ? "Connecting" :
    state === "reconnecting" ? "Connection lost. Reconnecting" : "Disconnected";
  const bg = state === "disconnected" ? "#EB5757" : "#FFEAA7";
  const color = state === "disconnected" ? "white" : "#2D3436";
  return (
    <div
      className="fixed top-0 inset-x-0 z-50 text-center py-2 font-bold text-body-md anim-pulse-soft"
      style={{ background: bg, color, borderBottom: "2px solid #2D3436" }}
    >
      {text}
      <span className="anim-bounce-dots"><span>.</span><span>.</span><span>.</span></span>
    </div>
  );
}
