import { useEffect, useRef, useState } from "react";
import type { Plot } from "@shared/schema";
import { Leaf, AlertTriangle } from "lucide-react";

declare global {
  interface Window {
    Cesium: typeof import("cesium");
    CESIUM_BASE_URL: string;
  }
}

interface CesiumPlotTerrainProps {
  plot: Plot;
  cesiumToken: string;
  year: number;
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

export default function CesiumPlotTerrain({ plot, cesiumToken, year }: CesiumPlotTerrainProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<InstanceType<typeof window.Cesium.Viewer> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webglSupported] = useState(() => checkWebGLSupport());

  useEffect(() => {
    if (!webglSupported || !containerRef.current || !cesiumToken) return;

    let viewer: InstanceType<typeof window.Cesium.Viewer> | null = null;
    let mounted = true;

    const initCesium = async () => {
      try {
        if (!window.Cesium) {
          await loadCesiumScript();
        }

        if (!mounted || !containerRef.current) return;

        const Cesium = window.Cesium;
        Cesium.Ion.defaultAccessToken = cesiumToken;

        viewer = new Cesium.Viewer(containerRef.current, {
          terrain: Cesium.Terrain.fromWorldTerrain(),
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          vrButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          navigationInstructionsInitiallyVisible: false,
          creditContainer: document.createElement("div"),
          skyBox: false,
          skyAtmosphere: false,
          contextOptions: {
            webgl: {
              alpha: true,
            },
          },
        });

        viewerRef.current = viewer;

        viewer.scene.globe.enableLighting = false;
        viewer.scene.fog.enabled = false;

        const hectareMeters = 100;
        const degreesPerMeter = 1 / 111320;
        const halfSizeDeg = (hectareMeters / 2) * degreesPerMeter;
        
        const west = plot.longitude - halfSizeDeg;
        const east = plot.longitude + halfSizeDeg;
        const south = plot.latitude - halfSizeDeg;
        const north = plot.latitude + halfSizeDeg;

        const controller = viewer.scene.screenSpaceCameraController;
        controller.enableRotate = true;
        controller.enableZoom = true;
        controller.enableTilt = true;
        controller.enableTranslate = true;
        controller.minimumZoomDistance = 50;
        controller.maximumZoomDistance = 2000;

        viewer.entities.add({
          rectangle: {
            coordinates: Cesium.Rectangle.fromDegrees(west, south, east, north),
            material: Cesium.Color.fromCssColorString("#22c55e").withAlpha(0.3),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString("#fbbf24"),
            outlineWidth: 3,
            height: 0,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });

        viewer.camera.flyTo({
          destination: Cesium.Rectangle.fromDegrees(
            west - halfSizeDeg * 2,
            south - halfSizeDeg * 2,
            east + halfSizeDeg * 2,
            north + halfSizeDeg * 2
          ),
          orientation: {
            heading: Cesium.Math.toRadians(-45),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
          duration: 0,
        });

        addBambooPlants(viewer, plot, year);

        setIsLoading(false);
      } catch (err) {
        console.error("Cesium initialization error:", err);
        if (mounted) {
          setError("Failed to load terrain");
          setIsLoading(false);
        }
      }
    };

    initCesium();

    return () => {
      mounted = false;
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, [plot.id, cesiumToken, webglSupported]);

  useEffect(() => {
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      const viewer = viewerRef.current;
      viewer.entities.removeAll();
      addBambooPlants(viewer, plot, year);
    }
  }, [year, plot]);

  if (!webglSupported || !cesiumToken) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 bg-gradient-to-b from-emerald-900/20 to-background" data-testid="webgl-fallback">
        <div className="flex items-center gap-2 text-amber-500">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">
            {!cesiumToken ? "Terrain Not Configured" : "3D Terrain Unavailable"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {!cesiumToken 
            ? "Cesium terrain service is not configured. View the Statistics tab for plot data."
            : "Your browser doesn't support WebGL. View the Statistics tab for full plot data."
          }
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 bg-gradient-to-b from-emerald-900/20 to-background">
        <div className="flex items-center gap-2 text-amber-500">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative" 
      style={{ 
        width: "100%", 
        height: "100%", 
        minHeight: "600px",
        background: "#f5f5f5"
      }}
    >
      <div 
        ref={containerRef} 
        style={{ 
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%"
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#f5f5f5" }}>
          <div className="flex flex-col items-center gap-3">
            <Leaf className="h-8 w-8 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Loading terrain...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function loadCesiumScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Cesium) {
      resolve();
      return;
    }

    window.CESIUM_BASE_URL = "https://cesium.com/downloads/cesiumjs/releases/1.104/Build/Cesium/";

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${window.CESIUM_BASE_URL}Widgets/widgets.css`;
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = `${window.CESIUM_BASE_URL}Cesium.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cesium"));
    document.head.appendChild(script);
  });
}

function addBambooPlants(
  viewer: InstanceType<typeof window.Cesium.Viewer>,
  plot: Plot,
  year: number
) {
  const Cesium = window.Cesium;
  
  const progress = Math.max(0, Math.min(1, (year - 2024) / 11));
  
  const maxHeight = 25;
  const minHeight = 0.5;
  const growthRate = 15;
  const midpoint = 0.3;
  const baseHeight = minHeight + (maxHeight - minHeight) / 
    (1 + Math.exp(-growthRate * (progress - midpoint)));
  
  const minPoles = 5;
  const maxPoles = 100;
  const poleCountPerClump = Math.floor(minPoles + (maxPoles - minPoles) / 
    (1 + Math.exp(-15 * (progress - 0.3))));
  
  const clumpsPerHa = 150;
  const totalClumps = Math.floor(plot.areaHectares * clumpsPerHa);
  const visibleClumps = Math.min(totalClumps, 30);
  
  const hectareMeters = 100;
  const halfSize = hectareMeters / 2;

  for (let i = 0; i < visibleClumps; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * halfSize * 0.85;
    
    const offsetLat = (radius * Math.cos(angle)) / 111320;
    const offsetLng = (radius * Math.sin(angle)) / (111320 * Math.cos(plot.latitude * Math.PI / 180));
    
    const clumpLat = plot.latitude + offsetLat;
    const clumpLng = plot.longitude + offsetLng;
    
    const polesInThisClump = Math.min(Math.floor(poleCountPerClump * (0.5 + Math.random() * 0.5)), 12);
    
    for (let p = 0; p < polesInThisClump; p++) {
      const poleAngle = (p / polesInThisClump) * Math.PI * 2 + Math.random() * 0.3;
      const poleRadius = 0.5 + Math.random() * 1.5;
      
      const poleOffsetLat = (poleRadius * Math.cos(poleAngle)) / 111320;
      const poleOffsetLng = (poleRadius * Math.sin(poleAngle)) / (111320 * Math.cos(clumpLat * Math.PI / 180));
      
      const poleLat = clumpLat + poleOffsetLat;
      const poleLng = clumpLng + poleOffsetLng;
      
      const heightVariation = 0.7 + Math.random() * 0.6;
      const poleHeight = baseHeight * heightVariation;
      
      const poleRadius_m = 0.08 + progress * 0.12;
      
      const greenShade = Math.random();
      const poleColor = greenShade < 0.3 
        ? Cesium.Color.fromCssColorString("#4ade80")
        : greenShade < 0.7 
        ? Cesium.Color.fromCssColorString("#22c55e")
        : Cesium.Color.fromCssColorString("#16a34a");

      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(poleLng, poleLat, poleHeight / 2),
        cylinder: {
          length: poleHeight,
          topRadius: poleRadius_m * 0.7,
          bottomRadius: poleRadius_m,
          material: poleColor,
          outline: false,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        },
      });

    }
  }

  const cornerOffset = halfSize / 111320;
  const corners = [
    plot.longitude - cornerOffset, plot.latitude - cornerOffset,
    plot.longitude + cornerOffset, plot.latitude - cornerOffset,
    plot.longitude + cornerOffset, plot.latitude + cornerOffset,
    plot.longitude - cornerOffset, plot.latitude + cornerOffset,
    plot.longitude - cornerOffset, plot.latitude - cornerOffset,
  ];

  viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray(corners),
      width: 4,
      material: Cesium.Color.fromCssColorString("#fbbf24"),
      clampToGround: true,
    },
  });
}
