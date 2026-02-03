import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Satellite } from "lucide-react";
import type { Plot } from "@shared/schema";
import { SatelliteAnalysis } from "./SatelliteAnalysis";

interface FloatingSatellitePanelProps {
  plot: Plot;
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingSatellitePanel({ plot, isOpen, onClose }: FloatingSatellitePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => setIsAnimating(true));
    } else if (isVisible) {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-y-0 right-0 w-[420px] z-50 transition-transform duration-300 ease-out ${
        isAnimating ? "translate-x-0" : "translate-x-full"
      }`}
      data-testid="floating-satellite-panel"
    >
      <Card className="h-full rounded-none bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Satellite className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold">Satellite Analysis</p>
              <p className="text-xs text-muted-foreground">Clay Foundation Model</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-satellite"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <ScrollArea className="h-[calc(100%-80px)]">
          <SatelliteAnalysis plot={plot} />
        </ScrollArea>
      </Card>
    </div>
  );
}
