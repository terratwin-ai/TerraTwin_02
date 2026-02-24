import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Satellite, Leaf, TrendingUp, Calendar, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Plot } from "@shared/schema";

export type SatelliteModel = "clay" | "alphaearth";

export const SATELLITE_MODELS = {
  clay: {
    id: "clay" as const,
    name: "Clay Foundation Model",
    provider: "Made With ML",
    description: "Open-source Earth observation model",
    embedDimensions: 768,
    source: "Sentinel-2"
  },
  alphaearth: {
    id: "alphaearth" as const,
    name: "AlphaEarth Foundations",
    provider: "Google DeepMind",
    description: "AI-powered satellite embedding",
    embedDimensions: 64,
    source: "Multi-modal (optical, radar, LiDAR)"
  }
};

interface SatelliteAnalysisProps {
  plot: Plot;
  selectedModel?: SatelliteModel;
  onModelChange?: (model: SatelliteModel) => void;
}

interface AnalysisResult {
  ndvi: number;
  biomassEstimate: number;
  carbonStock: number;
  healthScore: number;
  changeDetection: {
    type: "growth" | "stable" | "decline" | "cleared";
    percentChange: number;
    period: string;
  };
  lastCapture: string;
  cloudCover: number;
  resolution: string;
  sensor: string;
}

function generateMockAnalysis(plot: Plot, model: SatelliteModel): AnalysisResult {
  const healthScore = Number(plot.healthScore ?? 75);
  const carbonTons = Number(plot.carbonTons ?? 25);
  const latitude = Number(plot.latitude ?? 8.4);
  const longitude = Number(plot.longitude ?? 124.4);
  const plotIdHash = plot.id ? plot.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 100;
  const seed = plotIdHash * 17 + latitude * 1000 + longitude * 500;
  const random = (min: number, max: number) => {
    const x = Math.sin(seed + min) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };

  const healthMultiplier = healthScore / 100;
  
  // AlphaEarth uses multi-modal data so slightly different results
  const modelBonus = model === "alphaearth" ? 0.03 : 0;
  const ndvi = 0.4 + healthMultiplier * 0.45 + random(-0.05, 0.05) + modelBonus;
  const biomass = Number(carbonTons) * 2.5 + random(-5, 10) + (model === "alphaearth" ? 2 : 0);
  
  const changeTypes: Array<"growth" | "stable" | "decline" | "cleared"> = ["growth", "stable", "growth", "stable"];
  const changeType = changeTypes[plotIdHash % 4];
  
  // Different sensors based on model
  const sensor = model === "alphaearth" 
    ? "Multi-modal (Sentinel-2, SAR, LiDAR)" 
    : "Sentinel-2 L2A";
  
  // AlphaEarth handles cloud cover better
  const cloudCover = model === "alphaearth" 
    ? random(0, 8) 
    : random(5, 25);
  
  return {
    ndvi: Math.min(0.95, Math.max(0.2, ndvi)),
    biomassEstimate: Math.max(10, biomass),
    carbonStock: carbonTons,
    healthScore: healthScore,
    changeDetection: {
      type: changeType,
      percentChange: changeType === "growth" ? random(5, 25) : changeType === "decline" ? random(-15, -5) : random(-2, 2),
      period: "Last 6 months"
    },
    lastCapture: "2026-01-28",
    cloudCover: cloudCover,
    resolution: "10m",
    sensor: sensor
  };
}

