import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import type { ClientMessage, ServerMessage, WsPlayer } from "@shared/ws-types";
import { CARD_KEYS, TOTAL_ROUNDS } from "@shared/ws-types";

const TURN_DURATION = 2_000;
const RESULT_DELAY = 2_000;

interface RoomPlayer extends WsPlayer {
  ws: WebSocket;
}

interface Room {
  code: string;
  hostId: string;
  phase: "lobby" | "playing" | "roundEnd" | "over";
  players: RoomPlayer[];
  chantIndex: number;
  currentCard: string | null;
  roundNumber: number;
  scores: Record<string, number>;
  streaks: Record<string, number>;
  clappers: Set<string>;
  turnTimer: ReturnType<typeof setTimeout> | null;
}

const rooms = new Map<string, Room>();
const wsToPlayer = new Map<WebSocket, { playerId: string; roomCode: string }>();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code: string;
  do {
    code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  } while (rooms.has(code));
  return code;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(room: Room, msg: ServerMessage, excludeId?: string) {
  for (const p of room.players) {
    if (p.id !== excludeId) send(p.ws, msg);
  }
}

function publicPlayers(room: Room): WsPlayer[] {
  return room.players.map(({ id, username }) => ({ id, username }));
}

function randomCard(): string {
  return CARD_KEYS[Math.floor(Math.random() * CARD_KEYS.length)];
}

function startRound(room: Room) {
  if (room.turnTimer) clearTimeout(room.turnTimer);
  room.phase = "playing";
  room.currentCard = randomCard();
  room.clappers = new Set();

  broadcast(room, {
    type: "round:card",
    card: room.currentCard as any,
    chantIndex: room.chantIndex,
    roundNumber: room.roundNumber,
    totalRounds: TOTAL_ROUNDS,
  });

  room.turnTimer = setTimeout(() => handleTimeout(room), TURN_DURATION);
}

function handleTimeout(room: Room) {
  if (room.phase !== "playing") return;
  const isMatch = room.currentCard === CARD_KEYS[room.chantIndex];

  if (isMatch) {
    for (const p of room.players) {
      if (!room.clappers.has(p.id)) {
        room.scores[p.id] = Math.max(0, (room.scores[p.id] ?? 0) - 50);
        room.streaks[p.id] = 0;
      }
    }
  }

  finishRound(room, null);
}

function finishRound(room: Room, winnerId: string | null) {
  room.phase = "roundEnd";
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }

  const winner = winnerId ? room.players.find((p) => p.id === winnerId) : null;

  broadcast(room, {
    type: "round:result",
    roundEnded: true,
    winnerId,
    winnerName: winner?.username ?? null,
    clapPlayerId: winnerId,
    clapPlayerName: winner?.username ?? null,
    correct: true,
    scores: { ...room.scores },
    streaks: { ...room.streaks },
  });

  room.chantIndex = (room.chantIndex + 1) % CARD_KEYS.length;
  room.roundNumber++;

  setTimeout(() => {
    if (!rooms.has(room.code)) return;
    if (room.roundNumber > TOTAL_ROUNDS) {
      endGame(room);
    } else {
      startRound(room);
    }
  }, RESULT_DELAY);
}

function endGame(room: Room) {
  room.phase = "over";
  if (room.turnTimer) clearTimeout(room.turnTimer);

  const winnerId =
    Object.entries(room.scores).sort(([, a], [, b]) => b - a)[0]?.[0] ??
    room.players[0]?.id ??
    "";

  broadcast(room, {
    type: "game:over",
    scores: room.scores,
    players: publicPlayers(room),
    winnerId,
  });

  setTimeout(() => rooms.delete(room.code), 60_000);
}

