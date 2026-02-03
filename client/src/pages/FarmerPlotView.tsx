import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Sun,
  Leaf,
  TrendingUp,
  Calendar,
  MapPin,
  BarChart3,
  Activity,
  Scan,
  Layers,
  Camera,
  CheckCircle,
  Loader2,
  Satellite,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Plot, Steward } from "@shared/schema";
import CesiumPlotTerrain from "@/components/CesiumPlotTerrain";
import { AgentChat } from "@/components/AgentChat";
import { SatelliteAnalysis } from "@/components/SatelliteAnalysis";

const CESIUM_ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN || "";

function SensorCard({ icon: Icon, label, value, unit, color, subtext }: {
  icon: any;
  label: string;
  value: string;
  unit: string;
  color: string;
  subtext?: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">
              {value}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
            </p>
            {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GrowthStats({ year, plot }: { year: number; plot: Plot }) {
  const yearsGrown = Math.max(0, year - 2024);
  const maxHeight = 25;
  const currentHeight = Math.min(maxHeight, 0.5 + yearsGrown * 4.9);
  const heightProgress = (currentHeight / maxHeight) * 100;
  
  const clumpsPerHa = 150;
  const totalClumps = Math.round(plot.areaHectares * clumpsPerHa);
  
  const carbonRate = 8.75;
  const carbonPerYear = plot.areaHectares * carbonRate * (yearsGrown / 10);
  const maxCarbon = plot.areaHectares * 234.46;
  const currentCarbon = Math.min(maxCarbon, carbonPerYear * yearsGrown);
  
  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" />
              Giant Bamboo
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            {plot.areaHectares} ha • {totalClumps} clumps
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Height</p>
              <p className="text-lg font-bold">{currentHeight.toFixed(1)}m</p>
              <Progress value={heightProgress} className="h-1 mt-1" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Clumps/ha</p>
              <p className="text-lg font-bold">{clumpsPerHa}</p>
              <Progress value={100} className="h-1 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Carbon/yr</p>
            <p className="text-lg font-bold">{carbonPerYear.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">t CO2e/ha</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Carbon Stock</p>
            <p className="text-lg font-bold">{currentCarbon.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">t C/ha</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function IncomeProjection({ year, plot }: { year: number; plot: Plot }) {
  const yearsGrown = Math.max(0, year - 2024);
  const carbonPrice = 30;
  const polePrice = 12;
  const polesPerClump = 10;
  const clumpsPerHa = 150;
  
  const carbonRate = 8.75;
  const annualCarbonCredits = plot.areaHectares * carbonRate;
  const carbonIncome = annualCarbonCredits * carbonPrice * yearsGrown;
  
  const harvestableYear = yearsGrown >= 3;
  const totalPoles = harvestableYear ? plot.areaHectares * clumpsPerHa * polesPerClump : 0;
  const poleIncome = totalPoles * polePrice;
  
  const totalIncome = carbonIncome + poleIncome;
  
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          Projected Value
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Carbon Credits</span>
          <span className="font-medium text-sm">${carbonIncome.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Pole Harvest</span>
          <span className="font-medium text-sm">${poleIncome.toLocaleString()}</span>
        </div>
        <div className="border-t pt-2 flex justify-between items-center">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-bold text-emerald-500">${totalIncome.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FarmerPlotView() {
  const [, params] = useRoute("/plot/:id");
  const plotId = params?.id;
  
  const [year, setYear] = useState(2026);
  const [showLidar, setShowLidar] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [activeTab, setActiveTab] = useState("3d");
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const { data: plot, isLoading: plotLoading } = useQuery<Plot>({
    queryKey: ["/api/plots", plotId],
    enabled: !!plotId,
  });

  const { data: stewards } = useQuery<Steward[]>({
    queryKey: ["/api/stewards"],
  });

  const steward = stewards?.find(s => s.id === plot?.stewardId);

  const sensorData = {
    temperature: 28 + Math.sin(Date.now() / 10000) * 3,
    soilMoisture: 45 + Math.cos(Date.now() / 15000) * 10,
    humidity: 78 + Math.sin(Date.now() / 12000) * 8,
    lux: 45000 + Math.cos(Date.now() / 8000) * 15000,
  };

  if (plotLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading plot data...</p>
        </div>
      </div>
    );
  }

  if (!plot) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Plot not found</p>
            <Link href="/">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b px-4 py-3 flex items-center justify-between bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold" data-testid="text-plot-name">{plot.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{steward?.name || "Unassigned"} • {plot.areaHectares} ha</span>
            </div>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={
            plot.status === "verified" ? "border-emerald-500 text-emerald-500" :
            plot.status === "pending" ? "border-amber-500 text-amber-500" :
            "border-orange-500 text-orange-500"
          }
        >
          {plot.status}
        </Badge>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <CesiumPlotTerrain 
            plot={plot} 
            cesiumToken={CESIUM_ION_TOKEN} 
            year={year}
            showLidar={showLidar}
          />
          
          <div className="absolute top-4 left-4 space-y-2 pointer-events-none">
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardContent className="p-3 flex items-center gap-3">
                <Thermometer className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Temp</p>
                  <p className="font-medium">{sensorData.temperature.toFixed(1)}°C</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="absolute bottom-4 right-4 pointer-events-none">
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardContent className="p-3 flex items-center gap-3">
                <Droplets className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Soil</p>
                  <p className="font-medium">{sensorData.soilMoisture.toFixed(0)}%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-[380px] border-l flex flex-col bg-card/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="border-b px-3 shrink-0">
              <TabsList className="h-10 w-full">
                <TabsTrigger value="3d" className="flex-1 gap-1.5 text-xs" data-testid="tab-3d-view">
                  <BarChart3 className="h-3.5 w-3.5" />
                  3D View
                </TabsTrigger>
                <TabsTrigger value="satellite" className="flex-1 gap-1.5 text-xs" data-testid="tab-satellite">
                  <Satellite className="h-3.5 w-3.5" />
                  Satellite
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex-1 gap-1.5 text-xs" data-testid="tab-statistics">
                  <Activity className="h-3.5 w-3.5" />
                  Stats
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="3d" className="mt-0 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Year: {year}
                    </p>
                  </div>
                  <Slider
                    value={[year]}
                    onValueChange={([v]) => setYear(v)}
                    min={2024}
                    max={2035}
                    step={1}
                    className="w-full"
                    data-testid="slider-year"
                  />
                </div>

                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Scan className="h-4 w-4 text-cyan-500" />
                      LiDAR Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="lidar-toggle" className="text-xs">Point Cloud</Label>
                      </div>
                      <Switch
                        id="lidar-toggle"
                        checked={showLidar}
                        onCheckedChange={setShowLidar}
                        data-testid="switch-lidar"
                      />
                    </div>
                    
                    {showLidar && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Low</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-lime-500" />
                          <span>Med</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span>High</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Max</span>
                        </div>
                      </div>
                    )}

                    <Button
                      variant={scanComplete ? "outline" : "default"}
                      size="sm"
                      className="w-full gap-2"
                      disabled={isScanning}
                      onClick={() => {
                        setIsScanning(true);
                        setScanComplete(false);
                        scanTimeoutRef.current = setTimeout(() => {
                          setIsScanning(false);
                          setScanComplete(true);
                          setShowLidar(true);
                        }, 3000);
                      }}
                      data-testid="button-lidar-scan"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Scanning...
                        </>
                      ) : scanComplete ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Complete
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4" />
                          Capture LiDAR
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <GrowthStats year={year} plot={plot} />
                <IncomeProjection year={year} plot={plot} />
              </div>

              <div className="border-t shrink-0">
                <AgentChat plot={plot} steward={steward} />
              </div>
            </TabsContent>

            <TabsContent value="satellite" className="mt-0 flex-1 overflow-y-auto">
              <SatelliteAnalysis plot={plot} />
            </TabsContent>

            <TabsContent value="stats" className="mt-0 flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <SensorCard
                  icon={Thermometer}
                  label="Temperature"
                  value={sensorData.temperature.toFixed(1)}
                  unit="°C"
                  color="bg-red-500/10 text-red-500"
                />
                <SensorCard
                  icon={Droplets}
                  label="Moisture"
                  value={sensorData.soilMoisture.toFixed(0)}
                  unit="%"
                  color="bg-blue-500/10 text-blue-500"
                />
                <SensorCard
                  icon={Droplets}
                  label="Humidity"
                  value={sensorData.humidity.toFixed(0)}
                  unit="%"
                  color="bg-cyan-500/10 text-cyan-500"
                />
                <SensorCard
                  icon={Sun}
                  label="Light"
                  value={(sensorData.lux / 1000).toFixed(0)}
                  unit="k lux"
                  color="bg-yellow-500/10 text-yellow-500"
                />
              </div>

              <GrowthStats year={year} plot={plot} />
              <IncomeProjection year={year} plot={plot} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
