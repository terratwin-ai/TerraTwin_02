import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import type { Plot } from "@shared/schema";
import { SatelliteAnalysis, type SatelliteModel } from "./SatelliteAnalysis";

interface FloatingSatellitePanelProps {
  plot: Plot;
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingSatellitePanel({ plot, isOpen, onClose }: FloatingSatellitePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<SatelliteModel>("clay");

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
      className={`fixed inset-y-0 right-0 w-[340px] z-50 transition-transform duration-300 ease-out ${
        isAnimating ? "translate-x-0" : "translate-x-full"
      }`}
      data-testid="floating-satellite-panel"
    >
      <Card className="h-full rounded-none bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl">
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-satellite"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-full">
          <SatelliteAnalysis 
            plot={plot} 
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </ScrollArea>
      </Card>
    </div>
  );
}