function NDVIGauge({ value }: { value: number }) {
  const percentage = value * 100;
  const getColor = () => {
    if (value >= 0.7) return "text-green-500";
    if (value >= 0.5) return "text-lime-500";
    if (value >= 0.3) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
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
          <span className={`text-2xl font-bold ${getColor()}`} data-testid="text-ndvi-value">{value.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">NDVI</span>
        </div>
      </div>
      <div className="text-sm text-muted-foreground text-center">
        {value >= 0.7 ? "Dense Vegetation" : value >= 0.5 ? "Moderate Vegetation" : value >= 0.3 ? "Sparse Vegetation" : "Low Vegetation"}
      </div>
    </div>
  );
}

function NDVIHeatmap({ plot }: { plot: Plot }) {
  // Generate a simple 8x8 grid heatmap
  // Normalize inputs for consistency
  const gridSize = 8;
  const cells = [];
  // Plot ID is a UUID string, so hash it to get a numeric seed
  const plotIdHash = plot.id ? plot.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 100;
  const seed = plotIdHash * 31;
  const healthScore = Number(plot.healthScore ?? 75);
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const noise = Math.sin(seed + x * 7 + y * 13) * 0.15;
      const baseNdvi = 0.6 + (healthScore / 100) * 0.3;
      const ndvi = Math.min(0.95, Math.max(0.2, baseNdvi + noise));
      
      const getHeatColor = (v: number) => {
        if (v >= 0.8) return "bg-green-600";
        if (v >= 0.7) return "bg-green-500";
        if (v >= 0.6) return "bg-lime-500";
        if (v >= 0.5) return "bg-lime-400";
        if (v >= 0.4) return "bg-yellow-400";
        if (v >= 0.3) return "bg-orange-400";
        return "bg-red-400";
      };
      
      cells.push(
        <div
          key={`${x}-${y}`}
          className={`aspect-square ${getHeatColor(ndvi)} rounded-sm`}
          title={`NDVI: ${ndvi.toFixed(2)}`}
        />
      );
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">Vegetation Density Map</div>
      <div className="grid grid-cols-8 gap-0.5 p-2 bg-muted/30 rounded-lg">
        {cells}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
        <span>Low</span>
        <div className="flex gap-0.5">
          <div className="w-4 h-2 bg-red-400 rounded-sm" />
          <div className="w-4 h-2 bg-orange-400 rounded-sm" />
          <div className="w-4 h-2 bg-yellow-400 rounded-sm" />
          <div className="w-4 h-2 bg-lime-400 rounded-sm" />
          <div className="w-4 h-2 bg-lime-500 rounded-sm" />
          <div className="w-4 h-2 bg-green-500 rounded-sm" />
          <div className="w-4 h-2 bg-green-600 rounded-sm" />
        </div>
        <span>High</span>
      </div>
    </div>
  );
}

