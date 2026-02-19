import { useState, Suspense } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LandscapeScene } from "@/components/landscape/LandscapeScene";
import { CesiumLandscape } from "@/components/landscape/CesiumLandscape";
import { PlotList } from "@/components/PlotList";
import { ProjectList } from "@/components/ProjectList";
import { StewardList } from "@/components/StewardList";
import { VerificationList } from "@/components/VerificationList";
import { LoadingState, SceneLoadingOverlay } from "@/components/LoadingState";
import { FloatingNavMenu } from "@/components/FloatingNavMenu";
import { FloatingLandscapeStats } from "@/components/FloatingLandscapeStats";
import { FloatingLandscapeChat } from "@/components/FloatingLandscapeChat";
import { FloatingPlotDetail } from "@/components/FloatingPlotDetail";
import { FloatingLandscapeSatellite } from "@/components/FloatingLandscapeSatellite";
import { FloatingProjectsPanel } from "@/components/FloatingProjectsPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Plot, Steward, VerificationEvent, Project } from "@shared/schema";
import { Leaf } from "lucide-react";

const CESIUM_ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN || "";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("landscape");
  const [filteredPlotIds, setFilteredPlotIds] = useState<string[] | null>(null);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showProjectsPanel, setShowProjectsPanel] = useState(false);

  const { data: plots = [], isLoading: plotsLoading } = useQuery<Plot[]>({
    queryKey: ["/api/plots"],
  });

  const { data: stewards = [], isLoading: stewardsLoading } = useQuery<Steward[]>({
    queryKey: ["/api/stewards"],
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<VerificationEvent[]>({
    queryKey: ["/api/verification-events"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const isLoading = plotsLoading || stewardsLoading || eventsLoading;

  const selectedPlot = plots.find((p) => p.id === selectedPlotId);
  const selectedSteward = selectedPlot?.stewardId
    ? stewards.find((s) => s.id === selectedPlot.stewardId)
    : undefined;

  const checkIsMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

  const closeMobilePanels = () => {
    if (checkIsMobile()) {
      setSelectedPlotId(null);
      setShowSatellite(false);
      setShowProjectsPanel(false);
    }
  };

  const handleViewChange = (view: string) => {
    closeMobilePanels();
    setShowProjectsPanel(false);
    setActiveView(view);
  };

  const handlePlotSelect = (id: string) => {
    if (checkIsMobile()) {
      setShowSatellite(false);
      setShowProjectsPanel(false);
    }
    setSelectedPlotId(id);
    if (activeView !== "landscape") {
      setActiveView("landscape");
    }
  };

  const handlePlotDoubleClick = (id: string) => {
    navigate(`/plot/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    window.location.href = "/";
  };

  const handlePlotSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredPlotIds(null);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const matchedIds = plots
      .filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.status.toLowerCase().includes(lowerQuery)
      )
      .map(p => p.id);
    setFilteredPlotIds(matchedIds.length > 0 ? matchedIds : []);
  };

  const renderNonLandscapeContent = () => {
    switch (activeView) {
      case "projects":
        return <ProjectList />;
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
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <LoadingState />
      </div>
    );
  }

  if (activeView !== "landscape") {
    return (
      <div className="h-screen w-full bg-background">
        <FloatingNavMenu
          activeView={activeView}
          onViewChange={handleViewChange}
          plotCount={plots.length}
          stewardCount={stewards.length}
          projectCount={projects.length}
          onLogout={handleLogout}
        />
        <div className="h-full overflow-auto pt-[52px] md:pt-0 md:pl-[412px]">
          {renderNonLandscapeContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-background">
      <div className="absolute inset-0" data-testid="landscape-container">
        <Suspense fallback={<SceneLoadingOverlay />}>
          {CESIUM_ION_TOKEN ? (
            <CesiumLandscape
              plots={plots}
              selectedPlotId={selectedPlotId}
              onPlotSelect={handlePlotSelect}
              onPlotDoubleClick={handlePlotDoubleClick}
              cesiumToken={CESIUM_ION_TOKEN}
              filteredPlotIds={filteredPlotIds}
              hideSearch={true}
            />
          ) : (
            <LandscapeScene
              plots={plots}
              selectedPlotId={selectedPlotId}
              onPlotSelect={handlePlotSelect}
            />
          )}
        </Suspense>
      </div>

      <FloatingNavMenu
        activeView={showProjectsPanel ? "projects" : activeView}
        onViewChange={handleViewChange}
        plotCount={plots.length}
        stewardCount={stewards.length}
        projectCount={projects.length}
        onLogout={handleLogout}
        onOpenSatellite={() => {
          setShowSatellite(true);
          if (checkIsMobile()) {
            setSelectedPlotId(null);
            setShowProjectsPanel(false);
          }
        }}
        onSearch={handlePlotSearch}
      />

      <FloatingProjectsPanel
        isOpen={showProjectsPanel}
        onClose={() => setShowProjectsPanel(false)}
        onSelectProject={(projectId) => navigate(`/projects/${projectId}`)}
      />

      <FloatingLandscapeStats 
        plots={plots} 
        stewards={stewards} 
        isHidden={!!selectedPlot || showProjectsPanel || showSatellite} 
      />

      <FloatingLandscapeSatellite
        plots={plots}
        isOpen={showSatellite}
        onClose={() => setShowSatellite(false)}
      />

      <FloatingPlotDetail
        plot={selectedPlot || null}
        steward={selectedSteward}
        onClose={() => setSelectedPlotId(null)}
      />

      {!(selectedPlot || showSatellite || showProjectsPanel) && (
        <FloatingLandscapeChat
          plots={plots}
          onFilterPlots={setFilteredPlotIds}
          onHighlightPlot={(id) => {
            if (id) setSelectedPlotId(id);
          }}
          onSelectPlot={handlePlotSelect}
        />
      )}

      {!selectedPlot && (
        <div className="fixed left-4 bottom-4 z-10 hidden md:block">
          <Card className="bg-card/90 backdrop-blur-xl border-border/50 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Legend</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <LegendItem color="bg-emerald-500" label="Verified" />
                <LegendItem color="bg-amber-400" label="Pending" />
                <LegendItem color="bg-orange-500" label="Submitted" />
                <LegendItem color="bg-red-500" label="Under Review" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {filteredPlotIds && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
          <Badge className="bg-primary/90 backdrop-blur-sm shadow-lg text-sm px-4 py-2">
            Showing {filteredPlotIds.length} of {plots.length} plots
          </Badge>
        </div>
      )}
    </div>
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
