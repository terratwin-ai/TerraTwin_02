import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Leaf, 
  TrendingUp, 
  Thermometer, 
  Droplets,
  Calendar,
  MapPin,
  Satellite,
  Activity,
  ChevronRight,
  Layers,
  X
} from "lucide-react";
import type { Plot, Steward } from "@shared/schema";

interface FloatingDataCardsProps {
  plot: Plot;
  steward?: Steward;
  year: number;
  onYearChange: (year: number) => void;
  onOpenSatellite?: () => void;
  sensorData: {
    temperature: number;
    soilMoisture: number;
    humidity: number;
  };
}

export function FloatingDataCards({ 
  plot, 
  steward, 
  year, 
  onYearChange,
  onOpenSatellite,
  sensorData 
}: FloatingDataCardsProps) {
  const [showDetails, setShowDetails] = useState(true);
  
  const yearsGrown = Math.max(0, year - 2024);
  const carbonRate = 8.75;
  const annualCarbon = plot.areaHectares * carbonRate;
  const totalCarbon = annualCarbon * yearsGrown;
  const carbonValue = totalCarbon * 30;

  if (!showDetails) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed top-20 left-4 bg-card/90 backdrop-blur-sm"
        onClick={() => setShowDetails(true)}
        data-testid="button-show-details"
      >
        <Layers className="h-4 w-4 mr-2" />
        Show Details
      </Button>
    );
  }

  return (
    <>
      <div className="fixed top-20 left-4 w-72 space-y-3" data-testid="floating-data-cards">
        <Card className="bg-card/90 backdrop-blur-xl border-border/50 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm" data-testid="text-plot-name">{plot.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {steward?.name || "Unassigned"} • {plot.areaHectares} ha
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-1 -mt-1"
                onClick={() => setShowDetails(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            <Badge 
              variant="outline" 
              className={`text-xs ${
                plot.status === "verified" ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/10" :
                plot.status === "pending" ? "border-amber-500/50 text-amber-500 bg-amber-500/10" :
                "border-orange-500/50 text-orange-500 bg-orange-500/10"
              }`}
            >
              {plot.status}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-xl border-border/50 shadow-xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Growth Timeline</span>
              <span className="ml-auto text-sm font-bold text-primary">{year}</span>
            </div>
            <Slider
              value={[year]}
              onValueChange={([v]) => onYearChange(v)}
              min={2024}
              max={2035}
              step={1}
              className="w-full"
              data-testid="slider-year"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2024</span>
              <span>2035</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-xl border-border/50 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Carbon Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-emerald-500">{totalCarbon.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">t CO2e</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-emerald-500">${carbonValue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Credit Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {onOpenSatellite && (
          <Button
            variant="outline"
            className="w-full bg-card/90 backdrop-blur-sm justify-between"
            onClick={onOpenSatellite}
            data-testid="button-open-satellite"
          >
            <div className="flex items-center gap-2">
              <Satellite className="h-4 w-4 text-blue-500" />
              <span>Satellite Analysis</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="fixed top-20 right-4 flex gap-2" data-testid="sensor-cards">
        <Card className="bg-card/90 backdrop-blur-xl border-border/50 shadow-xl">
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Thermometer className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Temp</p>
              <p className="text-sm font-bold">{sensorData.temperature.toFixed(1)}°C</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-xl border-border/50 shadow-xl">
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Droplets className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Moisture</p>
              <p className="text-sm font-bold">{sensorData.soilMoisture.toFixed(0)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-xl border-border/50 shadow-xl">
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Health</p>
              <p className="text-sm font-bold">{plot.healthScore}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
