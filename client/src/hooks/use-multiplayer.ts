import { useCallback, useEffect, useRef, useState } from "react";
import type { CardKey, ServerMessage, WsPlayer } from "@shared/ws-types";

export type GamePhase = "idle" | "lobby" | "starting" | "playing" | "roundEnd" | "gameOver";

export interface RoundResult {
  roundEnded: boolean;
  action: "flip" | "clap" | "timeout";
  actorId: string | null;
  actorName: string | null;
  correct: boolean;
  scores: Record<string, number>;
  streaks: Record<string, number>;
}

export interface MultiplayerState {
  phase: GamePhase;
  myId: string | null;
  isHost: boolean;
  roomCode: string | null;
  players: WsPlayer[];
  hostId: string | null;
  card: CardKey | null;
  chantIndex: number;
  roundNumber: number;
  totalRounds: number;
  scores: Record<string, number>;
  streaks: Record<string, number>;
  lastResult: RoundResult | null;
  gameOver: { scores: Record<string, number>; players: WsPlayer[]; winnerId: string } | null;
  error: string | null;
}

const INITIAL_STATE: MultiplayerState = {
  phase: "idle",
  myId: null,
  isHost: false,
  roomCode: null,
  players: [],
  hostId: null,
  card: null,
  chantIndex: 0,
  roundNumber: 1,
  totalRounds: 10,
  scores: {},
  streaks: {},
  lastResult: null,
  gameOver: null,
  error: null,
};

export function useMultiplayer() {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<MultiplayerState>(INITIAL_STATE);

  const sendMsg = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const connect = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) { resolve(); return; }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("WebSocket connection failed"));

      ws.onmessage = (event) => {
        let msg: ServerMessage;
        try { msg = JSON.parse(event.data); } catch { return; }

        setState((prev) => {
          switch (msg.type) {
            case "room:joined":
              return {
                ...prev,
                phase: "lobby",
                myId: msg.playerId,
                isHost: msg.isHost,
                roomCode: msg.code,
                players: msg.players,
                hostId: msg.isHost ? msg.playerId : prev.hostId,
                error: null,
              };

            case "room:updated":
              return {
                ...prev,
                players: msg.players,
                hostId: msg.hostId,
                isHost: prev.myId === msg.hostId,
              };

            case "game:started":
              return {
                ...prev,
                phase: "starting",
                chantIndex: msg.chantIndex,
                roundNumber: msg.roundNumber,
                totalRounds: msg.totalRounds,
                lastResult: null,
                gameOver: null,
              };

            case "round:card":
              return {
                ...prev,
                phase: "playing",
                card: msg.card,
                chantIndex: msg.chantIndex,
                roundNumber: msg.roundNumber,
                totalRounds: msg.totalRounds,
                lastResult: null,
              };

            case "round:result":
              return {
                ...prev,
                phase: msg.roundEnded ? "roundEnd" : prev.phase,
                scores: msg.scores,
                streaks: msg.streaks,
                lastResult: {
                  roundEnded: msg.roundEnded,
                  action: msg.action,
                  actorId: msg.actorId,
                  actorName: msg.actorName,
                  correct: msg.correct,
                  scores: msg.scores,
                  streaks: msg.streaks,
                },
              };

            case "game:over":
              return {
                ...prev,
                phase: "gameOver",
                scores: msg.scores,
                gameOver: { scores: msg.scores, players: msg.players, winnerId: msg.winnerId },
              };

            case "error":
              return { ...prev, error: msg.message };

            default:
              return prev;
          }
        });
      };

      ws.onclose = () => {
        setState((prev) =>
          prev.phase !== "idle" ? { ...INITIAL_STATE, error: "Disconnected from server" } : prev,
        );
      };
    });
  }, []);

  const createRoom = useCallback(async (username: string) => {
    await connect();
    sendMsg({ type: "room:create", username });
  }, [connect, sendMsg]);

  const joinRoom = useCallback(async (code: string, username: string) => {
    await connect();
    sendMsg({ type: "room:join", code, username });
  }, [connect, sendMsg]);

  const startGame = useCallback(() => sendMsg({ type: "game:start" }), [sendMsg]);
  const flip = useCallback(() => sendMsg({ type: "player:flip" }), [sendMsg]);
  const clap = useCallback(() => sendMsg({ type: "player:clap" }), [sendMsg]);

  const reset = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  useEffect(() => { return () => { wsRef.current?.close(); }; }, []);

  return { state, createRoom, joinRoom, startGame, flip, clap, reset };
}
