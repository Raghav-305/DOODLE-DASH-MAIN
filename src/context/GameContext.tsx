import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { AVATAR_IDS } from "@/components/Avatar";
import { useSocket } from "@/hooks/useSocket";
import type { Stroke } from "@/hooks/useCanvas";

export type ViewState = "LANDING" | "LOBBY" | "GAME" | "GAME_OVER";
export type GamePhase = "LOBBY" | "WORD_SELECTION" | "DRAWING" | "INTERMISSION" | "GAME_OVER";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  ready: boolean;
  isHost: boolean;
  guessed?: boolean;
  drawing?: boolean;
  connected?: boolean;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordChoices: number;
  hints: boolean;
}

export interface ChatMessage {
  id: string;
  type: "system" | "guess" | "correct" | "own";
  playerId?: string;
  playerName?: string;
  text: string;
  ts: number;
}

interface BackendPlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  hasGuessed: boolean;
}

interface BackendSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordChoicesCount: number;
  hintsEnabled: boolean;
}

interface Ctx {
  view: ViewState; setView: (v: ViewState) => void;
  phase: GamePhase;
  playerName: string; setPlayerName: (s: string) => void;
  playerAvatar: string; setPlayerAvatar: (s: string) => void;
  currentPlayerId: string;
  roomId: string; setRoomId: (s: string) => void;
  isHost: boolean; setIsHost: (b: boolean) => void;
  settings: RoomSettings; setSettings: (s: RoomSettings) => void;
  players: Player[]; setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  messages: ChatMessage[]; pushMessage: (m: Omit<ChatMessage, "id" | "ts">) => void;
  round: number; setRound: (n: number) => void;
  drawerId: string | null;
  wordChoices: string[];
  currentWord: string;
  wordTemplate: string;
  timeLeft: number;
  createRoom: (settingsOverride?: RoomSettings) => void;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  selectWord: (word: string) => void;
  submitMessage: (text: string, asGuess: boolean) => void;
  sendStroke: (stroke: Stroke) => void;
  clearCanvas: () => void;
  undoCanvas: () => void;
  returnToLobby: () => void;
}

const GameCtx = createContext<Ctx | null>(null);

const DEFAULT_SETTINGS: RoomSettings = {
  maxPlayers: 8, rounds: 3, drawTime: 60, wordChoices: 3, hints: true,
};

const mapSettingsToBackend = (settings: RoomSettings): Partial<BackendSettings> => ({
  maxPlayers: settings.maxPlayers,
  rounds: settings.rounds,
  drawTime: settings.drawTime,
  wordChoicesCount: settings.wordChoices,
  hintsEnabled: settings.hints,
});

const mapSettingsFromBackend = (settings: BackendSettings): RoomSettings => ({
  maxPlayers: settings.maxPlayers,
  rounds: settings.rounds,
  drawTime: settings.drawTime,
  wordChoices: settings.wordChoicesCount,
  hints: settings.hintsEnabled,
});

const mapPlayers = (players: BackendPlayer[], drawerId: string | null): Player[] =>
  players.map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    score: p.score,
    ready: p.isReady || p.isConnected,
    isHost: p.isHost,
    guessed: p.hasGuessed,
    drawing: p.id === drawerId,
    connected: p.isConnected,
  }));

const makeMessageId = () => Math.random().toString(36).slice(2);

