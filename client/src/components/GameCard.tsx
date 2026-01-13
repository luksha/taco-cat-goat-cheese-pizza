import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
export type CardType = "Taco" | "Cat" | "Goat" | "Cheese" | "Pizza";

interface GameCardProps {
  type?: CardType;
  isFlipped: boolean;
  className?: string;
}

const CardConfig: Record<
  CardType,
  { color: string; imageSrc?: string; label: string }
> = {
  Taco: { color: "bg-[#dca8cf]", imageSrc: "/images/taco.png", label: "Taco" },
  Cat: { color: "bg-[#f3eeb3]", imageSrc: "/images/cat.png", label: "Cat" },
  Goat: { color: "bg-[#b3dde1]", imageSrc: "/images/goat.png", label: "Goat" },
  Cheese: { color: "bg-[#dca8cf]", imageSrc: "/images/cheese.png", label: "Cheese",},
  Pizza: { color: "bg-[#e7aaab]", imageSrc: "/images/pizza.png", label: "Pizza" },
};

export function GameCard({ type, isFlipped, className }: GameCardProps) {
  const config = type ? CardConfig[type] : null;
  const imageSrc = config?.imageSrc;

  return (
    <div className={cn("perspective-1000 w-48 h-64 sm:w-64 sm:h-80 cursor-pointer", className)}>
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
            {config && imageSrc && (
              <img
                src={imageSrc}
                alt={config.label}
                className="w-40 h-40 sm:w-64 sm:h-64 object-contain"
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
