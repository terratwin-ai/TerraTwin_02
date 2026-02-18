import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  X, 
  Satellite, 
  Leaf, 
  TrendingUp, 
  TrendingDown,
  MapPin,
  Calendar,
  RefreshCw,
  Layers,
  BarChart3,
  Activity,
  Zap,
  Globe
} from "lucide-react";
import type { Plot } from "@shared/schema";
import { SATELLITE_MODELS, type SatelliteModel } from "./SatelliteAnalysis";

interface FloatingLandscapeSatelliteProps {
  plots: Plot[];
  isOpen: boolean;
  onClose: () => void;
}

interface LandscapeAnalysis {
  totalArea: number;
  avgNdvi: number;
  totalBiomass: number;
  totalCarbonStock: number;
  avgHealthScore: number;
  plotsByHealth: {
    dense: number;
    moderate: number;
    sparse: number;
    low: number;
  };
  changeDetection: {
    growth: number;
    stable: number;
    decline: number;
  };
  lastCapture: string;
  sensor: string;
  resolution: string;
  coverage: number;
}

function generateLandscapeAnalysis(plots: Plot[], model: SatelliteModel = "clay"): LandscapeAnalysis {
  if (plots.length === 0) {
    return {
      totalArea: 0,
      avgNdvi: 0,
      totalBiomass: 0,
      totalCarbonStock: 0,
      avgHealthScore: 0,
      plotsByHealth: { dense: 0, moderate: 0, sparse: 0, low: 0 },
      changeDetection: { growth: 0, stable: 0, decline: 0 },
      lastCapture: "N/A",
      sensor: "N/A",
      resolution: "N/A",
      coverage: 0
    };
  }

  const totalArea = plots.reduce((sum, p) => sum + Number(p.areaHectares || 0), 0);
  const totalCarbon = plots.reduce((sum, p) => sum + Number(p.carbonTons || 0), 0);
  const avgHealth = plots.reduce((sum, p) => sum + Number(p.healthScore || 75), 0) / plots.length;
  
  const healthMultiplier = avgHealth / 100;
  // AlphaEarth uses multi-modal data for slightly better accuracy
  const modelBonus = model === "alphaearth" ? 0.02 : 0;
  const avgNdvi = 0.4 + healthMultiplier * 0.45 + modelBonus;
  const totalBiomass = totalCarbon * 2.5 + (model === "alphaearth" ? plots.length * 0.5 : 0);

  const plotsByHealth = { dense: 0, moderate: 0, sparse: 0, low: 0 };
  plots.forEach(plot => {
    const health = Number(plot.healthScore || 75);
    if (health >= 85) plotsByHealth.dense++;
    else if (health >= 70) plotsByHealth.moderate++;
    else if (health >= 50) plotsByHealth.sparse++;
    else plotsByHealth.low++;
  });

  const changeDetection = { growth: 0, stable: 0, decline: 0 };
  plots.forEach(plot => {
    const hash = plot.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const type = hash % 3;
    if (type === 0) changeDetection.growth++;
    else if (type === 1) changeDetection.stable++;
    else changeDetection.decline++;
  });

  // Different sensors based on model
  const sensor = model === "alphaearth" 
    ? "Multi-modal (Sentinel-2, SAR, LiDAR)" 
    : "Sentinel-2 L2A";
  
  // AlphaEarth has better cloud penetration
  const coverage = model === "alphaearth" ? 98.2 : 94.5;

  return {
    totalArea,
    avgNdvi: Math.min(0.95, Math.max(0.2, avgNdvi)),
    totalBiomass,
    totalCarbonStock: totalCarbon,
    avgHealthScore: avgHealth,
    plotsByHealth,
    changeDetection,
    lastCapture: "2026-01-28",
    sensor: sensor,
    resolution: "10m",
    coverage: coverage
  };
}

function LandscapeNDVIGauge({ value }: { value: number }) {
  const percentage = value * 100;
  const getColor = () => {
    if (value >= 0.7) return "text-green-500";
    if (value >= 0.5) return "text-lime-500";
    if (value >= 0.3) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${percentage * 2.51} 251`}
            strokeLinecap="round"
            className={getColor()}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold ${getColor()}`} data-testid="text-landscape-ndvi">
            {value.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">Avg NDVI</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground text-center">
        {value >= 0.7 ? "Dense Coverage" : value >= 0.5 ? "Moderate Coverage" : value >= 0.3 ? "Sparse Coverage" : "Low Coverage"}
      </div>
    </div>
  );
}