export function GameProvider({ children }: { children: ReactNode }) {
  const { socket, emit } = useSocket();
  const [view, setView] = useState<ViewState>("LANDING");
  const [phase, setPhase] = useState<GamePhase>("LOBBY");
  const [playerName, setPlayerName] = useState("");
  const [playerAvatar, setPlayerAvatar] = useState(AVATAR_IDS[0]);
  const [currentPlayerId, setCurrentPlayerId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [round, setRound] = useState(1);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [wordTemplate, setWordTemplate] = useState("");
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.drawTime);

  const pushMessage = useCallback((m: Omit<ChatMessage, "id" | "ts">) => {
    setMessages((prev) => [...prev, { ...m, id: makeMessageId(), ts: Date.now() }]);
  }, []);

  const syncPlayers = useCallback((backendPlayers: BackendPlayer[], nextDrawerId: string | null) => {
    setPlayers(mapPlayers(backendPlayers, nextDrawerId));
  }, []);

  useEffect(() => {
    const logEvent = (event: string, payload: unknown) => console.log("[socket] event", event, payload);

    const onRoomCreated = (data: { roomId: string; playerId: string; player: BackendPlayer }) => {
      logEvent("room_created", data);
      setRoomId(data.roomId);
      setCurrentPlayerId(data.playerId);
      setIsHost(true);
      setPlayers(mapPlayers([data.player], null));
      setMessages([]);
      setPhase("LOBBY");
      setView("LOBBY");
    };

    const onRoomJoined = (data: {
      roomId: string;
      playerId: string;
      settings: BackendSettings;
      players: BackendPlayer[];
      phase: GamePhase;
    }) => {
      logEvent("room_joined", data);
      setRoomId(data.roomId);
      setCurrentPlayerId(data.playerId);
      setSettings(mapSettingsFromBackend(data.settings));
      setIsHost(data.players.find((p) => p.id === data.playerId)?.isHost ?? false);
      setPhase(data.phase);
      syncPlayers(data.players, null);
      setMessages([]);
      setView(data.phase === "LOBBY" ? "LOBBY" : "GAME");
    };

    const onState = (state: {
      phase: GamePhase;
      round: number;
      totalRounds: number;
      drawerId: string | null;
      wordTemplate: string | null;
      players: BackendPlayer[];
      settings: BackendSettings;
    }) => {
      logEvent("game_state_update", state);
      setPhase(state.phase);
      setRound(state.round || 1);
      setDrawerId(state.drawerId);
      setWordTemplate(state.wordTemplate ?? "");
      setSettings(mapSettingsFromBackend(state.settings));
      syncPlayers(state.players, state.drawerId);
      setIsHost(state.players.find((p) => p.id === currentPlayerId)?.isHost ?? false);

      if (state.phase === "LOBBY") setView("LOBBY");
      if (state.phase === "WORD_SELECTION" || state.phase === "DRAWING" || state.phase === "INTERMISSION") setView("GAME");
      if (state.phase === "GAME_OVER") setView("GAME_OVER");
    };

    const onWordSelection = (data: { words: string[]; timeout: number }) => {
      logEvent("word_selection", data);
      setWordChoices(data.words);
      setPhase("WORD_SELECTION");
      setTimeLeft(data.timeout);
      setCurrentWord("");
    };

    const onRoundStart = (data: {
      drawerId: string;
      drawerName: string;
      drawTime: number;
      hintTemplate: string;
      round: number;
      totalRounds: number;
    }) => {
      logEvent("round_start", data);
      setPhase("DRAWING");
      setDrawerId(data.drawerId);
      setRound(data.round);
      setTimeLeft(data.drawTime);
      setWordTemplate(data.hintTemplate);
      pushMessage({ type: "system", text: `${data.drawerName} is drawing!` });
    };

    const onTimer = (data: { remaining: number }) => {
      setTimeLeft(Math.max(0, data.remaining));
    };

    const onHint = (data: { hintTemplate: string }) => {
      logEvent("hint_reveal", data);
      setWordTemplate(data.hintTemplate);
    };

    const onRoundEnd = (data: { word: string; players: BackendPlayer[]; round: number }) => {
      logEvent("round_end", data);
      setPhase("INTERMISSION");
      setCurrentWord(data.word);
      syncPlayers(data.players, drawerId);
      pushMessage({ type: "system", text: `The word was "${data.word.toUpperCase()}"` });
    };

    const onGameOver = (data: { leaderboard: BackendPlayer[] }) => {
      logEvent("game_over", data);
      syncPlayers(data.leaderboard, null);
      setPhase("GAME_OVER");
      setView("GAME_OVER");
    };

    const onGuessResult = (data: { playerId: string; playerName: string; correct: boolean; points: number }) => {
      logEvent("guess_result", data);
      if (data.correct) {
        pushMessage({
          type: "correct",
          playerId: data.playerId,
          playerName: data.playerName,
          text: `${data.playerName} guessed correctly (+${data.points})`,
        });
      }
    };

    const onChat = (data: { playerId: string; playerName: string; text: string; isGuess?: boolean; isClose?: boolean }) => {
      logEvent("chat_message", data);
      const own = data.playerId === currentPlayerId;
      setMessages((prev) => [
        ...prev,
        {
          id: makeMessageId(),
          type: own ? "own" : "guess",
          playerId: data.playerId,
          playerName: data.playerName,
          text: data.isClose ? `${data.text} (close!)` : data.text,
          ts: Date.now(),
        },
      ]);
    };

    const onSystem = (data: { text: string; timestamp?: number }) => {
      logEvent("system_message", data);
      setMessages((prev) => [
        ...prev,
        { id: makeMessageId(), type: "system", text: data.text, ts: data.timestamp ?? Date.now() },
      ]);
    };

    const onError = (data: { message: string }) => {
      console.error("[socket] room_error", data);
      pushMessage({ type: "system", text: data.message });
    };

    socket.on("room_created", onRoomCreated);
    socket.on("room_joined", onRoomJoined);
    socket.on("game_state_update", onState);
    socket.on("word_selection", onWordSelection);
    socket.on("round_start", onRoundStart);
    socket.on("timer_sync", onTimer);
    socket.on("hint_reveal", onHint);
    socket.on("round_end", onRoundEnd);
    socket.on("game_over", onGameOver);
    socket.on("guess_result", onGuessResult);
    socket.on("chat_message", onChat);
    socket.on("system_message", onSystem);
    socket.on("room_error", onError);

    return () => {
      socket.off("room_created", onRoomCreated);
      socket.off("room_joined", onRoomJoined);
      socket.off("game_state_update", onState);
      socket.off("word_selection", onWordSelection);
      socket.off("round_start", onRoundStart);
      socket.off("timer_sync", onTimer);
      socket.off("hint_reveal", onHint);
      socket.off("round_end", onRoundEnd);
      socket.off("game_over", onGameOver);
      socket.off("guess_result", onGuessResult);
      socket.off("chat_message", onChat);
      socket.off("system_message", onSystem);
      socket.off("room_error", onError);
    };
  }, [currentPlayerId, drawerId, pushMessage, socket, syncPlayers]);

  const createRoom = useCallback((settingsOverride?: RoomSettings) => {
    const roomSettings = settingsOverride ?? settings;
    emit("create_room", {
      playerName,
      avatar: playerAvatar,
      settings: mapSettingsToBackend(roomSettings),
    });
  }, [emit, playerAvatar, playerName, settings]);

  const joinRoom = useCallback((code: string) => {
    emit("join_room", {
      roomId: code.trim().toUpperCase(),
      playerName,
      avatar: playerAvatar,
    });
  }, [emit, playerAvatar, playerName]);

  const leaveRoom = useCallback(() => {
    emit("leave_room");
    setView("LANDING");
    setPhase("LOBBY");
    setRoomId("");
    setPlayers([]);
    setMessages([]);
  }, [emit]);

  const startGame = useCallback(() => {
    emit("start_game", { roomId });
  }, [emit, roomId]);

  const selectWord = useCallback((word: string) => {
    setCurrentWord(word);
    emit("select_word", { roomId, word });
  }, [emit, roomId]);

  const submitMessage = useCallback((text: string, asGuess: boolean) => {
    emit(asGuess ? "submit_guess" : "send_chat", { roomId, text });
  }, [emit, roomId]);

  const sendStroke = useCallback((stroke: Stroke) => {
    emit("draw_stroke", { roomId, stroke });
  }, [emit, roomId]);

  const clearCanvas = useCallback(() => {
    emit("canvas_clear", { roomId });
  }, [emit, roomId]);

  const undoCanvas = useCallback(() => {
    emit("canvas_undo", { roomId });
  }, [emit, roomId]);

  const returnToLobby = useCallback(() => {
    emit("return_to_lobby", { roomId });
  }, [emit, roomId]);

  const value = useMemo<Ctx>(() => ({
    view, setView,
    phase,
    playerName, setPlayerName,
    playerAvatar, setPlayerAvatar,
    currentPlayerId,
    roomId, setRoomId,
    isHost, setIsHost,
    settings, setSettings,
    players, setPlayers,
    messages, pushMessage,
    round, setRound,
    drawerId,
    wordChoices,
    currentWord,
    wordTemplate,
    timeLeft,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    selectWord,
    submitMessage,
    sendStroke,
    clearCanvas,
    undoCanvas,
    returnToLobby,
  }), [
    view, phase, playerName, playerAvatar, currentPlayerId, roomId, isHost, settings, players,
    messages, pushMessage, round, drawerId, wordChoices, currentWord, wordTemplate, timeLeft,
    createRoom, joinRoom, leaveRoom, startGame, selectWord, submitMessage, sendStroke,
    clearCanvas, undoCanvas, returnToLobby,
  ]);

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGameContext() {
  const c = useContext(GameCtx);
  if (!c) throw new Error("useGameContext must be used within GameProvider");
  return c;
}
