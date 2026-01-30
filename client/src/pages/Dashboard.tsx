import { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { LandscapeScene } from "@/components/landscape/LandscapeScene";
import { CesiumLandscape } from "@/components/landscape/CesiumLandscape";
import { PlotDetailPanel } from "@/components/PlotDetailPanel";
import { PlotList } from "@/components/PlotList";
import { StewardList } from "@/components/StewardList";
import { VerificationList } from "@/components/VerificationList";
import { LoadingState, SceneLoadingOverlay } from "@/components/LoadingState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import type { Plot, Steward, VerificationEvent } from "@shared/schema";
import { Leaf, Wifi } from "lucide-react";

const CESIUM_ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN || "";

export default function Dashboard() {
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("landscape");

  const { data: plots = [], isLoading: plotsLoading } = useQuery<Plot[]>({
    queryKey: ["/api/plots"],
  });

  const { data: stewards = [], isLoading: stewardsLoading } = useQuery<Steward[]>({
    queryKey: ["/api/stewards"],
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<VerificationEvent[]>({
    queryKey: ["/api/verification-events"],
  });

  const isLoading = plotsLoading || stewardsLoading || eventsLoading;

  const selectedPlot = plots.find((p) => p.id === selectedPlotId);
  const selectedSteward = selectedPlot?.stewardId
    ? stewards.find((s) => s.id === selectedPlot.stewardId)
    : undefined;

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3.5rem",
  };

  const handlePlotSelect = (id: string) => {
    setSelectedPlotId(id);
    if (activeView !== "landscape") {
      setActiveView("landscape");
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "plots":
        return (
          <PlotList
            plots={plots}
            stewards={stewards}
            onPlotSelect={handlePlotSelect}
            selectedPlotId={selectedPlotId}
          />
        );
      case "stewards":
        return <StewardList stewards={stewards} />;
      case "verifications":
        return (
          <VerificationList
            events={events}
            plots={plots}
            stewards={stewards}
          />
        );
      case "landscape":
      default:
        return (
          <div className="relative h-full" data-testid="landscape-container">
            <Suspense fallback={<SceneLoadingOverlay />}>
              {CESIUM_ION_TOKEN ? (
                <CesiumLandscape
                  plots={plots}
                  selectedPlotId={selectedPlotId}
                  onPlotSelect={handlePlotSelect}
                  cesiumToken={CESIUM_ION_TOKEN}
                />
              ) : (
                <LandscapeScene
                  plots={plots}
                  selectedPlotId={selectedPlotId}
                  onPlotSelect={handlePlotSelect}
                />
              )}
            </Suspense>

            {selectedPlot && (
              <PlotDetailPanel
                plot={selectedPlot}
                steward={selectedSteward}
                onClose={() => setSelectedPlotId(null)}
              />
            )}

            <div className="absolute left-4 bottom-4 z-10">
              <div className="p-3 rounded-lg bg-card/90 backdrop-blur-sm border shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Legend</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <LegendItem color="bg-green-500" label="Verified" />
                  <LegendItem color="bg-amber-500" label="Pending" />
                  <LegendItem color="bg-blue-500" label="Submitted" />
                  <LegendItem color="bg-purple-500" label="Under Review" />
                </div>
              </div>
            </div>

            <div className="absolute right-4 bottom-4 z-10">
              <div className="p-2 px-3 rounded-lg bg-card/90 backdrop-blur-sm border shadow-lg flex items-center gap-2">
                <Wifi className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs text-muted-foreground">Live Data</span>
              </div>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <LoadingState />
      </div>
    );
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <DashboardSidebar
          plots={plots}
          stewards={stewards}
          selectedPlotId={selectedPlotId}
          onPlotSelect={handlePlotSelect}
          activeView={activeView}
          onViewChange={setActiveView}
        />

        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <h2 className="font-medium capitalize" data-testid="text-current-view">
                  {activeView === "landscape" ? "Landscape View" : activeView}
                </h2>
                {activeView === "landscape" && (
                  <Badge variant="secondary" className="text-xs">
                    {plots.length} plots
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Connected
              </Badge>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
