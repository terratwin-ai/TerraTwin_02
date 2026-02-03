import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Leaf, 
  Thermometer, 
  Droplets,
  Satellite,
  Activity,
  ChevronRight,
  ChevronDown,
  Layers,
  X,
  Sprout,
  TrendingUp
} from "lucide-react";
import type { Plot, Steward } from "@shared/schema";

interface FloatingDataCardsProps {
  plot: Plot;
  steward?: Steward;
  year: number;
  onYearChange: (year: number) => void;
  onOpenSatellite?: () => void;
  onOpenBambooSim?: () => void;
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
  onOpenBambooSim,
  sensorData 
}: FloatingDataCardsProps) {
  const [showDetails, setShowDetails] = useState(true);
  const [showTechnical, setShowTechnical] = useState(false);
  
  const yearsGrown = Math.max(0, year - 2024);
  const harvestStartYear = 3;
  const canHarvest = yearsGrown >= harvestStartYear;
  
  const carbonRatePerHa = 87.5;
  const progress = Math.min(1, yearsGrown / 6);
  const currentCarbonRate = carbonRatePerHa * progress;
  const annualCarbon = plot.areaHectares * currentCarbonRate;
  const carbonPricePerTon = 30;
  const carbonIncome = annualCarbon * carbonPricePerTon;
  
  const spacingMeters = 5;
  const plotSizeMeters = Math.sqrt(plot.areaHectares * 10000);
  const clumpsPerRow = Math.floor(plotSizeMeters / spacingMeters);
  const totalClumps = clumpsPerRow * clumpsPerRow;
  const polesPerClump = Math.min(100, 5 + progress * 95);
  const harvestablePercent = canHarvest ? 0.20 : 0;
  const totalPoles = totalClumps * polesPerClump;
  const harvestablePolesPerYear = totalPoles * harvestablePercent;
  const polePrice = 12;
  const harvestIncome = harvestablePolesPerYear * polePrice;
  
  const totalIncome = carbonIncome + harvestIncome;

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
      <div className="fixed top-4 left-4 w-[380px]" data-testid="floating-data-cards">
        <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl max-h-[calc(100vh-320px)] overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <CardContent className="p-4 space-y-4">
              {/* Plot Info - Simplified */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold" data-testid="text-plot-name">{plot.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {plot.areaHectares} hectares
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowDetails(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Year Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Planning Year</span>
                  <span className="text-lg font-bold text-primary">{year}</span>
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
              </div>

              <div className="border-t border-border/50" />

              {/* Your Earnings - Hero Section */}
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground mb-1">Your Projected Earnings</p>
                <p className="text-3xl font-bold text-emerald-500" data-testid="text-total-income">
                  ${totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground">per year by {year}</p>
              </div>

              {/* Income Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Leaf className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium">Carbon Credits</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-600">${carbonIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-muted-foreground">{annualCarbon.toFixed(0)} credits × ${carbonPricePerTon}</p>
                </div>
                
                <div className={`rounded-lg p-3 ${canHarvest ? 'bg-amber-500/10' : 'bg-muted/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Sprout className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium">Pole Harvest</span>
                  </div>
                  {canHarvest ? (
                    <>
                      <p className="text-lg font-bold text-amber-600">${harvestIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                      <p className="text-xs text-muted-foreground">{harvestablePolesPerYear.toFixed(0)} poles × ${polePrice}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-muted-foreground">—</p>
                      <p className="text-xs text-muted-foreground">Ready in year {harvestStartYear + 2024}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Harvest Status */}
              {canHarvest && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Ready to Harvest!</p>
                    <p className="text-xs text-muted-foreground">
                      {harvestablePolesPerYear.toLocaleString('en-US', { maximumFractionDigits: 0 })} poles available this year
                    </p>
                  </div>
                </div>
              )}

              {/* Expandable Technical Details */}
              <Button
                variant="ghost"
                className="w-full justify-between text-muted-foreground hover:text-foreground"
                onClick={() => setShowTechnical(!showTechnical)}
                data-testid="button-toggle-technical"
              >
                <span className="text-sm">Technical Details</span>
                {showTechnical ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>

              {showTechnical && (
                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carbon Rate</span>
                    <span>{currentCarbonRate.toFixed(1)} t CO2e/ha/yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total clumps</span>
                    <span>{totalClumps} ({spacingMeters}m spacing)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Poles per clump</span>
                    <span>{polesPerClump.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total poles</span>
                    <span>{totalPoles.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Health score</span>
                    <span>{plot.healthScore}%</span>
                  </div>
                </div>
              )}

              <div className="border-t border-border/50" />

              {/* Action Buttons */}
              {onOpenSatellite && (
                <Button
                  variant="ghost"
                  className="w-full justify-between hover:bg-muted/50"
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
            </CardContent>
          </ScrollArea>
        </Card>
      </div>

      {/* Compact Sensor Bar - Top Right */}
      <div className="fixed top-4 right-4" data-testid="sensor-cards">
        <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">
          <CardContent className="p-2 flex items-center gap-3">
            <div className="flex items-center gap-2 px-2 border-r border-border/50">
              <Thermometer className="h-3.5 w-3.5 text-red-500" />
              <span className="text-sm font-bold">{sensorData.temperature.toFixed(1)}°C</span>
            </div>
            
            <div className="flex items-center gap-2 px-2 border-r border-border/50">
              <Droplets className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-sm font-bold">{sensorData.soilMoisture.toFixed(0)}%</span>
            </div>
            
            <div className="flex items-center gap-2 px-2">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-sm font-bold">{plot.healthScore}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