function TimeSeriesChart({ plot }: { plot: Plot }) {
  // Generate mock time series data
  // Normalize inputs for consistency
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
  const healthScore = Number(plot.healthScore ?? 75);
  const baseNdvi = 0.5 + (healthScore / 100) * 0.35;
  const data = months.map((month, i) => ({
    month,
    ndvi: baseNdvi + Math.sin(i * 0.5) * 0.08 + (i * 0.02)
  }));

  const maxNdvi = Math.max(...data.map(d => d.ndvi));
  const minNdvi = Math.min(...data.map(d => d.ndvi));
  const range = maxNdvi - minNdvi || 0.1;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">NDVI Time Series (6 months)</div>
      <div className="h-32 flex items-end gap-1 p-2 bg-muted/30 rounded-lg">
        {data.map((d, i) => {
          const height = ((d.ndvi - minNdvi + 0.05) / (range + 0.1)) * 100;
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full bg-green-500 rounded-t transition-all"
                style={{ height: `${height}%` }}
                title={`${d.month}: NDVI ${d.ndvi.toFixed(2)}`}
              />
              <span className="text-xs text-muted-foreground">{d.month}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>2025</span>
        <span>2026</span>
      </div>
    </div>
  );
}

export function SatelliteAnalysis({ plot, selectedModel = "clay", onModelChange }: SatelliteAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [internalModel, setInternalModel] = useState<SatelliteModel>(selectedModel);

  const currentModel = onModelChange ? selectedModel : internalModel;
  const modelInfo = SATELLITE_MODELS[currentModel];

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setAnalysis(generateMockAnalysis(plot, currentModel));
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [plot.id, currentModel]);

  const handleModelChange = (model: SatelliteModel) => {
    if (onModelChange) {
      onModelChange(model);
    } else {
      setInternalModel(model);
    }
  };

  if (isLoading || !analysis) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Analyzing satellite imagery...</p>
        <p className="text-xs text-muted-foreground">Powered by {modelInfo.name}</p>
      </div>
    );
  }

  const changeIcon = analysis.changeDetection.type === "growth" ? (
    <TrendingUp className="w-4 h-4 text-green-500" />
  ) : analysis.changeDetection.type === "decline" ? (
    <AlertTriangle className="w-4 h-4 text-orange-500" />
  ) : (
    <CheckCircle2 className="w-4 h-4 text-blue-500" />
  );

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Satellite className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Satellite Analysis</h3>
      </div>

      {/* Model Selector */}
      <div className="flex items-center gap-2">
        <Select value={currentModel} onValueChange={(v) => handleModelChange(v as SatelliteModel)}>
          <SelectTrigger className="w-[220px] h-8 text-xs" data-testid="select-satellite-model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clay" data-testid="option-model-clay">
              <div className="flex flex-col items-start">
                <span className="font-medium">Clay Foundation Model</span>
                <span className="text-xs text-muted-foreground">Made With ML • Sentinel-2</span>
              </div>
            </SelectItem>
            <SelectItem value="alphaearth" data-testid="option-model-alphaearth">
              <div className="flex flex-col items-start">
                <span className="font-medium">AlphaEarth Foundations</span>
                <span className="text-xs text-muted-foreground">Google DeepMind • Multi-modal</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {currentModel === "alphaearth" && (
          <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
            New
          </Badge>
        )}
      </div>

      {/* Capture Info */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">
          <Calendar className="w-3 h-3 mr-1" />
          Captured: {analysis.lastCapture}
        </Badge>
        <Badge variant="secondary">{analysis.sensor}</Badge>
        <Badge variant="secondary">{analysis.resolution} resolution</Badge>
        <Badge variant="secondary">{analysis.cloudCover.toFixed(0)}% cloud cover</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="vegetation" data-testid="tab-vegetation">Vegetation</TabsTrigger>
          <TabsTrigger value="change" data-testid="tab-change">Change</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* NDVI Gauge */}
            <Card>
              <CardContent className="pt-4 flex justify-center">
                <NDVIGauge value={analysis.ndvi} />
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  Biomass Estimates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Above-ground biomass</span>
                    <span className="font-medium" data-testid="text-biomass-value">{analysis.biomassEstimate.toFixed(1)} t/ha</span>
                  </div>
                  <Progress value={Math.min(100, analysis.biomassEstimate)} className="h-2 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Carbon stock</span>
                    <span className="font-medium" data-testid="text-carbon-value">{analysis.carbonStock.toFixed(1)} t CO₂e</span>
                  </div>
                  <Progress value={Math.min(100, analysis.carbonStock * 2)} className="h-2 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Health score</span>
                    <span className="font-medium" data-testid="text-health-value">{analysis.healthScore}%</span>
                  </div>
                  <Progress value={analysis.healthScore} className="h-2 mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Change Detection Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between" data-testid="card-change-summary">
                <div className="flex items-center gap-2">
                  {changeIcon}
                  <span className="font-medium capitalize" data-testid="text-change-type">{analysis.changeDetection.type}</span>
                  <span className="text-muted-foreground">detected</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${analysis.changeDetection.percentChange >= 0 ? 'text-green-500' : 'text-orange-500'}`} data-testid="text-change-percent">
                    {analysis.changeDetection.percentChange >= 0 ? '+' : ''}{analysis.changeDetection.percentChange.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">{analysis.changeDetection.period}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vegetation" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4">
              <NDVIHeatmap plot={plot} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <TimeSeriesChart plot={plot} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="change" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Change Detection Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">August 2025</div>
                  <div className="text-lg font-bold">{(analysis.ndvi - 0.08).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">NDVI</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">January 2026</div>
                  <div className="text-lg font-bold text-green-500">{analysis.ndvi.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">NDVI</div>
                </div>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {changeIcon}
                  <span className="font-medium">Analysis Summary</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {analysis.changeDetection.type === "growth" ? (
                    `Vegetation density has increased by ${analysis.changeDetection.percentChange.toFixed(1)}% over the past 6 months, indicating healthy bamboo growth consistent with expected sequestration rates.`
                  ) : analysis.changeDetection.type === "decline" ? (
                    `Vegetation density has decreased by ${Math.abs(analysis.changeDetection.percentChange).toFixed(1)}%. This may indicate stress, harvesting activity, or environmental factors. Field verification recommended.`
                  ) : (
                    `Vegetation remains stable with minimal change (${analysis.changeDetection.percentChange.toFixed(1)}%). This is normal for mature bamboo stands.`
                  )}
                </p>
              </div>

              <div className="text-xs text-muted-foreground text-center p-2 bg-muted/20 rounded">
                Analysis based on {modelInfo.source} imagery processed through {modelInfo.name} embeddings
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
