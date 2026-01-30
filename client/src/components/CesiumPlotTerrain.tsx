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

        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#0f1a14");
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#2d4a3e");
        viewer.scene.fog.enabled = false;

        const hectareMeters = 100;
        const degreesPerMeter = 1 / 111320;
        const halfSizeDeg = (hectareMeters / 2) * degreesPerMeter;
        
        const west = plot.longitude - halfSizeDeg;
        const east = plot.longitude + halfSizeDeg;
        const south = plot.latitude - halfSizeDeg;
        const north = plot.latitude + halfSizeDeg;
        
        const plotCenter = Cesium.Cartesian3.fromDegrees(plot.longitude, plot.latitude, 0);

        try {
          const clippingPlanes = new Cesium.ClippingPlaneCollection({
            planes: [
              new Cesium.ClippingPlane(new Cesium.Cartesian3(1, 0, 0), hectareMeters / 2),
              new Cesium.ClippingPlane(new Cesium.Cartesian3(-1, 0, 0), hectareMeters / 2),
              new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 1, 0), hectareMeters / 2),
              new Cesium.ClippingPlane(new Cesium.Cartesian3(0, -1, 0), hectareMeters / 2),
            ],
            modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(plotCenter),
            unionClippingRegions: false,
            edgeWidth: 2.0,
            edgeColor: Cesium.Color.fromCssColorString("#22c55e").withAlpha(0.8),
          });
          viewer.scene.globe.clippingPlanes = clippingPlanes;
        } catch (e) {
          console.log("Clipping planes not supported, using visual mask");
          const maskOffset = halfSizeDeg * 15;
          const outerRing = [
            plot.longitude - maskOffset, plot.latitude - maskOffset,
            plot.longitude + maskOffset, plot.latitude - maskOffset,
            plot.longitude + maskOffset, plot.latitude + maskOffset,
            plot.longitude - maskOffset, plot.latitude + maskOffset,
            plot.longitude - maskOffset, plot.latitude - maskOffset,
          ];
          const innerRing = [
            west, south, west, north, east, north, east, south, west, south,
          ];
          viewer.entities.add({
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy(
                Cesium.Cartesian3.fromDegreesArray(outerRing),
                [new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(innerRing))]
              ),
              material: Cesium.Color.fromCssColorString("#0f1a14"),
              height: 0,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
          });
        }

        const controller = viewer.scene.screenSpaceCameraController;
        controller.enableRotate = true;
        controller.enableZoom = true;
        controller.enableTilt = true;
        controller.enableTranslate = false;
        controller.minimumZoomDistance = 50;
        controller.maximumZoomDistance = 300;

        viewer.camera.lookAt(
          plotCenter,
          new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(0),
            Cesium.Math.toRadians(-50),
            150
          )
        );

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
    <div className="relative w-full h-full">
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ background: "linear-gradient(135deg, #1a2f23 0%, #0f1a14 100%)" }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-emerald-900/30 to-background/80">
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
  
  const growthYears = Math.max(0, year - 2024);
  const maturityProgress = Math.min(1, growthYears / 7);
  
  const baseClumpCount = Math.floor(plot.areaHectares * 25);
  const clumpCount = Math.floor(baseClumpCount * (0.3 + maturityProgress * 0.7));
  
  const hectareMeters = 100;
  const halfSize = hectareMeters / 2;
  
  const bambooColor = Cesium.Color.fromCssColorString(
    maturityProgress < 0.3 ? "#4ade80" : 
    maturityProgress < 0.7 ? "#22c55e" : "#16a34a"
  );
  
  const baseScale = 0.3 + maturityProgress * 0.7;

  for (let i = 0; i < clumpCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * halfSize * 0.9;
    
    const offsetLat = (radius * Math.cos(angle)) / 111320;
    const offsetLng = (radius * Math.sin(angle)) / (111320 * Math.cos(plot.latitude * Math.PI / 180));
    
    const lat = plot.latitude + offsetLat;
    const lng = plot.longitude + offsetLng;
    
    const clumpScale = baseScale * (0.7 + Math.random() * 0.6);
    const height = 2 + maturityProgress * 18 * clumpScale;

    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lng, lat, height / 2),
      cylinder: {
        length: height,
        topRadius: 1.5 * clumpScale,
        bottomRadius: 2.5 * clumpScale,
        material: bambooColor.withAlpha(0.9),
        outline: false,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
      },
    });

    if (maturityProgress > 0.2) {
      const leafCount = Math.floor(2 + maturityProgress * 4);
      for (let j = 0; j < leafCount; j++) {
        const leafAngle = (j / leafCount) * Math.PI * 2;
        const leafRadius = 3 * clumpScale;
        const leafOffsetLat = (leafRadius * Math.cos(leafAngle)) / 111320;
        const leafOffsetLng = (leafRadius * Math.sin(leafAngle)) / (111320 * Math.cos(lat * Math.PI / 180));
        
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(
            lng + leafOffsetLng,
            lat + leafOffsetLat,
            height * 0.7
          ),
          ellipsoid: {
            radii: new Cesium.Cartesian3(1.5 * clumpScale, 1.5 * clumpScale, 3 * clumpScale),
            material: Cesium.Color.fromCssColorString("#22c55e").withAlpha(0.7),
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          },
        });
      }
    }
  }

  const outlineColor = Cesium.Color.fromCssColorString("#fbbf24").withAlpha(0.6);
  const cornerOffset = halfSize / 111320;
  const corners = [
    [plot.longitude - cornerOffset, plot.latitude - cornerOffset],
    [plot.longitude + cornerOffset, plot.latitude - cornerOffset],
    [plot.longitude + cornerOffset, plot.latitude + cornerOffset],
    [plot.longitude - cornerOffset, plot.latitude + cornerOffset],
    [plot.longitude - cornerOffset, plot.latitude - cornerOffset],
  ];

  viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray(corners.flat()),
      width: 3,
      material: outlineColor,
      clampToGround: true,
    },
  });
}
