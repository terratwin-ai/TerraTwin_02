import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  TreePine, 
  MapPin, 
  Leaf, 
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle
} from "lucide-react";
import type { Plot, Steward } from "@shared/schema";
import { useState } from "react";

interface PlotListProps {
  plots: Plot[];
  stewards: Steward[];
  onPlotSelect: (id: string) => void;
  selectedPlotId: string | null;
}

export function PlotList({ plots, stewards, onPlotSelect, selectedPlotId }: PlotListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredPlots = plots.filter((plot) => {
    const matchesSearch = plot.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || plot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStewardName = (stewardId: string | null) => {
    if (!stewardId) return "Unassigned";
    const steward = stewards.find((s) => s.id === stewardId);
    return steward?.name || "Unknown";
  };

  const statusConfig = {
    verified: { label: "Verified", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
    pending: { label: "Pending", color: "bg-amber-400/20 text-amber-300 border-amber-400/30", icon: Clock },
    submitted: { label: "Submitted", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: Eye },
    under_review: { label: "Under Review", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold" data-testid="text-plots-title">My Plots</h2>
          <p className="text-muted-foreground">Manage and monitor your bamboo plots</p>
        </div>
        <Button className="gap-2" data-testid="button-add-plot">
          <Plus className="h-4 w-4" />
          Add Plot
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-plots"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {Object.entries(statusConfig).map(([key, config]) => (
            <Badge
              key={key}
              variant="outline"
              className={`cursor-pointer ${statusFilter === key ? config.color : ""}`}
              onClick={() => setStatusFilter(statusFilter === key ? null : key)}
              data-testid={`filter-${key}`}
            >
              {config.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlots.map((plot) => {
          const config = statusConfig[plot.status as keyof typeof statusConfig] || statusConfig.pending;
          const StatusIcon = config.icon;

          return (
            <Card
              key={plot.id}
              className={`cursor-pointer transition-all hover-elevate ${
                selectedPlotId === plot.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onPlotSelect(plot.id)}
              data-testid={`plot-card-${plot.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{plot.name}</CardTitle>
                  <Badge variant="outline" className={`gap-1 ${config.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{plot.latitude.toFixed(4)}°N, {plot.longitude.toFixed(4)}°E</span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TreePine className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-semibold text-foreground">{plot.clumpCount || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Clumps</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="font-semibold text-foreground">{plot.carbonTons?.toFixed(1) || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Carbon (t)</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-semibold text-foreground">{plot.areaHectares.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Hectares</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-sm">
                  <span className="text-muted-foreground">Steward</span>
                  <span className="font-medium">{getStewardName(plot.stewardId)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPlots.length === 0 && (
        <div className="text-center py-12">
          <TreePine className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">No plots found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