function handleMessage(ws: WebSocket, raw: string) {
  let msg: ClientMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }

  const meta = wsToPlayer.get(ws);

  if (msg.type === "room:create") {
    const code = generateCode();
    const playerId = generateId();
    const room: Room = {
      code,
      hostId: playerId,
      phase: "lobby",
      players: [{ id: playerId, username: msg.username, ws }],
      chantIndex: 0,
      currentCard: null,
      roundNumber: 1,
      scores: { [playerId]: 0 },
      streaks: { [playerId]: 0 },
      clappers: new Set(),
      turnTimer: null,
    };
    rooms.set(code, room);
    wsToPlayer.set(ws, { playerId, roomCode: code });

    send(ws, {
      type: "room:joined",
      code,
      playerId,
      players: publicPlayers(room),
      isHost: true,
    });
    return;
  }

  if (msg.type === "room:join") {
    const room = rooms.get(msg.code.toUpperCase());
    if (!room) {
      send(ws, { type: "error", message: "Room not found" });
      return;
    }
    if (room.phase !== "lobby") {
      send(ws, { type: "error", message: "Game already started" });
      return;
    }
    if (room.players.length >= 4) {
      send(ws, { type: "error", message: "Room is full" });
      return;
    }

    const playerId = generateId();
    room.players.push({ id: playerId, username: msg.username, ws });
    room.scores[playerId] = 0;
    room.streaks[playerId] = 0;
    wsToPlayer.set(ws, { playerId, roomCode: room.code });

    send(ws, {
      type: "room:joined",
      code: room.code,
      playerId,
      players: publicPlayers(room),
      isHost: false,
    });

    broadcast(room, {
      type: "room:updated",
      players: publicPlayers(room),
      hostId: room.hostId,
    }, playerId);
    return;
  }

  if (!meta) return;
  const room = rooms.get(meta.roomCode);
  if (!room) return;

  if (msg.type === "game:start") {
    if (meta.playerId !== room.hostId || room.phase !== "lobby" || room.players.length < 2) {
      send(ws, { type: "error", message: "Cannot start game" });
      return;
    }

    broadcast(room, {
      type: "game:started",
      chantIndex: 0,
      roundNumber: 1,
      totalRounds: TOTAL_ROUNDS,
    });

    setTimeout(() => startRound(room), 1_500);
    return;
  }

  if (msg.type === "player:clap") {
    if (room.phase !== "playing" || room.clappers.has(meta.playerId)) return;
    room.clappers.add(meta.playerId);

    const isMatch = room.currentCard === CARD_KEYS[room.chantIndex];
    const player = room.players.find((p) => p.id === meta.playerId)!;

    if (isMatch) {
      const streak = room.streaks[meta.playerId] ?? 0;
      const bonus = Math.floor(streak / 5) * 50;
      room.scores[meta.playerId] = (room.scores[meta.playerId] ?? 0) + 100 + bonus;
      room.streaks[meta.playerId] = streak + 1;
      finishRound(room, meta.playerId);
    } else {
      room.scores[meta.playerId] = Math.max(0, (room.scores[meta.playerId] ?? 0) - 50);
      room.streaks[meta.playerId] = 0;

      broadcast(room, {
        type: "round:result",
        roundEnded: false,
        winnerId: null,
        winnerName: null,
        clapPlayerId: meta.playerId,
        clapPlayerName: player.username,
        correct: false,
        scores: { ...room.scores },
        streaks: { ...room.streaks },
      });
    }
    return;
  }
}

function handleDisconnect(ws: WebSocket) {
  const meta = wsToPlayer.get(ws);
  if (!meta) return;
  wsToPlayer.delete(ws);

  const room = rooms.get(meta.roomCode);
  if (!room) return;

  room.players = room.players.filter((p) => p.id !== meta.playerId);

  if (room.players.length === 0) {
    if (room.turnTimer) clearTimeout(room.turnTimer);
    rooms.delete(room.code);
    return;
  }

  if (room.hostId === meta.playerId) {
    room.hostId = room.players[0].id;
  }

  if (room.phase === "playing" && room.players.length < 2) {
    if (room.turnTimer) clearTimeout(room.turnTimer);
    endGame(room);
    return;
  }

  broadcast(room, {
    type: "room:updated",
    players: publicPlayers(room),
    hostId: room.hostId,
  });
}

export function setupWebSocket(httpServer: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    console.log(`[ws] upgrade request: ${req.url}`);
    if (req.url === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    }
  });

  wss.on("connection", (ws) => {
    console.log("[ws] client connected");
    ws.on("message", (data) => {
      console.log("[ws] message:", data.toString());
      handleMessage(ws, data.toString());
    });
    ws.on("close", () => { console.log("[ws] client disconnected"); handleDisconnect(ws); });
    ws.on("error", (e) => { console.log("[ws] error:", e.message); handleDisconnect(ws); });
  });
}
