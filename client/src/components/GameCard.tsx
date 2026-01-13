import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Pizza, Cat, Ghost, Disc, Sandwich } from "lucide-react";

export type CardType = "Taco" | "Cat" | "Goat" | "Cheese" | "Pizza";

interface GameCardProps {
  type?: CardType;
  isFlipped: boolean;
  className?: string;
  onClick?: () => void;
}

const CardConfig: Record<CardType, { color: string; icon: any; label: string }> = {
  Taco: { color: "bg-amber-400", icon: Sandwich, label: "Taco" },
  Cat: { color: "bg-pink-400", icon: Cat, label: "Cat" },
  Goat: { color: "bg-cyan-400", icon: Ghost, label: "Goat" }, // Ghost looks a bit like a goat? Close enough for arcade!
  Cheese: { color: "bg-yellow-300", icon: Disc, label: "Cheese" },
  Pizza: { color: "bg-red-500", icon: Pizza, label: "Pizza" },
};

export function GameCard({ type, isFlipped, className, onClick }: GameCardProps) {
  const config = type ? CardConfig[type] : null;
  const Icon = config?.icon;

  return (
    <div
      className={cn(
        "perspective-1000 w-48 h-64 sm:w-64 sm:h-80 cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={onClick ? "Flip card" : undefined}
    >
      <motion.div
        className="w-full h-full relative transform-style-3d transition-transform duration-300"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
      >
        {/* Front of card (Face Down) */}
        <div className="absolute inset-0 backface-hidden w-full h-full">
          <div className="w-full h-full bg-indigo-600 rounded-3xl border-4 border-indigo-800 shadow-xl flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_rgba(255,255,255,0.8)_2px,_transparent_3px)] bg-[length:16px_16px]"></div>
             <div className="bg-white/10 p-4 rounded-full">
               <span className="text-4xl font-display text-white font-bold opacity-80">FLIP</span>
             </div>
          </div>
        </div>

        {/* Back of card (Face Up - The Content) */}
        <div className="absolute inset-0 backface-hidden w-full h-full rotate-y-180">
          <div className={cn(
            "w-full h-full rounded-3xl border-4 border-black/10 shadow-xl flex flex-col items-center justify-center p-4 relative overflow-hidden",
            config ? config.color : "bg-gray-200"
          )}>
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,_rgba(0,0,0,0.2)_2px,_transparent_3px)] bg-[length:12px_12px]"></div>
            
            {/* Content */}
            {config && Icon && (
              <div className="bg-white/30 p-6 rounded-full backdrop-blur-sm shadow-inner">
                <Icon className="w-20 h-20 sm:w-28 sm:h-28 text-white drop-shadow-md" strokeWidth={2.5} />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
