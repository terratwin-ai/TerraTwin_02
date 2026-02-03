import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Leaf, 
  Thermometer, 
  Droplets,
  MapPin,
  Satellite,
  Activity,
  ChevronRight,
  ChevronDown,
  Layers,
  X,
  Trees,
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
  const [showMore, setShowMore] = useState(false);
  
  const yearsGrown = Math.max(0, year - 2024);
  const harvestStartYear = 3;
  const canHarvest = yearsGrown >= harvestStartYear;
  
  const carbonRatePerHa = 87.5;
  const progress = Math.min(1, yearsGrown / 6);
  const currentCarbonRate = carbonRatePerHa * progress;
  const annualCarbon = plot.areaHectares * currentCarbonRate;
  const carbonPricePerTon = 30;
  const carbonIncome = annualCarbon * carbonPricePerTon;
  
  const clumpsPerHa = 150;
  const polesPerClump = Math.min(100, 5 + progress * 95);
  const harvestablePercent = canHarvest ? 0.20 : 0;
  const totalPoles = plot.areaHectares * clumpsPerHa * polesPerClump;
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
      <div className="fixed top-4 left-4 w-[380px] max-h-[55vh] overflow-hidden" data-testid="floating-data-cards">
        <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">
          <CardContent className="p-3 space-y-3">
            {/* Plot Header - Compact */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trees className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-semibold text-sm" data-testid="text-plot-name">{plot.name}</p>
                  <p className="text-xs text-muted-foreground">{plot.areaHectares} ha</p>
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
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowDetails(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Year Slider - Compact */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Year</span>
                <span className="text-sm font-bold text-primary">{year}</span>
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
            </div>

            {/* Earnings Hero - Compact */}
            <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Your Projected Earnings</p>
              <p className="text-2xl font-bold text-emerald-500" data-testid="text-total-income">
                ${totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                <span className="text-sm font-normal text-muted-foreground">/yr</span>
              </p>
            </div>

            {/* Income Breakdown - Compact */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="font-semibold text-emerald-600">${carbonIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-muted-foreground">Carbon</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canHarvest ? (
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                ) : (
                  <Sprout className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className={`font-semibold ${canHarvest ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {canHarvest ? `$${harvestIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">{canHarvest ? 'Harvest' : `Harvest ${2024 + harvestStartYear}`}</p>
                </div>
              </div>
            </div>

            {/* Expand for More */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs text-muted-foreground h-8"
              onClick={() => setShowMore(!showMore)}
              data-testid="button-toggle-more"
            >
              <span>More details</span>
              {showMore ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>

            {showMore && (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <span>Carbon rate</span>
                  <span className="text-right">{currentCarbonRate.toFixed(1)} t/ha/yr</span>
                  <span>Total poles</span>
                  <span className="text-right">{totalPoles.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                  <span>Health score</span>
                  <span className="text-right">{plot.healthScore}%</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  {onOpenBambooSim && (
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={onOpenBambooSim} data-testid="button-open-bamboo-sim">
                      <Trees className="h-3 w-3 mr-1" /> 3D View
                    </Button>
                  )}
                  {onOpenSatellite && (
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={onOpenSatellite} data-testid="button-open-satellite">
                      <Satellite className="h-3 w-3 mr-1" /> Satellite
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
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
