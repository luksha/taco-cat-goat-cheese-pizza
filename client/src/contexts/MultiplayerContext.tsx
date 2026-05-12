import { createContext, useContext, type ReactNode } from "react";
import { useMultiplayer } from "@/hooks/use-multiplayer";

type MultiplayerContextType = ReturnType<typeof useMultiplayer>;

const MultiplayerContext = createContext<MultiplayerContextType | null>(null);

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  const mp = useMultiplayer();
  return <MultiplayerContext.Provider value={mp}>{children}</MultiplayerContext.Provider>;
}

export function useMultiplayerContext(): MultiplayerContextType {
  const ctx = useContext(MultiplayerContext);
  if (!ctx) throw new Error("useMultiplayerContext must be used within MultiplayerProvider");
  return ctx;
}
