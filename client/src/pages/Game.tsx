import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GameCard, type CardType } from "@/components/GameCard";
import {
  FeedbackOverlay,
  type FeedbackType,
} from "@/components/FeedbackOverlay";
import { useSubmitScore } from "@/hooks/use-scores";
import confetti from "canvas-confetti";
import { ArrowBigLeft, Hand, RefreshCw, Timer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// The repeating chant sequence
const CHANT_SEQUENCE: CardType[] = ["Taco", "Cat", "Goat", "Cheese", "Pizza"];
const CARD_TYPES: CardType[] = ["Taco", "Cat", "Goat", "Cheese", "Pizza"];
const TURN_DURATION = 3000; // ms

export default function Game() {
  const [, setLocation] = useLocation();
  const [chantIndex, setChantIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState<CardType | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Scoring
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [username, setUsername] = useState("");

  // Timer state
  const [timeLeft, setTimeLeft] = useState(TURN_DURATION);

  // Submit Hook
  const submitScore = useSubmitScore();

  // Helper to get random card
  const getRandomCard = () => {
    const rand = Math.floor(Math.random() * CARD_TYPES.length);
    return CARD_TYPES[rand];
  };

  // Trigger feedback animation
  const showFeedback = (type: FeedbackType) => {
    setFeedback(type);
    setTimeout(() => setFeedback(null), 800); // Clear after animation
  };

  // Action: Flip Card
  const handleFlip = useCallback(
    (isAutoFlip = false) => {
      if (isGameOver) return;

      if (isFlipped) {
        // If card is already flipped, we check if player missed a match
        if (!isAutoFlip) {
          const previousChant = CHANT_SEQUENCE[chantIndex];
          const isMatch = currentCard === previousChant;

          if (isMatch) {
            showFeedback("miss");
            setStreak(0);
            setScore((prev) => Math.max(0, prev - 50));
          }
        }

        // Prepare next round
        setIsFlipped(false);

        setTimeout(() => {
          setChantIndex((prev) => (prev + 1) % CHANT_SEQUENCE.length);
          setCurrentCard(getRandomCard());
          setIsFlipped(true);
          setTimeLeft(TURN_DURATION);
        }, 150);
      } else {
        // First flip of the game
        setCurrentCard(getRandomCard());
        setIsFlipped(true);
        setTimeLeft(TURN_DURATION);
      }
    },
    [isFlipped, currentCard, chantIndex, isGameOver],
  );

  // Action: Clap
  const handleClap = useCallback(() => {
    if (!isFlipped || isGameOver) return;

    const currentChant = CHANT_SEQUENCE[chantIndex];
    const isMatch = currentCard === currentChant;

    if (isMatch) {
      // CORRECT!
      showFeedback("match");
      const streakBonus = Math.floor(streak / 5) * 50;
      setScore((prev) => prev + 100 + streakBonus);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });

      // Confetti for milestones
      if ((streak + 1) % 5 === 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      // Auto-flip after success
      setTimeout(() => {
        handleFlip(true);
      }, 400);
    } else {
      // WRONG!
      showFeedback("wrong");
      setStreak(0);
      setScore((prev) => Math.max(0, prev - 100));
    }
  }, [
    isFlipped,
    currentCard,
    chantIndex,
    streak,
    isGameOver,
    maxStreak,
    handleFlip,
  ]);

  const handleTimeout = useCallback(() => {
    if (!isFlipped || isGameOver) return;

    showFeedback("miss");
    setStreak(0);
    setScore((prev) => Math.max(0, prev - 50));

    handleFlip(true);
  }, [isFlipped, isGameOver, handleFlip]);

  // Timer effect
  useEffect(() => {
    if (!isFlipped || isGameOver || feedback) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          handleTimeout();
          return TURN_DURATION;
        }
        return prev - 10;
      });
    }, 10);

    return () => clearInterval(interval);
  }, [isFlipped, isGameOver, feedback, handleTimeout]);

  const handleEndGame = () => {
    setIsGameOver(true);
    setShowNameDialog(true);
  };

  const handleScoreSubmit = async () => {
    if (!username.trim()) return;

    try {
      await submitScore.mutateAsync({
        username,
        score,
        maxStreak,
      });
      setLocation("/");
    } catch (err) {
      console.error(err);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") handleFlip(false);
      if (e.code === "Enter") handleClap();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleClap]);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col overflow-hidden relative">
      <FeedbackOverlay type={feedback} />

      {/* Header / Stats */}
      <div className="flex justify-between items-center p-4 sm:p-6 z-10">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowBigLeft className="w-8 h-8" />
        </Button>
        <div className="flex gap-4 sm:gap-8 text-center items-center">
          <div className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border-2 border-primary/20">
            <div className="text-xs uppercase font-bold text-muted-foreground">
              Score
            </div>
            <div className="text-2xl font-black font-display text-primary">
              {score}
            </div>
          </div>

          {/* Timer Progress */}
          <div className="hidden sm:flex flex-col items-center gap-1 w-32">
            <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase">
              <Timer className="w-3 h-3" /> Time
            </div>
            <Progress
              value={(timeLeft / TURN_DURATION) * 100}
              className="h-2"
            />
          </div>

          <div className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border-2 border-accent/20">
            <div className="text-xs uppercase font-bold text-muted-foreground">
              Streak
            </div>
            <div className="text-2xl font-black font-display text-accent">
              {streak}
            </div>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleEndGame}>
          End Game
        </Button>
      </div>

      {/* Mobile Timer Progress */}
      <div className="sm:hidden px-6 pt-2">
        <Progress value={(timeLeft / TURN_DURATION) * 100} className="h-2" />
      </div>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
        {/* Current Chant Word Indicator */}
        <div className="text-center space-y-2">
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Current Word
          </div>
          <motion.div
            key={chantIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl sm:text-7xl font-black font-display text-foreground drop-shadow-lg"
          >
            {CHANT_SEQUENCE[chantIndex]}
          </motion.div>
        </div>

        {/* Card Deck Area */}
        <div className="relative flex justify-center items-center py-8">
          {/* Placeholder for deck stack effect */}
          <div className="absolute w-48 h-64 sm:w-64 sm:h-80 bg-gray-300 rounded-3xl transform rotate-3 shadow-md z-0"></div>
          <div className="absolute w-48 h-64 sm:w-64 sm:h-80 bg-gray-400 rounded-3xl transform -rotate-2 shadow-md z-0"></div>

          {/* Active Card */}
          <div className="z-10 relative">
            <GameCard
              type={currentCard || undefined}
              isFlipped={isFlipped}
              onClick={() => handleFlip(false)}
              className={
                feedback === "match"
                  ? "ring-8 ring-green-400 rounded-3xl"
                  : feedback === "wrong"
                    ? "ring-8 ring-red-400 rounded-3xl"
                    : ""
              }
            />
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-md grid grid-cols-2 gap-4 sm:gap-6 mt-auto mb-8 sm:mb-12">
          <Button
            variant="default"
            onClick={() => handleFlip(false)}
            className="bg-blue-500 hover:bg-blue-600 text-white h-24 sm:h-32 text-2xl sm:text-3xl rounded-3xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2"
          >
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10" />
              <span>FLIP</span>
            </div>
          </Button>

          <Button
            variant="default"
            onClick={handleClap}
            className="bg-pink-500 hover:bg-pink-600 text-white h-24 sm:h-32 text-2xl sm:text-3xl rounded-3xl border-b-8 border-pink-700 active:border-b-0 active:translate-y-2"
          >
            <div className="flex flex-col items-center gap-2">
              <Hand className="w-8 h-8 sm:w-10 sm:h-10" />
              <span>CLAP</span>
            </div>
          </Button>
        </div>
      </main>

      {/* Game Over Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-md border-4 border-primary/20 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-center text-3xl font-display font-black text-primary">
              GAME OVER
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-2xl">
                <div className="text-sm text-muted-foreground font-bold">
                  FINAL SCORE
                </div>
                <div className="text-3xl font-black">{score}</div>
              </div>
              <div className="bg-muted p-4 rounded-2xl">
                <div className="text-sm text-muted-foreground font-bold">
                  MAX STREAK
                </div>
                <div className="text-3xl font-black">{maxStreak}</div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-sm font-medium">
                Enter your name for the leaderboard:
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Name (e.g. TacoMaster)"
                className="text-center text-lg h-12 rounded-xl border-2 focus-visible:ring-offset-0"
                maxLength={12}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="secondary" onClick={() => setLocation("/")}>
              Skip
            </Button>
            <Button
              onClick={handleScoreSubmit}
              disabled={!username || submitScore.isPending}
            >
              {submitScore.isPending ? "Saving..." : "Save Score"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
