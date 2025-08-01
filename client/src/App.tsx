import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FarcasterProvider } from "@/hooks/use-farcaster";
import Home from "@/pages/home";
import StoryPage from "@/pages/story";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/story/:id" component={StoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FarcasterProvider>
          <Toaster />
          <Router />
        </FarcasterProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
