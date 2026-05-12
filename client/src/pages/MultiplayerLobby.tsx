import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowBigLeft, Users, Plus, LogIn, Crown, Play } from "lucide-react";
import { useMultiplayerContext } from "@/contexts/MultiplayerContext";

export default function MultiplayerLobby() {
  const [, setLocation] = useLocation();
  const { state, createRoom, joinRoom, startGame, reset } = useMultiplayerContext();

  const [username, setUsername] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // All players navigate to the game when it starts
  useEffect(() => {
    if (state.phase === "starting" || state.phase === "playing") {
      setLocation("/multiplayer/game");
    }
  }, [state.phase, setLocation]);

  const handleCreate = async () => {
    if (!username.trim()) return;
    setIsLoading(true);
    setLocalError(null);
    try {
      await createRoom(username.trim());
    } catch {
      setLocalError("Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!username.trim() || !joinCode.trim()) return;
    setIsLoading(true);
    setLocalError(null);
    try {
      await joinRoom(joinCode.trim(), username.trim());
    } catch {
      setLocalError("Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    reset();
    setLocation("/");
  };

  if (state.phase === "lobby" || state.phase === "starting") {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          {/* Room code */}
          <div className="text-center mb-8">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Room Code
            </div>
            <div className="text-6xl font-black font-display tracking-widest text-primary bg-white/60 backdrop-blur-sm border-4 border-primary/20 rounded-3xl py-4 px-6">
              {state.roomCode}
            </div>
            <p className="text-muted-foreground text-sm mt-2">Share this code with your friends</p>
          </div>

          {/* Player list */}
          <div className="bg-card rounded-3xl border-2 border-border shadow-xl overflow-hidden mb-6">
            <div className="bg-secondary p-3 flex items-center justify-center gap-2 border-b-2 border-border">
              <Users className="w-5 h-5" />
              <span className="font-display font-bold">
                Players ({state.players.length}/4)
              </span>
            </div>
            <ul className="divide-y divide-border">
              {state.players.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-4">
                  {(state.hostId === p.id) && (
                    <Crown className="w-4 h-4 text-yellow-500 shrink-0" />
                  )}
                  <span className="font-bold text-lg">{p.username}</span>
                  {p.id === state.myId && (
                    <span className="ml-auto text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {state.error && (
            <p className="text-destructive text-sm text-center mb-4">{state.error}</p>
          )}

          {state.isHost ? (
            <Button
              size="lg"
              className="w-full h-16 text-xl rounded-2xl"
              disabled={state.players.length < 2 || state.phase === "starting"}
              onClick={startGame}
            >
              <Play className="mr-2 w-6 h-6" />
              {state.players.length < 2 ? "Waiting for players…" : "Start Game"}
            </Button>
          ) : (
            <div className="text-center text-muted-foreground font-medium py-4">
              Waiting for host to start…
            </div>
          )}

          <Button variant="ghost" className="w-full mt-3" onClick={handleBack}>
            Leave Room
          </Button>
        </motion.div>
      </div>
    );
  }

  // Pre-lobby: username + create/join UI
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4"
        onClick={() => setLocation("/")}
      >
        <ArrowBigLeft className="w-8 h-8" />
      </Button>

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl font-display font-black text-primary">MULTIPLAYER</h1>
        <p className="text-muted-foreground mt-2">Race your friends to CLAP first!</p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm space-y-4"
      >
        <div className="space-y-2">
          <label className="text-sm font-bold text-muted-foreground uppercase">Your Name</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 12))}
            placeholder="e.g. TacoMaster"
            className="h-12 text-lg rounded-xl border-2 text-center"
            maxLength={12}
          />
        </div>

        {(state.error || localError) && (
          <p className="text-destructive text-sm text-center">{state.error ?? localError}</p>
        )}

        <Button
          size="lg"
          className="w-full h-14 text-lg rounded-2xl"
          disabled={!username.trim() || isLoading}
          onClick={handleCreate}
        >
          <Plus className="mr-2 w-5 h-5" />
          Create Room
        </Button>

        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm font-medium">or join existing</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex gap-2">
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="XXXX"
            className="h-12 text-lg rounded-xl border-2 text-center tracking-widest font-bold uppercase"
            maxLength={4}
          />
          <Button
            size="lg"
            variant="secondary"
            className="h-12 px-5 rounded-xl shrink-0"
            disabled={!username.trim() || joinCode.length !== 4 || isLoading}
            onClick={handleJoin}
          >
            <LogIn className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
