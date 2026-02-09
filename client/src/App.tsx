import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Dashboard from "@/pages/Dashboard";
import AdminLogin from "@/pages/AdminLogin";
import FarmerPlotView from "@/pages/FarmerPlotView";
import ProjectDetail from "@/pages/ProjectDetail";
import NotFound from "@/pages/not-found";
import StewardLogin from "@/pages/steward/StewardLogin";
import StewardHome from "@/pages/steward/StewardHome";
import StewardPlotDetail from "@/pages/steward/StewardPlotDetail";
import StewardSubmit from "@/pages/steward/StewardSubmit";
import StewardCapture from "@/pages/steward/StewardCapture";
import StewardEarnings from "@/pages/steward/StewardEarnings";
import StewardIntent from "@/pages/steward/StewardIntent";
import StewardCommunity from "@/pages/steward/StewardCommunity";
import StewardMap from "@/pages/steward/StewardMap";

function ProtectedDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem("adminAuth");
    setIsAuthenticated(auth === "true");
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return <Dashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={ProtectedDashboard} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/plot/:id" component={FarmerPlotView} />
      <Route path="/steward" component={StewardLogin} />
      <Route path="/steward/home" component={StewardHome} />
      <Route path="/steward/capture" component={StewardCapture} />
      <Route path="/steward/plot/:id" component={StewardPlotDetail} />
      <Route path="/steward/submit/:plotId" component={StewardSubmit} />
      <Route path="/steward/map" component={StewardMap} />
      <Route path="/steward/intent" component={StewardIntent} />
      <Route path="/steward/community" component={StewardCommunity} />
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
