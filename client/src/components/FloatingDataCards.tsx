import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Leaf, 
  Thermometer, 
  Droplets,
  Satellite,
  Activity,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
  const [mobileExpanded, setMobileExpanded] = useState(false);
  
  const plantingYear = 2026;
  const yearsGrown = Math.max(0, year - plantingYear);
  const harvestStartYear = 5;
  const canHarvest = yearsGrown >= harvestStartYear;
  
  const carbonRatePerHa = 87.5;
  const progress = Math.min(1, yearsGrown / 6);
  const currentCarbonRate = carbonRatePerHa * progress;
  const annualCarbon = plot.areaHectares * currentCarbonRate;
  const carbonPricePerTon = 30;
  const carbonIncome = annualCarbon * carbonPricePerTon;
  
  const clumpsPerHa = 150;
  const totalClumps = Math.round(plot.areaHectares * clumpsPerHa);
  const polesPerClump = Math.min(100, 5 + progress * 95);
  const totalPoles = totalClumps * polesPerClump;
  const harvestablePolesPerClumpPerYear = 20;
  const harvestablePolesPerYear = canHarvest ? totalClumps * harvestablePolesPerClumpPerYear : 0;
  const polePrice = 10;
  const harvestIncome = harvestablePolesPerYear * polePrice;
  
  const totalIncome = carbonIncome + harvestIncome;

  if (!showDetails) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed top-14 md:top-20 left-4 bg-card/90 backdrop-blur-sm z-30"
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
      {/* Sensor Bar - Top right on desktop, compact top bar on mobile */}
      <div className="fixed top-4 left-14 right-4 md:left-auto md:right-4 z-30" data-testid="sensor-cards">
        <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">
          <CardContent className="p-2 flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 px-2 border-r border-border/50">
              <Thermometer className="h-3.5 w-3.5 text-red-500" />
              <span className="text-sm font-bold">{sensorData.temperature.toFixed(1)}°C</span>
            </div>
            
            <div className="flex items-center gap-1.5 px-2 border-r border-border/50">
              <Droplets className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-sm font-bold">{sensorData.soilMoisture.toFixed(0)}%</span>
            </div>
            
            <div className="flex items-center gap-1.5 px-2">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-sm font-bold">{plot.healthScore}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Cards - Bottom sheet on mobile, left panel on desktop */}
      <div 
        className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-4 md:left-4 md:right-auto md:w-[380px] md:max-h-[calc(100vh-200px)] z-40"
        data-testid="floating-data-cards"
      >
        <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl flex flex-col !rounded-b-none md:!rounded-b-xl">
          {/* Mobile drag handle */}
          <div
            className="flex items-center justify-center py-1.5 cursor-pointer md:hidden"
            onClick={() => setMobileExpanded(!mobileExpanded)}
            data-testid="button-toggle-mobile-expand"
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Compact header always visible on mobile */}
          <div className="px-4 pt-1 pb-2 md:pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Leaf className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" data-testid="text-plot-name">{plot.name}</p>
                  <p className="text-xs text-muted-foreground">{plot.areaHectares} ha</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
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

            {/* Year slider + earnings always visible */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Year {year}</span>
                <span className="text-sm font-bold text-emerald-500" data-testid="text-total-income">
                  ${totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}/yr
                </span>
              </div>
              <Slider
                value={[year]}
                onValueChange={([v]) => onYearChange(v)}
                min={2026}
                max={2040}
                step={1}
                className="w-full"
                data-testid="slider-year"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>2026</span>
                <span>2040</span>
              </div>
            </div>

            {/* Mobile expand/collapse toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1 text-xs text-muted-foreground md:hidden"
              onClick={() => setMobileExpanded(!mobileExpanded)}
              data-testid="button-expand-details"
            >
              {mobileExpanded ? (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Less details
                </>
              ) : (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  More details
                </>
              )}
            </Button>
          </div>

          {/* Expanded content - always on desktop, toggle on mobile */}
          <div className={`${mobileExpanded ? 'max-h-[40vh] overflow-y-auto' : 'max-h-0 md:max-h-none overflow-hidden md:overflow-y-auto'} transition-all duration-300`}>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                <div className="border-t border-border/50 pt-3" />

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-500/10 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Leaf className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-medium">Carbon Credits</span>
                    </div>
                    <p className="text-base font-bold text-emerald-600">${carbonIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] text-muted-foreground">{annualCarbon.toFixed(0)} credits × ${carbonPricePerTon}</p>
                  </div>
                  
                  <div className={`rounded-lg p-2.5 ${canHarvest ? 'bg-amber-500/10' : 'bg-muted/30'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sprout className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium">Pole Harvest</span>
                    </div>
                    {canHarvest ? (
                      <>
                        <p className="text-base font-bold text-amber-600">${harvestIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] text-muted-foreground">{harvestablePolesPerYear.toFixed(0)} poles × ${polePrice}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-base font-bold text-muted-foreground">—</p>
                        <p className="text-[10px] text-muted-foreground">Ready in {plantingYear + harvestStartYear}</p>
                      </>
                    )}
                  </div>
                </div>

                {canHarvest && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">Ready to Harvest!</p>
                      <p className="text-[10px] text-muted-foreground">
                        {harvestablePolesPerYear.toLocaleString('en-US', { maximumFractionDigits: 0 })} poles available
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="w-full justify-between text-muted-foreground hover:text-foreground h-8"
                  onClick={() => setShowTechnical(!showTechnical)}
                  data-testid="button-toggle-technical"
                >
                  <span className="text-xs">Technical Details</span>
                  {showTechnical ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </Button>

                {showTechnical && (
                  <div className="bg-muted/30 rounded-lg p-2.5 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Carbon Rate</span>
                      <span>{currentCarbonRate.toFixed(1)} t CO2e/ha/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total clumps</span>
                      <span>{totalClumps} (8m × 8m)</span>
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

                {onOpenSatellite && (
                  <>
                    <div className="border-t border-border/50" />
                    <Button
                      variant="ghost"
                      className="w-full justify-between hover:bg-muted/50 h-8"
                      onClick={onOpenSatellite}
                      data-testid="button-open-satellite"
                    >
                      <div className="flex items-center gap-2">
                        <Satellite className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs">Satellite Analysis</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </CardContent>
          </div>
        </Card>
      </div>
    </>
  );
}
