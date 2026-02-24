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
  filteredPlotIds?: string[] | null;
  hideSearch?: boolean;
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

export function CesiumLandscape({ plots, selectedPlotId, onPlotSelect, onPlotDoubleClick, cesiumToken, filteredPlotIds, hideSearch }: CesiumLandscapeProps) {
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
  const [searchResults, setSearchResults] = useState<Array<{ type: "plot" | "location"; plot?: Plot; name: string; lat: number; lon: number; detail?: string }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const visiblePlots = filteredPlotIds 
    ? plots.filter(p => filteredPlotIds.includes(p.id))
    : plots;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    // Debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results: Array<{ type: "plot" | "location"; plot?: Plot; name: string; lat: number; lon: number; detail?: string }> = [];
      
      // Search plots first
      const filteredPlots = plots.filter(plot => 
        plot.name.toLowerCase().includes(query.toLowerCase()) ||
        plot.status.toLowerCase().includes(query.toLowerCase())
      );
      filteredPlots.forEach(plot => {
        results.push({
          type: "plot",
          plot,
          name: plot.name,
          lat: plot.latitude,
          lon: plot.longitude,
          detail: `${plot.carbonTons}t CO₂ • ${plot.status}`
        });
      });
      
      // Local landmarks database for known locations (more accurate than external APIs)
      const localLandmarks = [
        // Mt. Anggas project area - Gitagum, Misamis Oriental
        { name: "Mount Anggas", aliases: ["mt anggas", "anggas peak", "mt. anggas", "anggas"], lat: 8.42, lon: 124.42, detail: "Gitagum, Misamis Oriental (482m)" },
        { name: "Kimalok", aliases: ["brgy kimalok"], lat: 8.43, lon: 124.41, detail: "Barangay in Gitagum, Misamis Oriental" },
        { name: "Calacapan", aliases: ["brgy calacapan"], lat: 8.38, lon: 124.38, detail: "Barangay in Gitagum, Misamis Oriental" },
        { name: "Taparak", aliases: ["brgy taparak"], lat: 8.36, lon: 124.45, detail: "Barangay in Gitagum, Misamis Oriental" },
        { name: "Mapulog", aliases: ["brgy mapulog"], lat: 8.32, lon: 124.38, detail: "Barangay in Gitagum, Misamis Oriental" },
        { name: "Gitagum", aliases: ["gitagum municipality"], lat: 8.40, lon: 124.40, detail: "Municipality, Misamis Oriental" },
        // Regional landmarks
        { name: "Cagayan de Oro", aliases: ["cdo", "cagayan"], lat: 8.4542, lon: 124.6319, detail: "Misamis Oriental" },
        { name: "Iligan City", aliases: ["iligan"], lat: 8.2280, lon: 124.2452, detail: "Lanao del Norte" },
        { name: "Lourdes", aliases: ["brgy lourdes"], lat: 8.48, lon: 124.48, detail: "Near Gitagum, Misamis Oriental" },
        { name: "La Pad", aliases: ["lapad"], lat: 8.50, lon: 124.46, detail: "Near Gitagum, Misamis Oriental" },
      ];
      
      // Normalize query: expand common abbreviations
      const normalizedQuery = query
        .replace(/\bmt\.?\s*/gi, "Mount ")
        .replace(/\bst\.?\s*/gi, "Saint ")
        .trim()
        .toLowerCase();
      
      // Search local landmarks first
      const matchingLandmarks = localLandmarks.filter(lm => 
        lm.name.toLowerCase().includes(normalizedQuery) ||
        lm.aliases.some(alias => alias.includes(normalizedQuery) || normalizedQuery.includes(alias))
      );
      
      matchingLandmarks.forEach(lm => {
        results.push({
          type: "location",
          name: lm.name,
          lat: lm.lat,
          lon: lm.lon,
          detail: lm.detail
        });
      });
      
      // Also search via Photon for other locations
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(normalizedQuery)}&limit=5&lat=8.0&lon=125.0&location_bias_scale=0.5`
        );
        const data = await response.json();
        const locationResults = data.features || [];
        
        // Filter for Philippines results, exclude duplicates
        const existingNames = new Set(results.map(r => r.name.toLowerCase()));
        const phResults = locationResults
          .filter((loc: { properties: { country?: string; name?: string } }) => 
            loc.properties?.country === "Philippines" && 
            !existingNames.has((loc.properties?.name || "").toLowerCase())
          )
          .slice(0, 3 - matchingLandmarks.length);
        
        phResults.forEach((loc: { properties: { name: string; city?: string; state?: string }; geometry: { coordinates: number[] } }) => {
          const props = loc.properties;
          const coords = loc.geometry.coordinates;
          results.push({
            type: "location",
            name: props.name,
            lat: coords[1],
            lon: coords[0],
            detail: [props.city, props.state].filter(Boolean).join(", ")
          });
        });
      } catch (error) {
        console.error("Location search failed:", error);
      }
      
      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 300);
  };

  const flyToResult = (result: { type: "plot" | "location"; plot?: Plot; lat: number; lon: number }) => {
    if (viewerRef.current) {
      const Cesium = window.Cesium;
      const altitude = result.type === "plot" ? 2000 : 15000;
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(result.lon, result.lat, altitude),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
        duration: 1.5,
      });
    }
    if (result.type === "plot" && result.plot) {
      onPlotSelect(result.plot.id.toString());
    }
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

    visiblePlots.forEach((plot) => {
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

    const plotsChanged = JSON.stringify(visiblePlots.map(p => p.id)) !== JSON.stringify(plotsRef.current.map(p => p.id));
    if (plotsChanged && visiblePlots.length > 0) {
      const avgLat = visiblePlots.reduce((sum, p) => sum + p.latitude, 0) / visiblePlots.length;
      const avgLng = visiblePlots.reduce((sum, p) => sum + p.longitude, 0) / visiblePlots.length;

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
    
    plotsRef.current = visiblePlots;
  }, [viewerReady, visiblePlots]);

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
      
      {!hideSearch && (
      <div className="absolute top-4 left-4 z-20 w-72">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search plots or locations..."
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
        
        {isSearching && (
          <Card className="mt-2 bg-background/95 backdrop-blur-sm shadow-xl">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Searching...</p>
            </CardContent>
          </Card>
        )}
        
        {!isSearching && showResults && searchResults.length > 0 && (
          <Card className="mt-2 bg-background/95 backdrop-blur-sm shadow-xl max-h-64 overflow-auto">
            <CardContent className="p-2">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.type}-${result.name}-${index}`}
                  className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover-elevate"
                  onClick={() => flyToResult(result)}
                  data-testid={`search-result-${index}`}
                >
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                      {result.type === "plot" ? "Plot" : "Map"}
                    </span>
                    <MapPin 
                      className="h-4 w-4" 
                      style={{ color: result.type === "plot" && result.plot ? getStatusColor(result.plot.status) : "#10b981" }} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.name}</p>
                    {result.detail && (
                      <p className="text-xs text-muted-foreground truncate">{result.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        
        {!isSearching && showResults && searchQuery && searchResults.length === 0 && (
          <Card className="mt-2 bg-background/95 backdrop-blur-sm shadow-xl">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No results found</p>
            </CardContent>
          </Card>
        )}
      </div>
      )}
      
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
