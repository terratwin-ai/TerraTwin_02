import { useEffect, useRef, useState } from "react";
import type { Plot } from "@shared/schema";
import { Leaf, AlertTriangle, MapPin, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Cesium: typeof import("cesium");
    CESIUM_BASE_URL: string;
  }
}

interface CesiumLandscapeProps {
  plots: Plot[];
  selectedPlotId: string | null;
  onPlotSelect: (id: string) => void;
  onPlotDoubleClick?: (id: string) => void;
  cesiumToken: string;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "verified":
      return "#10b981";
    case "pending":
      return "#fbbf24";
    case "submitted":
      return "#f97316";
    case "under_review":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

function getStatusBadge(status: string) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    verified: "default",
    pending: "secondary",
    submitted: "outline",
    under_review: "destructive",
  };
  return variants[status] || "secondary";
}

function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  const s = String(str);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function FallbackMapView({ plots, selectedPlotId, onPlotSelect }: Omit<CesiumLandscapeProps, "cesiumToken">) {
  const minLat = Math.min(...plots.map(p => p.latitude));
  const maxLat = Math.max(...plots.map(p => p.latitude));
  const minLng = Math.min(...plots.map(p => p.longitude));
  const maxLng = Math.max(...plots.map(p => p.longitude));

  const normalizePosition = (lat: number, lng: number) => {
    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;
    const x = ((lng - minLng) / lngRange) * 80 + 10;
    const y = ((maxLat - lat) / latRange) * 80 + 10;
    return { x, y };
  };

  return (
    <div data-testid="fallback-map" className="w-full h-full relative bg-gradient-to-br from-green-900/20 via-emerald-800/10 to-teal-900/20 overflow-auto">
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-muted-foreground">Cesium terrain unavailable</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative w-full h-full min-h-[400px]">
        {plots.map((plot) => {
          const pos = normalizePosition(plot.latitude, plot.longitude);
          const isSelected = selectedPlotId === plot.id.toString();
          
          return (
            <div
              key={plot.id}
              data-testid={`fallback-plot-${plot.id}`}
              className={`absolute cursor-pointer transition-all duration-200 ${
                isSelected ? "z-20 scale-110" : "z-10 hover:scale-105"
              }`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
              onClick={() => onPlotSelect(plot.id.toString())}
            >
              <Card className={`w-40 ${isSelected ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3 w-3" style={{ color: getStatusColor(plot.status) }} />
                    <span className="text-xs font-medium truncate">{plot.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusBadge(plot.status)} className="text-xs">
                      {plot.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{plot.carbonTons}t CO₂</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CesiumLandscape({ plots, selectedPlotId, onPlotSelect, onPlotDoubleClick, cesiumToken }: CesiumLandscapeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const cssRef = useRef<HTMLLinkElement | null>(null);
  const [cesiumLoaded, setCesiumLoaded] = useState(!!window.Cesium);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerReady, setViewerReady] = useState(false);
  const plotsRef = useRef<Plot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Plot[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const filtered = plots.filter(plot => 
        plot.name.toLowerCase().includes(query.toLowerCase()) ||
        plot.status.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const flyToPlot = (plot: Plot) => {
    if (viewerRef.current) {
      const Cesium = window.Cesium;
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(plot.longitude, plot.latitude, 2000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
        duration: 1.5,
      });
    }
    onPlotSelect(plot.id.toString());
    setSearchQuery("");
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  useEffect(() => {
    if (!cesiumToken) {
      setError("Cesium Ion token required");
      setLoading(false);
      return;
    }

    if (window.Cesium) {
      setCesiumLoaded(true);
      return;
    }

    window.CESIUM_BASE_URL = "https://cesium.com/downloads/cesiumjs/releases/1.119/Build/Cesium/";

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = `${window.CESIUM_BASE_URL}Widgets/widgets.css`;
    document.head.appendChild(cssLink);
    cssRef.current = cssLink;

    const script = document.createElement("script");
    script.src = `${window.CESIUM_BASE_URL}Cesium.js`;
    script.async = true;
    
    script.onload = () => {
      setCesiumLoaded(true);
    };
    
    script.onerror = () => {
      setError("Failed to load Cesium library");
      setLoading(false);
    };
    
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
      }
      if (cssRef.current && document.head.contains(cssRef.current)) {
        document.head.removeChild(cssRef.current);
      }
    };
  }, [cesiumToken]);

  useEffect(() => {
    if (!viewerReady || !viewerRef.current || !containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (viewerRef.current && viewerRef.current.canvas) {
        viewerRef.current.resize();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [viewerReady]);

  useEffect(() => {
    if (!cesiumLoaded || !containerRef.current || !cesiumToken || viewerRef.current) return;

    const Cesium = window.Cesium;

    const initViewer = async () => {
      try {
        Cesium.Ion.defaultAccessToken = cesiumToken;

        let terrainProvider;
        try {
          terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1);
        } catch (terrainError) {
          console.warn("Failed to load Cesium terrain, using ellipsoid:", terrainError);
          terrainProvider = undefined;
        }

        const viewer = new Cesium.Viewer(containerRef.current!, {
          terrainProvider,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          vrButton: false,
          selectionIndicator: false,
          infoBox: false,
          shouldAnimate: false,
        });

        viewerRef.current = viewer;
        viewer.scene.globe.enableLighting = false;

        viewer.screenSpaceEventHandler.setInputAction((click: any) => {
          const pickedObject = viewer.scene.pick(click.position);
          if (Cesium.defined(pickedObject) && pickedObject.id) {
            const entityId = pickedObject.id.id || pickedObject.id;
            if (typeof entityId === "string") {
              onPlotSelect(entityId);
            }
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        viewer.screenSpaceEventHandler.setInputAction((click: any) => {
          const pickedObject = viewer.scene.pick(click.position);
          if (Cesium.defined(pickedObject) && pickedObject.id) {
            const entityId = pickedObject.id.id || pickedObject.id;
            if (typeof entityId === "string" && onPlotDoubleClick) {
              onPlotDoubleClick(entityId);
            }
          }
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        setViewerReady(true);
        setLoading(false);
      } catch (err) {
        console.error("Cesium initialization error:", err);
        setError("Failed to initialize Cesium viewer");
        setLoading(false);
      }
    };

    initViewer();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        setViewerReady(false);
      }
    };
  }, [cesiumLoaded, cesiumToken]);

  useEffect(() => {
    if (!viewerReady || !viewerRef.current) return;

    const Cesium = window.Cesium;
    const viewer = viewerRef.current;
    const currentPlotIds = new Set(plots.map(p => p.id.toString()));
    const existingEntityIds = new Set<string>();

    viewer.entities.values.forEach((entity: any) => {
      existingEntityIds.add(entity.id);
    });

    existingEntityIds.forEach((entityId) => {
      if (!currentPlotIds.has(entityId)) {
        const entity = viewer.entities.getById(entityId);
        if (entity) {
          viewer.entities.remove(entity);
        }
      }
    });

    plots.forEach((plot) => {
      const plotId = plot.id.toString();
      const lat = plot.latitude;
      const lng = plot.longitude;
      const color = getStatusColor(plot.status);
      
      const existingEntity = viewer.entities.getById(plotId);
      
      const description = `
        <div style="padding: 10px; font-family: sans-serif;">
          <h3 style="margin: 0 0 10px 0;">${escapeHtml(plot.name)}</h3>
          <p><strong>Status:</strong> ${escapeHtml(plot.status)}</p>
          <p><strong>Area:</strong> ${escapeHtml(plot.areaHectares)} hectares</p>
          <p><strong>Clumps:</strong> ${escapeHtml(plot.clumpCount)}</p>
          <p><strong>Health Score:</strong> ${escapeHtml(plot.healthScore)}%</p>
          <p><strong>Carbon:</strong> ${escapeHtml(plot.carbonTons)} tons CO₂</p>
          <p><strong>Coordinates:</strong> ${escapeHtml(lat)}, ${escapeHtml(lng)}</p>
        </div>
      `;

      if (existingEntity) {
        existingEntity.position = Cesium.Cartesian3.fromDegrees(lng, lat, 50);
        existingEntity.point.color = Cesium.Color.fromCssColorString(color);
        existingEntity.description = description;
        existingEntity.label.text = plot.name;
      } else {
        viewer.entities.add({
          id: plotId,
          name: plot.name,
          position: Cesium.Cartesian3.fromDegrees(lng, lat, 50),
          point: {
            pixelSize: 16,
            color: Cesium.Color.fromCssColorString(color),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          },
          label: {
            text: plot.name,
            font: "12px sans-serif",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          },
          description,
        });
      }
    });

    const plotsChanged = JSON.stringify(plots.map(p => p.id)) !== JSON.stringify(plotsRef.current.map(p => p.id));
    if (plotsChanged && plots.length > 0) {
      const avgLat = plots.reduce((sum, p) => sum + p.latitude, 0) / plots.length;
      const avgLng = plots.reduce((sum, p) => sum + p.longitude, 0) / plots.length;

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(avgLng, avgLat - 0.16, 45000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-60),
          roll: 0,
        },
        duration: 2,
      });
    }
    
    plotsRef.current = plots;
  }, [viewerReady, plots]);

  useEffect(() => {
    if (!viewerReady || !viewerRef.current || !selectedPlotId) return;

    const entity = viewerRef.current.entities.getById(selectedPlotId);
    if (entity) {
      viewerRef.current.selectedEntity = entity;
    }
  }, [viewerReady, selectedPlotId]);

  if (error) {
    return <FallbackMapView plots={plots} selectedPlotId={selectedPlotId} onPlotSelect={onPlotSelect} />;
  }

  return (
    <div className="w-full h-full relative" style={{ minHeight: "600px", height: "100%" }}>
      <div 
        ref={containerRef} 
        data-testid="cesium-viewer"
        className="w-full h-full absolute inset-0"
        style={{ minHeight: "600px" }}
      />
      
      <div className="absolute top-4 left-4 z-20 w-72">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search plots..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-9 bg-background/90 backdrop-blur-sm border-border/50 shadow-lg"
            data-testid="input-map-search"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={clearSearch}
              data-testid="button-clear-search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {showResults && searchResults.length > 0 && (
          <Card className="mt-2 bg-background/95 backdrop-blur-sm shadow-xl max-h-64 overflow-auto">
            <CardContent className="p-2">
              {searchResults.map((plot) => (
                <div
                  key={plot.id}
                  className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover-elevate"
                  onClick={() => flyToPlot(plot)}
                  data-testid={`search-result-${plot.id}`}
                >
                  <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: getStatusColor(plot.status) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{plot.name}</p>
                    <p className="text-xs text-muted-foreground">{plot.carbonTons}t CO₂ • {plot.status}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        
        {showResults && searchQuery && searchResults.length === 0 && (
          <Card className="mt-2 bg-background/95 backdrop-blur-sm shadow-xl">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No plots found</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-900/20 via-emerald-800/10 to-teal-900/20 z-10">
          <div className="text-center">
            <Leaf className="h-8 w-8 mx-auto text-primary animate-pulse" />
            <p className="text-sm text-muted-foreground mt-2">Loading Cesium terrain...</p>
          </div>
        </div>
      )}
    </div>
  );
}
