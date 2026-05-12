import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Game from "@/pages/Game";
import MultiplayerLobby from "@/pages/MultiplayerLobby";
import MultiplayerGame from "@/pages/MultiplayerGame";
import NotFound from "@/pages/not-found";
import { MultiplayerProvider } from "@/contexts/MultiplayerContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game" component={Game} />
      <Route path="/multiplayer" component={MultiplayerLobby} />
      <Route path="/multiplayer/game" component={MultiplayerGame} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <MultiplayerProvider>
          <Router />
        </MultiplayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