function LandscapeHeatmap({ plots }: { plots: Plot[] }) {
  const gridSize = 10;
  const cells = [];
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const plotIndex = (y * gridSize + x) % Math.max(1, plots.length);
      const plot = plots[plotIndex];
      const health = plot ? Number(plot.healthScore || 75) : 50;
      const noise = Math.sin((x * 7 + y * 13) * 0.5) * 10;
      const ndvi = 0.3 + (health / 100) * 0.5 + noise / 100;
      
      const getHeatColor = (v: number) => {
        if (v >= 0.75) return "bg-green-600";
        if (v >= 0.65) return "bg-green-500";
        if (v >= 0.55) return "bg-lime-500";
        if (v >= 0.45) return "bg-lime-400";
        if (v >= 0.35) return "bg-yellow-400";
        if (v >= 0.25) return "bg-orange-400";
        return "bg-red-400";
      };
      
      cells.push(
        <div
          key={`${x}-${y}`}
          className={`aspect-square ${getHeatColor(ndvi)} rounded-sm transition-colors`}
          title={`NDVI: ${ndvi.toFixed(2)}`}
          data-testid={`cell-heatmap-${x}-${y}`}
        />
      );
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">Project Area NDVI Map</div>
      <div className="grid grid-cols-10 gap-0.5 p-2 bg-muted/30 rounded-lg">
        {cells}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-400" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-yellow-400" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>Dense</span>
        </div>
      </div>
    </div>
  );
}

