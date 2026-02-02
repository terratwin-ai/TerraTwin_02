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
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Plot, Steward } from "@shared/schema";
import CesiumPlotTerrain from "@/components/CesiumPlotTerrain";
import { AgentChat } from "@/components/AgentChat";

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
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" />
              Giant Bamboo (Dendrocalamus asper)
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            {plot.areaHectares} hectare with {totalClumps} clumps spaced 6m apart
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Growth Timeline</span>
              <span className="font-medium">{year}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>2024</span>
              <span>2027</span>
              <span>2029</span>
              <span>2031</span>
              <span>2033</span>
              <span>2035</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Plant Height</p>
              <p className="text-2xl font-bold">{currentHeight.toFixed(1)}m</p>
              <Progress value={heightProgress} className="h-1.5 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Max: {maxHeight}m by year 3</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Bamboo Clumps</p>
              <p className="text-2xl font-bold">{totalClumps} clumps/ha</p>
              <Progress value={100} className="h-1.5 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">6m spacing between clumps</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Carbon Sequestration</p>
            <p className="text-xl font-bold">{carbonPerYear.toFixed(1)} t CO2e/ha/yr</p>
            <p className="text-xs text-muted-foreground">(Mindanao Research Rate)</p>
            <p className="text-xs text-muted-foreground mt-2">Full rate: {carbonRate} t CO2e/ha/yr</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Carbon Stock</p>
            <p className="text-xl font-bold">{currentCarbon.toFixed(1)} t C/ha</p>
            <p className="text-xs text-muted-foreground">(~{(currentCarbon * 0.01).toFixed(1)} t CO2e/ha)</p>
            <p className="text-xs text-muted-foreground mt-2">Max: {maxCarbon.toFixed(2)} t C/ha at maturity</p>
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
  
  const carbonRate = 8.75;
  const annualCarbon = plot.areaHectares * carbonRate * (yearsGrown / 10);
  const carbonRevenue = annualCarbon * carbonPrice;
  
  const polesPerClump = yearsGrown >= 5 ? 100 : 0;
  const totalPoles = (plot.clumpCount || 150) * polesPerClump * 0.1;
  const harvestRevenue = totalPoles * polePrice;
  
  const totalRevenue = carbonRevenue + harvestRevenue;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Projected Economic Value
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold text-primary">
            ${totalRevenue.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">per hectare</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Carbon Revenue</p>
            <p className="text-xl font-bold text-emerald-500">${carbonRevenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">{annualCarbon.toFixed(1)} credits at ${carbonPrice}/tonne</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Harvest Revenue</p>
            <p className="text-xl font-bold text-amber-500">${harvestRevenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">
              {totalPoles.toFixed(0)} poles at ${polePrice}/pole
            </p>
            {yearsGrown < 5 && (
              <p className="text-xs text-amber-500 mt-1">Harvesting begins at year 5</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FarmerPlotView() {
  const [, params] = useRoute("/plot/:id");
  const plotId = params?.id;
  const [year, setYear] = useState(2026);
  const [activeTab, setActiveTab] = useState("3d");
  const [showLidar, setShowLidar] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
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

  const { data: steward } = useQuery<Steward>({
    queryKey: ["/api/stewards", plot?.stewardId],
    enabled: !!plot?.stewardId,
  });

  if (plotLoading || !plot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading plot data...</div>
      </div>
    );
  }

  const sensorData = {
    temperature: 29.5 + Math.random() * 2,
    soilMoisture: 41 + Math.random() * 10,
    humidity: 75 + Math.random() * 10,
    lux: 45000 + Math.random() * 10000,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
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
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="border-b px-4">
          <TabsList className="h-10">
            <TabsTrigger value="3d" className="gap-2" data-testid="tab-3d-view">
              <BarChart3 className="h-3.5 w-3.5" />
              3D View
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2" data-testid="tab-statistics">
              <Activity className="h-3.5 w-3.5" />
              Statistics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="3d" className="mt-0 flex-1">
          <div className="grid lg:grid-cols-3 gap-0" style={{ minHeight: "calc(100vh - 120px)" }}>
            <div className="lg:col-span-2 relative" style={{ minHeight: "600px" }}>
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

            <div className="border-l flex flex-col max-h-[calc(100vh-120px)]">
              <div className="overflow-y-auto p-4 space-y-4 flex-1">
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
                    <CardTitle className="text-base flex items-center gap-2">
                      <Scan className="h-4 w-4 text-cyan-500" />
                      LiDAR Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="lidar-toggle" className="text-sm">Show Point Cloud</Label>
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
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>Low</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-lime-500" />
                          <span>Med</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span>High</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span>Max</span>
                        </div>
                      </div>
                    )}

                    <Button
                      variant={scanComplete ? "outline" : "default"}
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
                          Scan Complete
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4" />
                          Capture LiDAR Scan
                        </>
                      )}
                    </Button>
                    
                    {scanComplete && (
                      <p className="text-xs text-muted-foreground text-center">
                        Point cloud captured with 625 points. Ready for verification.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <GrowthStats year={year} plot={plot} />
                <IncomeProjection year={year} plot={plot} />
              </div>

              <div className="border-t p-3">
                <div className="flex gap-2">
                  <AgentChat plot={plot} steward={steward} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="mt-0 p-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SensorCard
              icon={Thermometer}
              label="Temperature"
              value={sensorData.temperature.toFixed(1)}
              unit="°C"
              color="bg-red-500/10 text-red-500"
              subtext="Optimal: 25-32°C"
            />
            <SensorCard
              icon={Droplets}
              label="Soil Moisture"
              value={sensorData.soilMoisture.toFixed(0)}
              unit="%"
              color="bg-blue-500/10 text-blue-500"
              subtext="Optimal: 40-60%"
            />
            <SensorCard
              icon={Droplets}
              label="Humidity"
              value={sensorData.humidity.toFixed(0)}
              unit="%"
              color="bg-cyan-500/10 text-cyan-500"
              subtext="Optimal: 70-90%"
            />
            <SensorCard
              icon={Sun}
              label="Light Intensity"
              value={(sensorData.lux / 1000).toFixed(0)}
              unit="k lux"
              color="bg-yellow-500/10 text-yellow-500"
              subtext="Full sun exposure"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <GrowthStats year={year} plot={plot} />
            <IncomeProjection year={year} plot={plot} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
