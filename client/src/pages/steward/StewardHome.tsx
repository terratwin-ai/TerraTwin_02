import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Plot, Steward } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Leaf, Camera, ChevronRight, CheckCircle2, Clock, 
  AlertCircle, FileCheck 
} from "lucide-react";
import { StewardLayout } from "@/components/steward/StewardLayout";

const statusConfig = {
  verified: { icon: CheckCircle2, label: "Verified", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
  pending: { icon: Clock, label: "Pending", color: "bg-amber-400/20 text-amber-500 border-amber-400/30" },
  submitted: { icon: FileCheck, label: "Submitted", color: "bg-orange-500/20 text-orange-500 border-orange-500/30" },
  under_review: { icon: AlertCircle, label: "Under Review", color: "bg-red-500/20 text-red-500 border-red-500/30" },
};

export default function StewardHome() {
  const [, setLocation] = useLocation();
  const [stewardId, setStewardId] = useState<string | null>(null);
  const [stewardName, setStewardName] = useState<string>("");

  useEffect(() => {
    const id = localStorage.getItem("stewardId");
    const name = localStorage.getItem("stewardName");
    if (!id) {
      setLocation("/steward");
      return;
    }
    setStewardId(id);
    setStewardName(name || "Steward");
  }, [setLocation]);

  const { data: plots = [], isLoading: plotsLoading } = useQuery<Plot[]>({
    queryKey: ["/api/plots"],
    enabled: !!stewardId,
  });

  const myPlots = plots.filter((p) => p.stewardId?.toString() === stewardId);
  const needsVerification = myPlots.filter((p) => p.status === "pending" || p.status === "under_review");
  const submitted = myPlots.filter((p) => p.status === "submitted");
  const verified = myPlots.filter((p) => p.status === "verified");

  if (!stewardId) return null;

  return (
    <StewardLayout activeTab="home">
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-xl font-bold">Hello, {stewardName}</h1>
          <p className="text-sm text-muted-foreground">Here are your bamboo plots</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-500">{needsVerification.length}</p>
              <p className="text-xs text-muted-foreground">Needs Action</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/10 border-orange-500/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{submitted.length}</p>
              <p className="text-xs text-muted-foreground">Submitted</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-emerald-500">{verified.length}</p>
              <p className="text-xs text-muted-foreground">Verified</p>
            </CardContent>
          </Card>
        </div>

        {needsVerification.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-medium flex items-center gap-2">
              <Camera className="h-4 w-4 text-amber-500" />
              Needs Verification
            </h2>
            {needsVerification.map((plot) => (
              <PlotCard 
                key={plot.id} 
                plot={plot} 
                onTap={() => setLocation(`/steward/plot/${plot.id}`)}
                showAction 
              />
            ))}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="font-medium flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            All My Plots ({myPlots.length})
          </h2>
          {plotsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading plots...</div>
          ) : myPlots.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No plots assigned yet</p>
              </CardContent>
            </Card>
          ) : (
            myPlots.map((plot) => (
              <PlotCard 
                key={plot.id} 
                plot={plot} 
                onTap={() => setLocation(`/steward/plot/${plot.id}`)} 
              />
            ))
          )}
        </div>
      </div>
    </StewardLayout>
  );
}

function PlotCard({ 
  plot, 
  onTap, 
  showAction = false 
}: { 
  plot: Plot; 
  onTap: () => void;
  showAction?: boolean;
}) {
  const config = statusConfig[plot.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <Card 
      className="cursor-pointer hover-elevate"
      onClick={onTap}
      data-testid={`plot-card-${plot.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{plot.name}</h3>
              <Badge variant="outline" className={`text-xs ${config.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Leaf className="h-3 w-3" />
                {plot.clumpCount} clumps
              </span>
              <span>{plot.areaHectares} ha</span>
              <span>{plot.carbonTons}t CO₂</span>
            </div>
          </div>
          {showAction ? (
            <Button size="sm" className="gap-1 shrink-0">
              <Camera className="h-3.5 w-3.5" />
              Verify
            </Button>
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
