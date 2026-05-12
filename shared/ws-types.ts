export type CardKey = "Taco" | "Cat" | "Goat" | "Cheese" | "Pizza";
export const CARD_KEYS: CardKey[] = ["Taco", "Cat", "Goat", "Cheese", "Pizza"];
export const TOTAL_ROUNDS = 10;

export interface WsPlayer {
  id: string;
  username: string;
}

export type ClientMessage =
  | { type: "room:create"; username: string }
  | { type: "room:join"; code: string; username: string }
  | { type: "game:start" }
  | { type: "player:clap" };

export type ServerMessage =
  | { type: "room:joined"; code: string; playerId: string; players: WsPlayer[]; isHost: boolean }
  | { type: "room:updated"; players: WsPlayer[]; hostId: string }
  | { type: "game:started"; chantIndex: number; roundNumber: number; totalRounds: number }
  | { type: "round:card"; card: CardKey; chantIndex: number; roundNumber: number; totalRounds: number }
  | {
      type: "round:result";
      roundEnded: boolean;
      winnerId: string | null;
      winnerName: string | null;
      clapPlayerId: string | null;
      clapPlayerName: string | null;
      correct: boolean;
      scores: Record<string, number>;
      streaks: Record<string, number>;
    }
  | { type: "game:over"; scores: Record<string, number>; players: WsPlayer[]; winnerId: string }
  | { type: "error"; message: string };
