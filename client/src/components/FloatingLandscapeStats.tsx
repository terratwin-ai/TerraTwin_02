import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TreePine, 
  Users, 
  Leaf, 
  TrendingUp,
  CheckCircle,
  Clock
} from "lucide-react";
import type { Plot, Steward } from "@shared/schema";

interface FloatingLandscapeStatsProps {
  plots: Plot[];
  stewards: Steward[];
}

export function FloatingLandscapeStats({ plots, stewards }: FloatingLandscapeStatsProps) {
  const verifiedPlots = plots.filter(p => p.status === "verified").length;
  const pendingPlots = plots.filter(p => p.status === "pending").length;
  const totalHectares = plots.reduce((sum, p) => sum + p.areaHectares, 0);
  const totalCarbon = plots.reduce((sum, p) => sum + (p.carbonTons || 0), 0);
  const avgHealth = plots.length > 0 
    ? plots.reduce((sum, p) => sum + (p.healthScore || 0), 0) / plots.length 
    : 0;

  return (
    <div className="fixed top-4 right-4 z-40 flex gap-2" data-testid="floating-landscape-stats">
      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TreePine className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plots</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{plots.length}</span>
              <Badge variant="outline" className="text-xs gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                {verifiedPlots}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Stewards</p>
            <span className="text-lg font-bold">{stewards.length}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Leaf className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Carbon</p>
            <span className="text-lg font-bold">{totalCarbon.toFixed(0)}</span>
            <span className="text-xs text-muted-foreground ml-1">t CO2e</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl hidden lg:block">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Area</p>
            <span className="text-lg font-bold">{totalHectares.toFixed(0)}</span>
            <span className="text-xs text-muted-foreground ml-1">ha</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