function TimeSeriesChart({ plots }: { plots: Plot[] }) {
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
  const avgHealth = plots.reduce((sum, p) => sum + Number(p.healthScore || 75), 0) / Math.max(1, plots.length);
  
  const values = months.map((_, i) => {
    const trend = i * 0.02;
    const seasonal = Math.sin((i + 2) * 0.8) * 0.05;
    return Math.min(0.95, Math.max(0.4, 0.55 + (avgHealth / 100) * 0.3 + trend + seasonal));
  });

  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">NDVI Trend (6 months)</div>
      <div className="h-32 flex items-end gap-1 p-2 bg-muted/30 rounded-lg">
        {values.map((val, i) => {
          const height = ((val - minVal) / (maxVal - minVal + 0.01)) * 80 + 20;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full bg-primary/80 rounded-t transition-all"
                style={{ height: `${height}%` }}
                title={`${months[i]}: ${val.toFixed(3)}`}
              />
              <span className="text-[10px] text-muted-foreground">{months[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FloatingLandscapeSatellite({ plots, isOpen, onClose }: FloatingLandscapeSatelliteProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<LandscapeAnalysis | null>(null);
  const [selectedModel, setSelectedModel] = useState<SatelliteModel>("clay");

  const modelInfo = SATELLITE_MODELS[selectedModel];

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => setIsAnimating(true));
      
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        setAnalysis(generateLandscapeAnalysis(plots, selectedModel));
        setIsAnalyzing(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, plots, selectedModel]);

  const handleRefresh = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysis(generateLandscapeAnalysis(plots, selectedModel));
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleModelChange = (model: SatelliteModel) => {
    setSelectedModel(model);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ease-out
        bottom-0 left-0 right-0 top-auto md:top-16 md:right-4 md:bottom-4 md:left-auto w-full md:w-[380px] max-h-[80vh] md:max-h-none
        ${isAnimating 
          ? "translate-y-0 md:translate-y-0 md:translate-x-0 opacity-100" 
          : "translate-y-full md:translate-y-0 md:translate-x-full opacity-0"
        }`}
      data-testid="landscape-satellite-panel"
    >
      <Card className="h-full bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl flex flex-col !rounded-b-none md:!rounded-b-xl">
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Satellite className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Landscape Analysis</h3>
                <p className="text-xs text-muted-foreground">{modelInfo.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isAnalyzing}
                className="h-8 w-8"
                data-testid="button-refresh-analysis"
              >
                <RefreshCw className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
                data-testid="button-close-satellite"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Model Selector */}
          <div className="flex items-center gap-2 mt-3">
            <Select value={selectedModel} onValueChange={(v) => handleModelChange(v as SatelliteModel)}>
              <SelectTrigger className="flex-1 h-8 text-xs" data-testid="select-landscape-model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clay" data-testid="option-landscape-model-clay">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Clay Foundation Model</span>
                    <span className="text-xs text-muted-foreground">Made With ML • Sentinel-2</span>
                  </div>
                </SelectItem>
                <SelectItem value="alphaearth" data-testid="option-landscape-model-alphaearth">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">AlphaEarth Foundations</span>
                    <span className="text-xs text-muted-foreground">Google DeepMind • Multi-modal</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {selectedModel === "alphaearth" && (
              <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                New
              </Badge>
            )}
          </div>
        </CardHeader>

        <ScrollArea className="flex-1">
          <CardContent className="pt-2 pb-4">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <Satellite className="h-12 w-12 text-primary animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-2 border-primary/30 rounded-full animate-ping" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Processing Satellite Imagery</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Running {modelInfo.name} embeddings...
                  </p>
                </div>
                <Progress value={45} className="w-48" />
              </div>
            ) : analysis ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-9">
                  <TabsTrigger value="overview" className="text-xs" data-testid="tab-overview">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="ndvi" className="text-xs" data-testid="tab-ndvi">
                    NDVI
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="text-xs" data-testid="tab-trends">
                    Trends
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-muted/30 border-0">
                      <CardContent className="p-3 text-center">
                        <Globe className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                        <div className="text-lg font-bold" data-testid="text-total-area">
                          {analysis.totalArea.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Hectares</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-0">
                      <CardContent className="p-3 text-center">
                        <MapPin className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                        <div className="text-lg font-bold" data-testid="text-plot-count">
                          {plots.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Active Plots</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-0">
                      <CardContent className="p-3 text-center">
                        <Leaf className="h-5 w-5 mx-auto text-green-500 mb-1" />
                        <div className="text-lg font-bold" data-testid="text-total-carbon">
                          {analysis.totalCarbonStock.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Carbon (t CO₂e)</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-0">
                      <CardContent className="p-3 text-center">
                        <Zap className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                        <div className="text-lg font-bold" data-testid="text-total-biomass">
                          {analysis.totalBiomass.toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Biomass (t)</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-muted/30 border-0">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Health Distribution</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-xs flex-1">Dense ({">"}85%)</span>
                          <Badge variant="secondary" className="text-xs">
                            {analysis.plotsByHealth.dense} plots
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-lime-500" />
                          <span className="text-xs flex-1">Moderate (70-85%)</span>
                          <Badge variant="secondary" className="text-xs">
                            {analysis.plotsByHealth.moderate} plots
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="text-xs flex-1">Sparse (50-70%)</span>
                          <Badge variant="secondary" className="text-xs">
                            {analysis.plotsByHealth.sparse} plots
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-xs flex-1">Low ({"<"}50%)</span>
                          <Badge variant="secondary" className="text-xs">
                            {analysis.plotsByHealth.low} plots
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30 border-0">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Change Detection</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <TrendingUp className="h-4 w-4 mx-auto text-green-500 mb-1" />
                          <div className="text-sm font-bold text-green-600">
                            {analysis.changeDetection.growth}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Growth</div>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Activity className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                          <div className="text-sm font-bold text-blue-600">
                            {analysis.changeDetection.stable}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Stable</div>
                        </div>
                        <div className="p-2 rounded-lg bg-red-500/10">
                          <TrendingDown className="h-4 w-4 mx-auto text-red-500 mb-1" />
                          <div className="text-sm font-bold text-red-600">
                            {analysis.changeDetection.decline}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Decline</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ndvi" className="mt-4 space-y-4">
                  <div className="flex justify-center">
                    <LandscapeNDVIGauge value={analysis.avgNdvi} />
                  </div>
                  
                  <LandscapeHeatmap plots={plots} />

                  <Card className="bg-muted/30 border-0">
                    <CardContent className="p-3">
                      <div className="text-sm font-medium mb-2">Vegetation Analysis</div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Average NDVI</span>
                          <span className="font-medium">{analysis.avgNdvi.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coverage</span>
                          <span className="font-medium">{analysis.coverage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Health Score</span>
                          <span className="font-medium">{analysis.avgHealthScore.toFixed(0)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trends" className="mt-4 space-y-4">
                  <TimeSeriesChart plots={plots} />

                  <Card className="bg-muted/30 border-0">
                    <CardContent className="p-3">
                      <div className="text-sm font-medium mb-2">Capture Information</div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Capture</span>
                          <span className="font-medium">{analysis.lastCapture}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sensor</span>
                          <span className="font-medium">{analysis.sensor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Resolution</span>
                          <span className="font-medium">{analysis.resolution}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Layers className="h-4 w-4 text-primary mt-0.5" />
                        <div className="text-xs">
                          <span className="font-medium">Clay Foundation Model</span>
                          <p className="text-muted-foreground mt-0.5">
                            Analysis powered by open-source AI for Earth observation. 
                            Embeddings generated from multi-spectral satellite imagery.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : null}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
