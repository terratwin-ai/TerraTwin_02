import { Leaf } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center">
        <div className="relative mb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
        <p className="text-muted-foreground">Loading TerraTwin...</p>
      </div>
    </div>
  );
}

export function SceneLoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative mb-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center">
            <Leaf className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full border-2 border-transparent border-t-primary animate-spin" style={{ animationDuration: '1s' }} />
        </div>
        <h3 className="text-lg font-medium mb-1">Initializing Digital Twin</h3>
        <p className="text-sm text-muted-foreground">Loading landscape data...</p>
      </div>
    </div>
  );
}
