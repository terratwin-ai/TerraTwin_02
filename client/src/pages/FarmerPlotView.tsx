import { useState, useRef, Suspense, useEffect, Component, ReactNode } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
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
  AlertTriangle,
} from "lucide-react";
import type { Plot, Steward } from "@shared/schema";

class WebGLErrorBoundary extends Component<{children: ReactNode; fallback: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode; fallback: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function TerrainMesh({ year, areaHectares }: { year: number; areaHectares: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const size = Math.sqrt(areaHectares) * 2;
  
  const geometry = new THREE.PlaneGeometry(size, size, 64, 64);
  const positions = geometry.attributes.position.array as Float32Array;
  
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    positions[i + 2] = 
      Math.sin(x * 0.5) * 0.15 + 
      Math.cos(y * 0.5) * 0.15 + 
      Math.sin(x * 0.3 + y * 0.3) * 0.1;
  }
  geometry.computeVertexNormals();

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        color="#4a7c59" 
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function BambooClump({ position, height, year }: { position: [number, number, number]; height: number; year: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const growthFactor = Math.min(1, (year - 2024) / 5);
  const actualHeight = 0.1 + height * growthFactor;
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime + position[0]) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {[...Array(5)].map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 0.05;
        const poleHeight = actualHeight * (0.8 + Math.random() * 0.4);
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * radius, poleHeight / 2, Math.sin(angle) * radius]}
            castShadow
          >
            <cylinderGeometry args={[0.01, 0.015, poleHeight, 8]} />
            <meshStandardMaterial color="#2d5a27" roughness={0.6} />
          </mesh>
        );
      })}
      <mesh position={[0, actualHeight * 0.9, 0]}>
        <sphereGeometry args={[actualHeight * 0.3, 8, 8]} />
        <meshStandardMaterial color="#3d7a37" roughness={0.8} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function SensorMarker({ position, type, value }: { position: [number, number, number]; type: string; value: number }) {
  const color = type === "temp" ? "#ef4444" : type === "soil" ? "#3b82f6" : "#eab308";
  
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color="#666" metalness={0.8} />
      </mesh>
    </group>
  );
}

function Scene3D({ plot, year }: { plot: Plot; year: number }) {
  const clumpCount = plot.clumpCount || 150;
  const size = Math.sqrt(plot.areaHectares) * 2;
  
  const clumpPositions: [number, number, number][] = [];
  for (let i = 0; i < Math.min(clumpCount, 50); i++) {
    const x = (Math.random() - 0.5) * size * 0.9;
    const z = (Math.random() - 0.5) * size * 0.9;
    clumpPositions.push([x, 0, z]);
  }

  const sensorPositions: { pos: [number, number, number]; type: string; value: number }[] = [
    { pos: [-size * 0.3, 0, -size * 0.3], type: "temp", value: 29.5 },
    { pos: [size * 0.3, 0, size * 0.3], type: "soil", value: 41 },
  ];

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <TerrainMesh year={year} areaHectares={plot.areaHectares} />
      {clumpPositions.map((pos, i) => (
        <BambooClump 
          key={i} 
          position={pos} 
          height={0.3 + Math.random() * 0.2}
          year={year}
        />
      ))}
      {sensorPositions.map((sensor, i) => (
        <SensorMarker key={i} position={sensor.pos} type={sensor.type} value={sensor.value} />
      ))}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={10}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
      />
      <Environment preset="forest" />
    </>
  );
}

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

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

export default function FarmerPlotView() {
  const [, params] = useRoute("/plot/:id");
  const plotId = params?.id;
  const [year, setYear] = useState(2024);
  const [activeTab, setActiveTab] = useState("3d");
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
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
          <div className="grid lg:grid-cols-3 gap-0 min-h-[calc(100vh-120px)]">
            <div className="lg:col-span-2 relative bg-gradient-to-b from-sky-100 to-sky-50 dark:from-sky-950 dark:to-background min-h-[400px] lg:min-h-0">
              {webglSupported === false ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8" data-testid="webgl-fallback">
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">3D View Unavailable</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Your browser doesn't support WebGL. View the Statistics tab for full plot data.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-4 w-full max-w-sm">
                    <Card className="border-border/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Temp</p>
                          <p className="font-medium">{sensorData.temperature.toFixed(1)}°C</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
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
              ) : webglSupported === true ? (
                <WebGLErrorBoundary fallback={
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8" data-testid="webgl-fallback">
                    <div className="flex items-center gap-2 text-amber-500">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">3D Rendering Error</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      View the Statistics tab for plot data.
                    </p>
                  </div>
                }>
                  <Canvas shadows camera={{ position: [3, 3, 3], fov: 50 }}>
                    <Suspense fallback={null}>
                      <Scene3D plot={plot} year={year} />
                    </Suspense>
                  </Canvas>
                </WebGLErrorBoundary>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Leaf className="h-8 w-8 text-primary animate-pulse" />
                </div>
              )}
              
              <div className="absolute top-4 left-4 space-y-2">
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

              <div className="absolute bottom-4 right-4">
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

            <div className="border-l overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-120px)]">
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

              <GrowthStats year={year} plot={plot} />
              <IncomeProjection year={year} plot={plot} />
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
