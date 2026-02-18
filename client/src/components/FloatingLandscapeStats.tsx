import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TreePine, 
  Users, 
  Leaf, 
  TrendingUp,
  CheckCircle
} from "lucide-react";
import type { Plot, Steward } from "@shared/schema";

interface FloatingLandscapeStatsProps {
  plots: Plot[];
  stewards: Steward[];
  isHidden?: boolean;
}

export function FloatingLandscapeStats({ plots, stewards, isHidden }: FloatingLandscapeStatsProps) {
  const verifiedPlots = plots.filter(p => p.status === "verified").length;
  const totalHectares = plots.reduce((sum, p) => sum + p.areaHectares, 0);
  const totalCarbon = plots.reduce((sum, p) => sum + (p.carbonTons || 0), 0);

  if (isHidden) return null;

  return (
    <div className="fixed top-[52px] left-2 right-2 md:top-4 md:right-4 md:left-auto z-40" data-testid="floating-landscape-stats">
      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">
        <CardContent className="p-2 flex items-center gap-2 md:gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 border-r border-border/50 flex-shrink-0">
            <TreePine className="h-3.5 w-3.5 text-emerald-500" />
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold">{plots.length}</span>
              <Badge variant="outline" className="text-[10px] h-5 gap-0.5 px-1">
                <CheckCircle className="h-2.5 w-2.5 text-emerald-500" />
                {verifiedPlots}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 border-r border-border/50 flex-shrink-0">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-sm font-bold">{stewards.length}</span>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 border-r border-border/50 flex-shrink-0">
            <Leaf className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-bold">{totalCarbon.toFixed(0)}</span>
            <span className="text-[10px] text-muted-foreground">t CO₂</span>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 flex-shrink-0">
            <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-sm font-bold">{totalHectares.toFixed(0)}</span>
            <span className="text-[10px] text-muted-foreground">ha</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
