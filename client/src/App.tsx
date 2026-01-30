import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import StewardLogin from "@/pages/steward/StewardLogin";
import StewardHome from "@/pages/steward/StewardHome";
import StewardPlotDetail from "@/pages/steward/StewardPlotDetail";
import StewardSubmit from "@/pages/steward/StewardSubmit";
import StewardCapture from "@/pages/steward/StewardCapture";
import StewardEarnings from "@/pages/steward/StewardEarnings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/steward" component={StewardLogin} />
      <Route path="/steward/home" component={StewardHome} />
      <Route path="/steward/capture" component={StewardCapture} />
      <Route path="/steward/plot/:id" component={StewardPlotDetail} />
      <Route path="/steward/submit/:plotId" component={StewardSubmit} />
      <Route path="/steward/earnings" component={StewardEarnings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
