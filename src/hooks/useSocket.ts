import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export type ConnState = "connecting" | "connected" | "disconnected" | "reconnecting";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
let socketSingleton: Socket | null = null;

export function getSocket(): Socket {
  if (!socketSingleton) {
    socketSingleton = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      autoConnect: false,
    });
  }

  return socketSingleton;
}

export function useSocket() {
  const socketRef = useRef<Socket>(getSocket());
  const [state, setState] = useState<ConnState>(
    socketRef.current.connected ? "connected" : "connecting",
  );

  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => {
      console.log("[socket] Connected to backend", {
        id: socket.id,
        url: socketUrl,
      });
      setState("connected");
    };
    const onDisconnect = (reason: string) => {
      console.log("[socket] Disconnected from backend", { reason });
      setState("disconnected");
    };
    const onReconnectAttempt = (attempt: number) => {
      console.log("[socket] Reconnecting to backend", { attempt, url: socketUrl });
      setState("reconnecting");
    };
    const onConnectError = (error: Error) => {
      console.error("[socket] Backend connection error", {
        message: error.message,
        url: socketUrl,
      });
      setState("disconnected");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("connect_error", onConnectError);

    if (!socket.connected) {
      console.log("[socket] Connecting to backend", { url: socketUrl });
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  const emit = useCallback((event: string, payload?: unknown) => {
    console.log("[socket] emit", event, payload);
    socketRef.current.emit(event, payload);
  }, []);

  const reconnect = useCallback(() => {
    setState("reconnecting");
    socketRef.current.connect();
  }, []);

  return { socket: socketRef.current, state, emit, reconnect };
}
