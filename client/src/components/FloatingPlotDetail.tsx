import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  MapPin, 
  TreePine, 
  Leaf, 
  DollarSign, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  ExternalLink,
  User,
  Satellite
} from "lucide-react";
import type { Plot, Steward } from "@shared/schema";

interface FloatingPlotDetailProps {
  plot: Plot | null;
  steward?: Steward;
  onClose: () => void;
}

export function FloatingPlotDetail({ plot, steward, onClose }: FloatingPlotDetailProps) {
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (plot) {
      setIsVisible(true);
      requestAnimationFrame(() => setIsAnimating(true));
    } else if (isVisible) {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [plot, isVisible]);

  if (!isVisible || !plot) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "border-emerald-500/50 text-emerald-500 bg-emerald-500/10";
      case "pending":
        return "border-amber-500/50 text-amber-500 bg-amber-500/10";
      default:
        return "border-orange-500/50 text-orange-500 bg-orange-500/10";
    }
  };

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ease-out
        bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:top-4 md:right-6 md:w-[380px]
        ${isAnimating 
          ? "opacity-100 translate-y-0 md:translate-y-0 md:translate-x-0" 
          : "opacity-0 translate-y-full md:translate-y-0 md:translate-x-4"
        }`}
      style={{ maxHeight: "calc(100vh - 32px)" }}
      data-testid="floating-plot-detail"
    >
      <Card className="h-full bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden flex flex-col !rounded-b-none md:!rounded-b-xl max-h-[75vh] md:max-h-none">
        <CardHeader className="p-4 border-b flex flex-row items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <TreePine className="h-5 w-5 text-primary" />
              <h3 className="font-semibold" data-testid="text-plot-name">{plot.name}</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{plot.latitude.toFixed(4)}°N, {plot.longitude.toFixed(4)}°E</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={getStatusColor(plot.status)}>
                {getStatusIcon(plot.status)}
                <span className="ml-1 capitalize">{plot.status}</span>
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {plot.areaHectares.toFixed(1)} ha
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-plot-detail"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {steward && (
              <Card className="border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{steward.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {steward.barangay}, {steward.province}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border/50">
                <CardContent className="p-3 text-center">
                  <Leaf className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold">{plot.healthScore || 0}%</p>
                  <p className="text-xs text-muted-foreground">Health Score</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-3 text-center">
                  <DollarSign className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{plot.carbonTons?.toFixed(1) || 0}</p>
                  <p className="text-xs text-muted-foreground">Tons CO2e</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TreePine className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Bamboo Coverage</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Clumps</span>
                    <span className="font-medium">{plot.clumpCount || 0}</span>
                  </div>
                  <Progress value={(plot.healthScore || 0)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Estimated {Math.round((plot.areaHectares * 150))} total clumps at maturity
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Carbon Projections</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Rate</span>
                    <span className="font-medium">{(plot.areaHectares * 8.75).toFixed(1)} t/yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">10-Year Total</span>
                    <span className="font-medium">{(plot.areaHectares * 87.5).toFixed(0)} t CO2e</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit Value (10yr)</span>
                    <span className="font-medium text-emerald-500">
                      ${(plot.areaHectares * 87.5 * 30).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-card/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => navigate(`/plot/${plot.id}`)}
              data-testid="button-view-immersive"
            >
              <Eye className="h-4 w-4" />
              3D View
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => navigate(`/plot/${plot.id}`)}
              data-testid="button-open-plot"
            >
              <ExternalLink className="h-4 w-4" />
              Open Plot
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
