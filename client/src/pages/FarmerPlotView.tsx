import { useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Search, X, Trees } from "lucide-react";
import type { Plot, Steward } from "@shared/schema";
import CesiumPlotTerrain from "@/components/CesiumPlotTerrain";
import BambooSimulationComponent, { BambooSimulationRef } from "@/components/BambooSimulationComponent";
import { FloatingChatPanel } from "@/components/FloatingChatPanel";
import { FloatingDataCards } from "@/components/FloatingDataCards";
import { FloatingSatellitePanel } from "@/components/FloatingSatellitePanel";
import { Card, CardContent } from "@/components/ui/card";

const CESIUM_ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN || "";

interface QueryResult {
  action: "filter" | "highlight" | "zoom";
  criteria?: string;
  plotIds?: string[];
}

export default function FarmerPlotView() {
  const [, params] = useRoute("/plot/:id");
  const plotId = params?.id;
  
  const [year, setYear] = useState(2026);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showBambooSim, setShowBambooSim] = useState(false);
  const [activeQuery, setActiveQuery] = useState<QueryResult | null>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const simulationRef = useRef<BambooSimulationRef>(null);

  function handleYearChange(newYear: number) {
    setYear(newYear);
    if (simulationRef.current) {
      simulationRef.current.setYear(newYear);
    }
  }

  const { data: plot, isLoading: plotLoading } = useQuery<Plot>({
    queryKey: ["/api/plots", plotId],
    enabled: !!plotId,
  });

  const { data: stewards } = useQuery<Steward[]>({
    queryKey: ["/api/stewards"],
  });

  const steward = stewards?.find(s => s.id === plot?.stewardId);

  const sensorData = {
    temperature: 28 + Math.sin(Date.now() / 10000) * 3,
    soilMoisture: 45 + Math.cos(Date.now() / 15000) * 10,
    humidity: 78 + Math.sin(Date.now() / 12000) * 8,
  };

  if (plotLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading plot data...</p>
        </div>
      </div>
    );
  }

  if (!plot) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Plot not found</p>
            <Link href="/">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  function handleQueryResult(result: QueryResult) {
    setActiveQuery(result);
    
    if (result.action === "highlight" || result.action === "zoom") {
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 3000);
    }
    
    if (result.action === "filter" && result.criteria === "low_ndvi") {
      setShowSatellite(true);
    }
  }

  function clearQuery() {
    setActiveQuery(null);
    setIsHighlighted(false);
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-background">
      <div className={`absolute inset-0 transition-all duration-500 ${
        isHighlighted ? "ring-4 ring-inset ring-primary/50" : ""
      }`}>
        <CesiumPlotTerrain 
          plot={plot} 
          cesiumToken={CESIUM_ION_TOKEN} 
          year={year}
          showLidar={false}
        />
      </div>

      {/* Bamboo Simulation Overlay */}
      {showBambooSim && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-[800px] h-[80vh] md:h-[600px] relative overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-50 bg-white/80"
              onClick={() => setShowBambooSim(false)}
              data-testid="button-close-bamboo-sim"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="absolute top-2 left-2 z-50 bg-white/90 px-3 py-1.5 rounded-md">
              <span className="text-sm font-medium">Bamboo Growth Simulation • Year {year}</span>
            </div>
            <BambooSimulationComponent 
              ref={simulationRef}
              initialYear={year}
              autoPlay={false}
              showControls={true}
              onYearChange={handleYearChange}
            />
          </Card>
        </div>
      )}

      {isHighlighted && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute inset-0 border-4 border-primary/30 animate-pulse" />
        </div>
      )}

      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <Link href="/">
          <Button 
            variant="outline" 
            size="icon" 
            className="bg-card/90 backdrop-blur-sm shadow-lg"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        {activeQuery && (
          <Card className="bg-card/90 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-left-2">
            <CardContent className="p-2 flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {activeQuery.action === "highlight" && "Highlighting plot"}
                {activeQuery.action === "zoom" && "Focused on plot"}
                {activeQuery.action === "filter" && `Filter: ${activeQuery.criteria}`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={clearQuery}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <FloatingDataCards
        plot={plot}
        steward={steward}
        year={year}
        onYearChange={handleYearChange}
        onOpenSatellite={() => setShowSatellite(true)}
        onOpenBambooSim={() => setShowBambooSim(true)}
        sensorData={sensorData}
      />

      <FloatingSatellitePanel
        plot={plot}
        isOpen={showSatellite}
        onClose={() => setShowSatellite(false)}
      />

      <div className="hidden md:block">
        <FloatingChatPanel 
          plot={plot} 
          steward={steward}
          onQueryResult={handleQueryResult}
        />
      </div>
    </div>
  );
}
