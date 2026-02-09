import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StewardLayout } from "@/components/steward/StewardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crosshair,
  Leaf,
  TreePine,
  Navigation,
} from "lucide-react";
import type { Plot, Steward } from "@shared/schema";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const STATUS_COLORS: Record<string, string> = {
  verified: "#22c55e",
  pending: "#f59e0b",
  submitted: "#3b82f6",
  under_review: "#8b5cf6",
};

const STATUS_LABELS: Record<string, string> = {
  verified: "Verified",
  pending: "Needs Verification",
  submitted: "Submitted",
  under_review: "Under Review",
};

function createPlotIcon(status: string, isSelected: boolean): L.DivIcon {
  const color = STATUS_COLORS[status] || "#6b7280";
  const size = isSelected ? 44 : 36;
  const pulse = isSelected ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${color};opacity:0.4;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : "";

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulse}
        <div style="
          width:${size}px;height:${size}px;
          border-radius:50%;
          background:${color};
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;
          transition:transform 0.2s;
        ">
          <svg width="${size * 0.45}" height="${size * 0.45}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5C13.3 7.7 12.5 8 12 8"/>
            <path d="M7 10c-.7-.7-1.69 0-2.5 0a2.5 2.5 0 1 1 0-5c.28 0 .5-.22.5-.5a2.5 2.5 0 1 1 5 0c0 .81-.7 1.8 0 2.5C10.7 7.7 11.5 8 12 8"/>
            <path d="M12 8v14"/>
            <path d="M9 21h6"/>
          </svg>
        </div>
      </div>
    `,
  });
}

export default function StewardMap() {
  const [, setLocation] = useLocation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [drawerExpanded, setDrawerExpanded] = useState(false);

  const stewardId = localStorage.getItem("stewardId") || "";

  useEffect(() => {
    if (!stewardId) {
      setLocation("/steward");
    }
  }, [stewardId, setLocation]);

  const { data: allPlots = [] } = useQuery<Plot[]>({
    queryKey: ["/api/plots"],
  });

  const { data: stewards = [] } = useQuery<Steward[]>({
    queryKey: ["/api/stewards"],
  });

  const steward = stewards.find((s) => s.id === stewardId);
  const myPlots = allPlots.filter((p) => p.stewardId === stewardId);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const centerLat = myPlots.length > 0
      ? myPlots.reduce((sum, p) => sum + p.latitude, 0) / myPlots.length
      : 8.4;
    const centerLng = myPlots.length > 0
      ? myPlots.reduce((sum, p) => sum + p.longitude, 0) / myPlots.length
      : 124.41;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18,
    }).addTo(map);

    L.tileLayer("https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png", {
      maxZoom: 18,
      opacity: 0.7,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    L.control.attribution({ position: "bottomleft", prefix: false })
      .addAttribution("Esri Satellite")
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [myPlots.length]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    myPlots.forEach((plot) => {
      const marker = L.marker([plot.latitude, plot.longitude], {
        icon: createPlotIcon(plot.status, selectedPlot?.id === plot.id),
      });

      marker.on("click", () => {
        setSelectedPlot(plot);
        setDrawerExpanded(true);
      });

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [myPlots, selectedPlot?.id]);

  const flyToPlot = (plot: Plot) => {
    if (mapRef.current) {
      mapRef.current.flyTo([plot.latitude, plot.longitude], 16, { duration: 1 });
    }
    setSelectedPlot(plot);
    setDrawerExpanded(true);
  };

  const recenterMap = () => {
    if (!mapRef.current || myPlots.length === 0) return;
    const bounds = L.latLngBounds(myPlots.map((p) => [p.latitude, p.longitude] as [number, number]));
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  return (
    <StewardLayout activeTab="map">
      <div className="relative h-[calc(100vh-120px)] flex flex-col">
        <style>{`
          @keyframes ping {
            75%, 100% { transform: scale(1.8); opacity: 0; }
          }
        `}</style>

        <div ref={mapContainerRef} className="flex-1 relative z-0" data-testid="steward-map" />

        <Button
          size="icon"
          variant="outline"
          className="absolute top-3 left-3 z-10 bg-card/90 backdrop-blur-sm shadow-lg"
          onClick={recenterMap}
          data-testid="button-recenter-map"
        >
          <Crosshair className="h-4 w-4" />
        </Button>

        <div className="absolute top-3 right-14 z-10 flex flex-col gap-1" data-testid="map-legend">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-md shadow text-xs" data-testid={`legend-${status}`}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-foreground/80">{STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 z-10 bg-card border-t rounded-t-xl shadow-2xl transition-all duration-300 ${
            drawerExpanded ? "max-h-[60%]" : "max-h-[120px]"
          }`}
        >
          <div
            className="flex items-center justify-center py-2 cursor-pointer"
            onClick={() => setDrawerExpanded(!drawerExpanded)}
            data-testid="button-toggle-drawer"
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {selectedPlot ? (
            <div className="px-4 pb-4 overflow-y-auto">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-sm" data-testid="text-selected-plot-name">{selectedPlot.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedPlot.areaHectares} ha</p>
                </div>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: STATUS_COLORS[selectedPlot.status] + "60",
                    color: STATUS_COLORS[selectedPlot.status],
                    backgroundColor: STATUS_COLORS[selectedPlot.status] + "10",
                  }}
                >
                  {STATUS_LABELS[selectedPlot.status]}
                </Badge>
              </div>

              {drawerExpanded && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Card>
                      <CardContent className="p-2 text-center">
                        <TreePine className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                        <p className="text-xs text-muted-foreground">Clumps</p>
                        <p className="text-sm font-semibold" data-testid="text-clump-count">{selectedPlot.clumpCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 text-center">
                        <Leaf className="h-4 w-4 mx-auto mb-1 text-green-600" />
                        <p className="text-xs text-muted-foreground">Carbon</p>
                        <p className="text-sm font-semibold">{selectedPlot.carbonTons}t</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 text-center">
                        <Navigation className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                        <p className="text-xs text-muted-foreground">Health</p>
                        <p className="text-sm font-semibold">{selectedPlot.healthScore}%</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => setLocation(`/steward/plot/${selectedPlot.id}`)}
                      data-testid="button-view-plot"
                    >
                      View Plot Details
                    </Button>
                    {(selectedPlot.status === "pending" || selectedPlot.status === "verified") && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setLocation(`/steward/submit/${selectedPlot.id}`)}
                        data-testid="button-capture-verification"
                      >
                        Capture Verification
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 pb-3">
              <p className="text-sm font-medium mb-2">
                {myPlots.length} Plot{myPlots.length !== 1 ? "s" : ""} Assigned
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {myPlots.map((plot) => (
                  <Button
                    key={plot.id}
                    variant="ghost"
                    onClick={() => flyToPlot(plot)}
                    className="flex-shrink-0 flex items-center gap-2 px-3 bg-muted/50 text-left h-auto py-2"
                    data-testid={`plot-chip-${plot.id}`}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[plot.status] || "#6b7280" }}
                    />
                    <div>
                      <p className="text-xs font-medium truncate max-w-[120px]" data-testid={`text-chip-name-${plot.id}`}>{plot.name}</p>
                      <p className="text-[10px] text-muted-foreground" data-testid={`text-chip-area-${plot.id}`}>{plot.areaHectares} ha</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </StewardLayout>
  );
}
