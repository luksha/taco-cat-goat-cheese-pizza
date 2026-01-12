import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useScores } from "@/hooks/use-scores";
import { motion } from "framer-motion";
import { Trophy, Play, Star } from "lucide-react";

export default function Home() {
  const { data: scores, isLoading } = useScores();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 sm:p-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 space-y-4"
      >
        <h1 className="text-5xl md:text-7xl font-display font-black text-primary drop-shadow-[4px_4px_0px_rgba(0,0,0,0.2)] tracking-tight">
          FLIP CHANT
        </h1>
        <p className="text-xl text-muted-foreground font-medium max-w-md mx-auto">
          Taco • Cat • Goat • Cheese • Pizza
        </p>
      </motion.div>

      {/* Main Action */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="mb-16"
      >
        <Link href="/game">
          <Button size="lg" className="text-2xl h-20 px-12 rounded-full shadow-[0_10px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-none bg-gradient-to-r from-pink-500 to-orange-500 border-4 border-white/20">
            <Play className="mr-3 w-8 h-8 fill-current" />
            START GAME
          </Button>
        </Link>
      </motion.div>

      {/* Leaderboard Card */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md bg-card rounded-3xl border-2 border-border shadow-xl overflow-hidden"
      >
        <div className="bg-secondary p-4 flex items-center justify-center gap-2 border-b-2 border-border">
          <Trophy className="w-6 h-6 text-secondary-foreground" />
          <h2 className="text-2xl font-display font-bold text-secondary-foreground">
            TOP STREAKS
          </h2>
        </div>
        
        <div className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">
              Loading scores...
            </div>
          ) : scores && scores.length > 0 ? (
            <ul className="divide-y divide-border">
              {scores.slice(0, 5).map((score, idx) => (
                <li key={score.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`
                      flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                      ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : 
                        idx === 1 ? 'bg-gray-300 text-gray-800' : 
                        idx === 2 ? 'bg-amber-700 text-amber-100' : 'bg-muted text-muted-foreground'}
                    `}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-lg text-foreground">{score.username}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold text-xl">
                    <span>{score.maxStreak}</span>
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No high scores yet. Be the first!
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
