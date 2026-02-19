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
  showLidar?: boolean;
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

export default function CesiumPlotTerrain({ plot, cesiumToken, year, showLidar = false }: CesiumPlotTerrainProps) {
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

        const plotSizeMeters = Math.sqrt(plot.areaHectares * 10000);
        const cameraAltitude = Math.max(200, plotSizeMeters * 2.5);

        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            plot.longitude,
            plot.latitude,
            cameraAltitude
          ),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
          duration: 1.5,
        });

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
      const Cesium = window.Cesium;
      viewer.entities.removeAll();
      
      // Re-add plot boundary polygon that drapes over terrain
      const hectareMeters = 100;
      const halfSize = hectareMeters / 2;
      const halfSizeDeg = halfSize / 111320;
      const west = plot.longitude - halfSizeDeg;
      const south = plot.latitude - halfSizeDeg;
      const east = plot.longitude + halfSizeDeg;
      const north = plot.latitude + halfSizeDeg;
      
      // Create polygon positions for the boundary corners
      const boundaryPositions = Cesium.Cartesian3.fromDegreesArray([
        west, south,
        east, south,
        east, north,
        west, north,
        west, south, // close the loop for polyline
      ]);
      
      // Add filled polygon that drapes over terrain
      viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(
            Cesium.Cartesian3.fromDegreesArray([
              west, south,
              east, south,
              east, north,
              west, north,
            ])
          ),
          material: Cesium.Color.fromCssColorString("#22c55e").withAlpha(0.25),
          classificationType: Cesium.ClassificationType.TERRAIN,
        },
      });
      
      // Add outline polyline that follows terrain
      viewer.entities.add({
        polyline: {
          positions: boundaryPositions,
          width: 3,
          material: Cesium.Color.fromCssColorString("#fbbf24"),
          clampToGround: true,
        },
      });
      
      addBambooPlants(viewer, plot, year);
      if (showLidar) {
        addLidarPointCloud(viewer, plot, year);
      }
    }
  }, [year, plot, showLidar]);

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
        minHeight: "100%",
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

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
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
  const maxPoles = 50;
  const poleCountPerClump = Math.floor(minPoles + (maxPoles - minPoles) / 
    (1 + Math.exp(-15 * (progress - 0.3))));
  
  const spacingMeters = 8;
  const plotSizeMeters = Math.sqrt(plot.areaHectares * 10000);
  const clumpsPerRow = Math.floor(plotSizeMeters / spacingMeters);
  const totalClumps = clumpsPerRow * clumpsPerRow;
  
  const visibleClumps = Math.min(totalClumps, Math.round(plot.areaHectares * 150));
  const visibleGridSize = Math.ceil(Math.sqrt(visibleClumps));
  
  const halfSize = plotSizeMeters / 2;
  const plotSeed = Math.abs(plot.latitude * 1000 + plot.longitude * 1000);
  
  const clumpSpacing = 8;
  const gridExtent = (visibleGridSize - 1) * clumpSpacing;
  const gridOffset = gridExtent / 2;

  for (let i = 0; i < visibleClumps; i++) {
    const row = Math.floor(i / visibleGridSize);
    const col = i % visibleGridSize;
    
    const clumpSeed = plotSeed + i * 100;
    const jitterX = (seededRandom(clumpSeed) - 0.5) * 2;
    const jitterZ = (seededRandom(clumpSeed + 1) - 0.5) * 2;
    
    const offsetX = -gridOffset + col * clumpSpacing + jitterX;
    const offsetZ = -gridOffset + row * clumpSpacing + jitterZ;
    
    const offsetLat = offsetZ / 111320;
    const offsetLng = offsetX / (111320 * Math.cos(plot.latitude * Math.PI / 180));
    
    const clumpLat = plot.latitude + offsetLat;
    const clumpLng = plot.longitude + offsetLng;
    
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(clumpLng, clumpLat, 0),
      ellipsoid: {
        radii: new Cesium.Cartesian3(1.5, 1.5, 0.3),
        material: Cesium.Color.fromCssColorString("#8B4513"),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
    
    const polesInThisClump = Math.min(poleCountPerClump, 12);
    
    for (let p = 0; p < polesInThisClump; p++) {
      const poleSeed = clumpSeed + p * 10;
      const isCenter = seededRandom(poleSeed) < 0.3;
      const poleRadius = isCenter ? seededRandom(poleSeed + 1) * 0.4 : 0.5 + seededRandom(poleSeed + 1) * 1.0;
      const poleAngle = seededRandom(poleSeed + 2) * Math.PI * 2;
      
      const poleOffsetX = Math.cos(poleAngle) * poleRadius;
      const poleOffsetZ = Math.sin(poleAngle) * poleRadius;
      
      const poleOffsetLat = poleOffsetZ / 111320;
      const poleOffsetLng = poleOffsetX / (111320 * Math.cos(clumpLat * Math.PI / 180));
      
      const poleLat = clumpLat + poleOffsetLat;
      const poleLng = clumpLng + poleOffsetLng;
      
      const heightVariation = 0.7 + seededRandom(poleSeed + 3) * 0.5;
      const poleHeight = baseHeight * heightVariation;
      
      const thicknessRandom = seededRandom(poleSeed + 4);
      const thickness = 0.06 + thicknessRandom * 0.08 + progress * 0.06;
      
      const maturityFactor = Math.min(progress * 2, 1);
      const hue = 0.28 + maturityFactor * 0.05;
      const saturation = 0.7 - maturityFactor * 0.15;
      const lightnessRandom = seededRandom(poleSeed + 5);
      const lightness = 0.35 + lightnessRandom * 0.1;
      
      const r = Math.floor((1 - saturation + saturation * Math.max(0, Math.abs(hue * 6 - 3) - 1)) * lightness * 255);
      const g = Math.floor((1 - saturation + saturation * Math.max(0, 2 - Math.abs(hue * 6 - 2))) * lightness * 255 * 1.4);
      const b = Math.floor((1 - saturation + saturation * Math.max(0, 2 - Math.abs(hue * 6 - 4))) * lightness * 255 * 0.5);
      
      const poleColor = new Cesium.Color(
        Math.min(1, r / 255),
        Math.min(1, g / 255),
        Math.min(1, b / 255),
        1
      );

      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(poleLng, poleLat, 0),
        cylinder: {
          length: poleHeight,
          topRadius: thickness * 0.7,
          bottomRadius: thickness,
          material: poleColor,
          outline: false,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
    }
  }

}

function addLidarPointCloud(
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
  
  const hectareMeters = 100;
  const halfSize = hectareMeters / 2;
  
  const gridResolution = 4;
  const numPoints = Math.floor(hectareMeters / gridResolution);
  
  for (let x = 0; x < numPoints; x++) {
    for (let z = 0; z < numPoints; z++) {
      const offsetX = (x * gridResolution - halfSize + gridResolution * Math.random());
      const offsetZ = (z * gridResolution - halfSize + gridResolution * Math.random());
      
      const offsetLat = offsetZ / 111320;
      const offsetLng = offsetX / (111320 * Math.cos(plot.latitude * Math.PI / 180));
      
      const pointLat = plot.latitude + offsetLat;
      const pointLng = plot.longitude + offsetLng;
      
      const distFromCenter = Math.sqrt(offsetX * offsetX + offsetZ * offsetZ) / halfSize;
      const noise = Math.random() * 0.4 + 0.6;
      const clumpProximity = Math.sin(offsetX * 0.15) * Math.sin(offsetZ * 0.15);
      const heightFactor = Math.max(0.1, (1 - distFromCenter * 0.3) * noise * (0.8 + clumpProximity * 0.4));
      
      const pointHeight = baseHeight * heightFactor * (0.3 + Math.random() * 0.7);
      
      const normalizedHeight = pointHeight / maxHeight;
      let pointColor;
      if (normalizedHeight < 0.3) {
        pointColor = Cesium.Color.fromCssColorString("#22c55e").withAlpha(0.8);
      } else if (normalizedHeight < 0.6) {
        pointColor = Cesium.Color.fromCssColorString("#84cc16").withAlpha(0.8);
      } else if (normalizedHeight < 0.85) {
        pointColor = Cesium.Color.fromCssColorString("#eab308").withAlpha(0.8);
      } else {
        pointColor = Cesium.Color.fromCssColorString("#ef4444").withAlpha(0.8);
      }
      
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(pointLng, pointLat, pointHeight),
        point: {
          pixelSize: 3,
          color: pointColor,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  }
}
