import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Plot } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Camera, MapPin, Clock, AlertCircle, ChevronRight, Leaf
} from "lucide-react";
import { StewardLayout } from "@/components/steward/StewardLayout";

const statusConfig = {
  pending: { icon: Clock, label: "Pending", color: "bg-amber-400/20 text-amber-500 border-amber-400/30" },
  under_review: { icon: AlertCircle, label: "Under Review", color: "bg-red-500/20 text-red-500 border-red-500/30" },
};

export default function StewardCapture() {
  const [, setLocation] = useLocation();
  const [stewardId, setStewardId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("stewardId");
    if (!id) {
      setLocation("/steward");
      return;
    }
    setStewardId(id);
  }, [setLocation]);

  const { data: plots = [], isLoading } = useQuery<Plot[]>({
    queryKey: ["/api/plots"],
    enabled: !!stewardId,
  });

  const myPlots = plots.filter((p) => p.stewardId?.toString() === stewardId);
  const needsVerification = myPlots.filter(
    (p) => p.status === "pending" || p.status === "under_review"
  );

  if (!stewardId) return null;

  return (
    <StewardLayout activeTab="capture">
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Capture Verification
          </h1>
          <p className="text-sm text-muted-foreground">Select a plot to submit evidence</p>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading plots...</div>
        ) : needsVerification.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Leaf className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
              <h3 className="font-medium mb-1">All Caught Up!</h3>
              <p className="text-sm text-muted-foreground">
                All your plots are verified or awaiting review.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {needsVerification.length} plot{needsVerification.length !== 1 ? "s" : ""} need verification
            </p>
            {needsVerification.map((plot) => {
              const config = statusConfig[plot.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = config.icon;
              
              return (
                <Card 
                  key={plot.id} 
                  className="cursor-pointer hover-elevate"
                  onClick={() => setLocation(`/steward/submit/${plot.id}`)}
                  data-testid={`capture-plot-${plot.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{plot.name}</h3>
                          <Badge variant="outline" className={`text-xs ${config.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{plot.areaHectares} ha • {plot.clumpCount} clumps</span>
                        </div>
                      </div>
                      <Button size="sm" className="gap-1 shrink-0">
                        <Camera className="h-3.5 w-3.5" />
                        Capture
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StewardLayout>
  );
}
