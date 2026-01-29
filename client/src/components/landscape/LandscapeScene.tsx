import { Component, Suspense, useMemo, useState, useEffect, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Float } from "@react-three/drei";
import type { Plot } from "@shared/schema";
import * as THREE from "three";
import { MapPin, TreePine, Leaf, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BambooPlotProps {
  plot: Plot;
  isSelected: boolean;
  onClick: () => void;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function BambooClump({ position, scale = 1, seed = 0 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const stalks = useMemo(() => {
    const stalkCount = 5 + Math.floor(seededRandom(seed) * 4);
    return Array.from({ length: stalkCount }).map((_, i) => {
      const angle = (i / stalkCount) * Math.PI * 2;
      const radius = 0.15 * scale;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = (0.8 + seededRandom(seed + i + 1) * 0.6) * scale;
      return { x, z, height };
    });
  }, [seed, scale]);
  
  return (
    <group position={position}>
      {stalks.map((stalk, i) => (
        <group key={i} position={[stalk.x, 0, stalk.z]}>
          <mesh position={[0, stalk.height / 2, 0]} castShadow>
            <cylinderGeometry args={[0.02 * scale, 0.03 * scale, stalk.height, 8]} />
            <meshStandardMaterial color="#4a7c3f" roughness={0.7} />
          </mesh>
          <mesh position={[0, stalk.height * 0.9, 0]}>
            <sphereGeometry args={[0.08 * scale, 8, 8]} />
            <meshStandardMaterial color="#5a9c4f" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PlotMarker({ plot, isSelected, onClick }: BambooPlotProps) {
  const normalizedLat = ((plot.latitude - 7.5) / 0.5) * 10 - 5;
  const normalizedLng = ((plot.longitude - 125.5) / 0.5) * 10 - 5;
  const position: [number, number, number] = [normalizedLng, 0, normalizedLat];
  
  const statusColor = useMemo(() => {
    switch (plot.status) {
      case "verified": return "#22c55e";
      case "pending": return "#f59e0b";
      case "submitted": return "#3b82f6";
      case "under_review": return "#8b5cf6";
      default: return "#6b7280";
    }
  }, [plot.status]);
  
  const plotSeed = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < plot.id.length; i++) {
      hash = ((hash << 5) - hash) + plot.id.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }, [plot.id]);

  const clumpData = useMemo(() => {
    const data: { position: [number, number, number]; scale: number }[] = [];
    const count = Math.min(plot.clumpCount || 5, 12);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.3 + seededRandom(plotSeed + i) * 0.4;
      const scale = 0.6 + seededRandom(plotSeed + i + 100) * 0.3;
      data.push({
        position: [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ],
        scale
      });
    }
    return data;
  }, [plot.clumpCount, plotSeed]);

  return (
    <Float speed={isSelected ? 2 : 0} rotationIntensity={0} floatIntensity={isSelected ? 0.2 : 0}>
      <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.8, 32]} />
          <meshStandardMaterial 
            color={isSelected ? "#22c55e" : "#8b7355"} 
            opacity={0.6} 
            transparent 
          />
        </mesh>
        
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.8, 32]} />
          <meshStandardMaterial color={statusColor} />
        </mesh>
        
        {clumpData.map((clump, i) => (
          <BambooClump key={i} position={clump.position} scale={clump.scale} seed={plotSeed + i * 1000} />
        ))}
        
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial 
            color={statusColor} 
            emissive={statusColor}
            emissiveIntensity={isSelected ? 0.5 : 0.2}
          />
        </mesh>
        
        <lineSegments position={[0, 0.75, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([0, -0.7, 0, 0, 0.7, 0])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={statusColor} linewidth={2} />
        </lineSegments>
      </group>
    </Float>
  );
}

function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(20, 20, 64, 64);
    const positions = geo.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      positions[i + 2] = 
        Math.sin(x * 0.5) * 0.1 + 
        Math.cos(y * 0.3) * 0.15 +
        Math.sin(x * 0.2 + y * 0.2) * 0.1;
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
      <primitive object={geometry} />
      <meshStandardMaterial 
        color="#6b8c42" 
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}

function SceneContent({ 
  plots, 
  selectedPlotId, 
  onPlotSelect 
}: { 
  plots: Plot[]; 
  selectedPlotId: string | null;
  onPlotSelect: (id: string) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 15, 10]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 8, -5]} intensity={0.5} color="#fffaf0" />
      
      <Terrain />
      
      <Grid 
        args={[20, 20]} 
        position={[0, 0.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#ffffff"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#88aa66"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />
      
      {plots.map((plot) => (
        <PlotMarker
          key={plot.id}
          plot={plot}
          isSelected={selectedPlotId === plot.id}
          onClick={() => onPlotSelect(plot.id)}
        />
      ))}
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
      
      <Environment preset="forest" />
      
      <fog attach="fog" args={["#e8f4e5", 15, 35]} />
    </>
  );
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch (e) {
    return false;
  }
}

function FallbackMapView({ 
  plots, 
  selectedPlotId, 
  onPlotSelect 
}: { 
  plots: Plot[]; 
  selectedPlotId: string | null;
  onPlotSelect: (id: string) => void;
}) {
  const statusColors: Record<string, string> = {
    verified: "bg-green-500",
    pending: "bg-amber-500",
    submitted: "bg-blue-500",
    under_review: "bg-purple-500",
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-chart-1/10 via-chart-2/5 to-primary/10 p-6 overflow-auto" data-testid="fallback-map">
      <div className="mb-6 p-4 bg-card/80 backdrop-blur-sm rounded-lg border flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <div>
          <p className="font-medium">2D Map View</p>
          <p className="text-sm text-muted-foreground">3D visualization requires WebGL support</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {plots.map((plot) => (
          <Card 
            key={plot.id}
            className={`cursor-pointer transition-all hover-elevate ${
              selectedPlotId === plot.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onPlotSelect(plot.id)}
            data-testid={`fallback-plot-${plot.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TreePine className="h-5 w-5 text-primary" />
                </div>
                <span className={`w-3 h-3 rounded-full ${statusColors[plot.status] || "bg-gray-500"}`} />
              </div>
              <h4 className="font-medium text-sm mb-1 line-clamp-1">{plot.name}</h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{plot.latitude.toFixed(2)}°N</span>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t text-xs">
                <div className="flex items-center gap-1">
                  <TreePine className="h-3 w-3 text-chart-1" />
                  <span>{plot.clumpCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Leaf className="h-3 w-3 text-chart-2" />
                  <span>{plot.carbonTons?.toFixed(1) || 0}t</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface LandscapeSceneProps {
  plots: Plot[];
  selectedPlotId: string | null;
  onPlotSelect: (id: string) => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("WebGL Error:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function LandscapeScene({ plots, selectedPlotId, onPlotSelect }: LandscapeSceneProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setWebGLSupported(checkWebGLSupport());
  }, []);

  if (webGLSupported === null) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Leaf className="h-8 w-8 mx-auto text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground mt-2">Initializing landscape...</p>
        </div>
      </div>
    );
  }

  if (!webGLSupported) {
    return (
      <FallbackMapView 
        plots={plots} 
        selectedPlotId={selectedPlotId} 
        onPlotSelect={onPlotSelect} 
      />
    );
  }

  return (
    <div className="w-full h-full" data-testid="landscape-scene">
      <WebGLErrorBoundary 
        fallback={
          <FallbackMapView 
            plots={plots} 
            selectedPlotId={selectedPlotId} 
            onPlotSelect={onPlotSelect} 
          />
        }
      >
        <Canvas
          shadows
          camera={{ position: [8, 10, 8], fov: 45 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            if (!gl.getContext) {
              throw new Error("WebGL context failed");
            }
          }}
        >
          <Suspense fallback={null}>
            <SceneContent 
              plots={plots} 
              selectedPlotId={selectedPlotId}
              onPlotSelect={onPlotSelect}
            />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
