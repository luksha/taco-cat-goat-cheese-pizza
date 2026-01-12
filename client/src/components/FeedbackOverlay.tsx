import { motion, AnimatePresence } from "framer-motion";

export type FeedbackType = "match" | "miss" | "wrong" | null;

interface FeedbackOverlayProps {
  type: FeedbackType;
}

export function FeedbackOverlay({ type }: FeedbackOverlayProps) {
  return (
    <AnimatePresence>
      {type && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1.2 }}
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {type === "match" && (
            <div className="text-6xl sm:text-8xl font-black text-green-500 font-display text-stroke rotate-[-12deg] drop-shadow-2xl">
              NICE!
            </div>
          )}
          {type === "wrong" && (
            <div className="text-6xl sm:text-8xl font-black text-red-500 font-display text-stroke rotate-[12deg] drop-shadow-2xl">
              OOPS!
            </div>
          )}
          {type === "miss" && (
            <div className="text-6xl sm:text-8xl font-black text-orange-500 font-display text-stroke rotate-[-5deg] drop-shadow-2xl">
              MISSED!
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
