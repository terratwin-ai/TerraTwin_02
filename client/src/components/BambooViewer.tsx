import { useEffect, useRef, useState } from "react";
import { BambooSimulation } from "@/lib/BambooSimulation";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Eye, ArrowUp } from "lucide-react";

interface BambooViewerProps {
  year: number;
  onMetricsUpdate?: (metrics: { height: number; poleCount: number; carbon: number }) => void;
}

export function BambooViewer({ year, onMetricsUpdate }: BambooViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<BambooSimulation | null>(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      simulationRef.current = new BambooSimulation(containerRef.current);
    } catch (error) {
      console.error("Failed to initialize bamboo simulation:", error);
      setWebglError(true);
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.cleanup();
        simulationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!simulationRef.current) return;

    const progress = (year - 2024) / (2035 - 2024);
    const metrics = simulationRef.current.update(progress);
    
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [year, onMetricsUpdate]);

  useEffect(() => {
    function handleResize() {
      if (simulationRef.current) {
        simulationRef.current.handleResize();
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (webglError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <div className="text-center p-6">
          <p className="text-lg font-medium mb-2">3D View Unavailable</p>
          <p className="text-muted-foreground text-sm">
            WebGL is not supported or disabled in your browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" data-testid="bamboo-viewer" />
      
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          className="bg-card/90 backdrop-blur-sm shadow-lg"
          onClick={() => simulationRef.current?.zoomIn()}
          data-testid="button-zoom-in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-card/90 backdrop-blur-sm shadow-lg"
          onClick={() => simulationRef.current?.zoomOut()}
          data-testid="button-zoom-out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-card/90 backdrop-blur-sm shadow-lg"
          onClick={() => simulationRef.current?.resetCameraPosition()}
          data-testid="button-reset-view"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-card/90 backdrop-blur-sm shadow-lg"
          onClick={() => simulationRef.current?.topView()}
          data-testid="button-top-view"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-card/90 backdrop-blur-sm shadow-lg"
          onClick={() => simulationRef.current?.sideView()}
          data-testid="button-side-view"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
