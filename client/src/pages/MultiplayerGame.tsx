import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GameCard } from "@/components/GameCard";
import { CARD_LABELS, useLanguage } from "@/lib/language";
import { CARD_KEYS, TURN_DURATION } from "@shared/ws-types";
import { useMultiplayerContext } from "@/contexts/MultiplayerContext";
import { useSubmitScore } from "@/hooks/use-scores";
import confetti from "canvas-confetti";
import { Hand, Crown, Timer, RefreshCw } from "lucide-react";
import type { FeedbackType } from "@/components/FeedbackOverlay";
import { FeedbackOverlay } from "@/components/FeedbackOverlay";

export default function MultiplayerGame() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { state, flip, clap, reset } = useMultiplayerContext();
  const submitScore = useSubmitScore();
  const hasSubmitted = useRef(false);

  const [timeLeft, setTimeLeft] = useState(TURN_DURATION);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if not in a game
  useEffect(() => {
    if (state.phase === "idle" || state.phase === "lobby") setLocation("/multiplayer");
  }, [state.phase, setLocation]);

  // Reset timer on each new card
  useEffect(() => {
    if (state.phase === "playing") setTimeLeft(TURN_DURATION);
  }, [state.card, state.phase]);

  // Countdown
  useEffect(() => {
    if (state.phase !== "playing" || feedback) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 50));
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.phase, feedback]);

  // Show feedback when a round result arrives
  useEffect(() => {
    const result = state.lastResult;
    if (!result?.roundEnded) return;

    if (result.actorId === state.myId) {
      if (result.action === "clap") {
        setFeedback(result.correct ? "match" : "wrong");
      } else if (result.action === "flip") {
        setFeedback("match");
      }
      setTimeout(() => setFeedback(null), 700);
    }

    if (result.correct && result.actorId === state.myId) {
      const myStreak = result.streaks[state.myId ?? ""] ?? 0;
      if (myStreak % 5 === 0 && myStreak > 0) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  }, [state.lastResult, state.myId]);

  // Auto-submit winner's score
  useEffect(() => {
    if (state.phase !== "gameOver" || hasSubmitted.current || !state.gameOver) return;
    const { winnerId } = state.gameOver;
    if (winnerId === state.myId) {
      hasSubmitted.current = true;
      const myPlayer = state.players.find((p) => p.id === state.myId);
      if (myPlayer) {
        submitScore.mutate({
          username: myPlayer.username,
          score: state.scores[state.myId ?? ""] ?? 0,
          maxStreak: state.streaks[state.myId ?? ""] ?? 0,
        });
      }
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    }
  }, [state.phase, state.gameOver, state.myId, state.players, state.scores, state.streaks, submitScore]);

  // Game over screen
  if (state.phase === "gameOver" && state.gameOver) {
    const { scores, players, winnerId } = state.gameOver;
    const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-5xl font-display font-black text-primary">GAME OVER</h1>
            {winnerId === state.myId && <p className="text-2xl font-bold text-yellow-500 mt-2">You won! 🏆</p>}
          </div>
          <div className="bg-card rounded-3xl border-2 border-border shadow-xl overflow-hidden mb-6">
            <ul className="divide-y divide-border">
              {ranked.map((p, idx) => (
                <li key={p.id} className="flex items-center gap-3 p-4">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 ${
                    idx === 0 ? "bg-yellow-400 text-yellow-900" : idx === 1 ? "bg-gray-300 text-gray-800" : idx === 2 ? "bg-amber-700 text-amber-100" : "bg-muted text-muted-foreground"
                  }`}>{idx + 1}</span>
                  {p.id === winnerId && <Crown className="w-4 h-4 text-yellow-500 shrink-0" />}
                  <span className="font-bold text-lg flex-1">{p.username}</span>
                  <span className="font-black text-2xl text-primary">{scores[p.id] ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button size="lg" className="w-full h-14 text-lg rounded-2xl" onClick={() => { reset(); setLocation("/"); }}>
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // Starting countdown
  if (state.phase === "starting") {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-8xl font-display font-black text-primary">
          GET READY!
        </motion.div>
      </div>
    );
  }

  const currentChantWord = CARD_LABELS[language][CARD_KEYS[state.chantIndex]];
  const myScore = state.scores[state.myId ?? ""] ?? 0;
  const lastResult = state.lastResult;

  return (
    <div className="min-h-screen w-full bg-background flex flex-col overflow-hidden relative">
      <FeedbackOverlay type={feedback} />

      {/* Header: scores + round */}
      <div className="flex justify-between items-center p-4 sm:p-6 z-10 flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {state.players.map((p) => (
            <div key={p.id} className={`px-3 py-1.5 rounded-2xl border-2 text-center min-w-[72px] ${
              p.id === state.myId ? "bg-primary/10 border-primary/40" : "bg-white/40 border-border"
            }`}>
              <div className="text-xs font-bold text-muted-foreground truncate max-w-[80px]">{p.username}</div>
              <div className="text-lg font-black text-primary">{state.scores[p.id] ?? 0}</div>
            </div>
          ))}
        </div>
        <div className="text-sm font-bold text-muted-foreground">
          Round {state.roundNumber}/{state.totalRounds}
        </div>
      </div>

      {/* Timer */}
      <div className="px-6 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-1">
          <Timer className="w-3 h-3" /> Time
        </div>
        <Progress value={(timeLeft / TURN_DURATION) * 100} className="h-2" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        {/* Round result banner */}
        <AnimatePresence mode="wait">
          {lastResult?.roundEnded && lastResult.actorName && (
            <motion.div
              key={`result-${state.roundNumber}`}
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`px-5 py-2 rounded-2xl font-bold text-sm border-2 ${
                lastResult.action === "flip"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : lastResult.correct
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {lastResult.action === "flip" && `${lastResult.actorName} flipped first! +50`}
              {lastResult.action === "clap" && lastResult.correct && `${lastResult.actorName} got it! +100`}
              {lastResult.action === "clap" && !lastResult.correct && `${lastResult.actorName} wrong clap! -50`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chant word */}
        <div className="text-center space-y-1">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Word</div>
          <motion.div
            key={state.chantIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl sm:text-7xl font-black font-display text-foreground drop-shadow-lg"
          >
            {currentChantWord}
          </motion.div>
        </div>

        {/* Card — always face-up, key forces remount animation on each new card */}
        <div className="relative flex justify-center items-center py-4">
          <div className="absolute w-48 h-64 sm:w-64 sm:h-80 bg-gray-300 rounded-3xl transform rotate-3 shadow-md z-0" />
          <div className="absolute w-48 h-64 sm:w-64 sm:h-80 bg-gray-400 rounded-3xl transform -rotate-2 shadow-md z-0" />
          <motion.div
            key={state.card}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="z-10 relative"
          >
            <GameCard
              type={state.card ?? undefined}
              isFlipped={state.card !== null}
              className={
                feedback === "match" ? "ring-8 ring-green-400 rounded-3xl"
                : feedback === "wrong" ? "ring-8 ring-red-400 rounded-3xl" : ""
              }
            />
          </motion.div>
        </div>

        {/* My score */}
        <div className="text-center">
          <div className="text-xs font-bold text-muted-foreground uppercase">Your Score</div>
          <div className="text-3xl font-black text-primary">{myScore}</div>
        </div>

        {/* FLIP + CLAP */}
        <div className="flex gap-4">
          <Button
            variant="default"
            onClick={flip}
            disabled={state.phase !== "playing"}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white h-28 w-36 text-2xl rounded-3xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2"
          >
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-9 h-9" />
              <span>FLIP</span>
            </div>
          </Button>
          <Button
            variant="default"
            onClick={clap}
            disabled={state.phase !== "playing"}
            className="bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white h-28 w-36 text-2xl rounded-3xl border-b-8 border-pink-700 active:border-b-0 active:translate-y-2"
          >
            <div className="flex flex-col items-center gap-2">
              <Hand className="w-9 h-9" />
              <span>CLAP</span>
            </div>
          </Button>
        </div>
      </main>
    </div>
  );
}
