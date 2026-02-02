import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  TreePine, 
  Leaf, 
  DollarSign, 
  Calendar, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Camera,
  X,
  Sparkles,
  Satellite
} from "lucide-react";
import type { Plot, Steward } from "@shared/schema";
import { AgentChat } from "./AgentChat";
import { SatelliteAnalysis } from "./SatelliteAnalysis";
import evidence1 from "@/assets/evidence1.png";
import evidence2 from "@/assets/evidence2.png";

interface PlotDetailPanelProps {
  plot: Plot;
  steward?: Steward;
  onClose: () => void;
}

export function PlotDetailPanel({ plot, steward, onClose }: PlotDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  
  const statusConfig = {
    verified: { label: "Verified", color: "bg-emerald-500 text-white", icon: CheckCircle2 },
    pending: { label: "Pending", color: "bg-amber-400 text-black", icon: Clock },
    submitted: { label: "Submitted", color: "bg-orange-500 text-white", icon: Eye },
    under_review: { label: "Under Review", color: "bg-red-500 text-white", icon: AlertCircle },
  };
  
  const config = statusConfig[plot.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="absolute inset-0 md:inset-auto md:right-4 md:top-4 md:bottom-4 md:w-[420px] z-10">
      <Card className="h-full flex flex-col overflow-hidden shadow-xl rounded-none md:rounded-lg">
        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2 bg-gradient-to-br from-primary/10 to-accent/20">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg leading-tight" data-testid="text-plot-name">
              {plot.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{Number(plot.latitude).toFixed(4)}°N, {Number(plot.longitude).toFixed(4)}°E</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-panel">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="details" data-testid="tab-details" className="gap-1 text-xs">
              <Leaf className="h-3 w-3" />
              Details
            </TabsTrigger>
            <TabsTrigger value="satellite" data-testid="tab-satellite" className="gap-1 text-xs">
              <Satellite className="h-3 w-3" />
              Satellite
            </TabsTrigger>
            <TabsTrigger value="ai" data-testid="tab-ai" className="gap-1 text-xs">
              <Sparkles className="h-3 w-3" />
              AI Agent
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="flex-1 overflow-auto mt-0 p-0">
            <CardContent className="space-y-5 pt-4">
              <div className="flex items-center gap-3">
                <Badge className={`${config.color} gap-1.5 px-3 py-1`} data-testid="badge-plot-status">
                  <StatusIcon className="h-3.5 w-3.5" />
                  {config.label}
                </Badge>
                {plot.lastVerified && (
                  <span className="text-xs text-muted-foreground">
                    Last verified: {new Date(plot.lastVerified).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {steward && (
                <div className="p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {steward.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium" data-testid="text-steward-name">{steward.name}</p>
                      <p className="text-xs text-muted-foreground">{steward.barangay}, {steward.province}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<TreePine className="h-4 w-4 text-emerald-500" />}
                  label="Clump Count"
                  value={plot.clumpCount?.toString() || "0"}
                  testId="stat-clump-count"
                />
                <StatCard
                  icon={<MapPin className="h-4 w-4 text-amber-400" />}
                  label="Area"
                  value={`${Number(plot.areaHectares).toFixed(2)} ha`}
                  testId="stat-area"
                />
                <StatCard
                  icon={<Leaf className="h-4 w-4 text-emerald-400" />}
                  label="Carbon"
                  value={`${Number(plot.carbonTons || 0).toFixed(1)} t`}
                  testId="stat-carbon"
                />
                <StatCard
                  icon={<DollarSign className="h-4 w-4 text-amber-300" />}
                  label="Est. Value"
                  value={`₱${(Number(plot.carbonTons || 0) * 400).toLocaleString()}`}
                  testId="stat-value"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Health Score</span>
                  <span className="font-medium">{plot.healthScore}%</span>
                </div>
                <Progress value={plot.healthScore || 0} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Dialog open={evidenceOpen} onOpenChange={setEvidenceOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2" data-testid="button-view-evidence">
                        <Camera className="h-4 w-4" />
                        View Evidence
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Camera className="h-5 w-5" />
                          Verification Evidence - {plot.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <img 
                            src={evidence1} 
                            alt="Bamboo clump with steward"
                            className="w-full h-48 object-cover rounded-lg border border-border"
                            data-testid="img-evidence-1"
                          />
                          <p className="text-xs text-muted-foreground text-center">Steward with giant bamboo clump</p>
                        </div>
                        <div className="space-y-2">
                          <img 
                            src={evidence2} 
                            alt="Bamboo grove detail"
                            className="w-full h-48 object-cover rounded-lg border border-border"
                            data-testid="img-evidence-2"
                          />
                          <p className="text-xs text-muted-foreground text-center">Bamboo grove detail shot</p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm text-muted-foreground">
                          Uploaded on {new Date().toLocaleDateString()} by {steward?.name || "Steward"}
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" className="gap-2" data-testid="button-view-history">
                    <Calendar className="h-4 w-4" />
                    History
                  </Button>
                </div>
                <Button className="w-full gap-2" data-testid="button-submit-verification">
                  <CheckCircle2 className="h-4 w-4" />
                  Submit for Verification
                </Button>
              </div>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="satellite" className="flex-1 overflow-auto mt-0 p-0">
            <SatelliteAnalysis plot={plot} />
          </TabsContent>
          
          <TabsContent value="ai" className="flex-1 overflow-hidden mt-0 p-0">
            <AgentChat plot={plot} steward={steward} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value,
  testId 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  testId: string;
}) {
  return (
    <div className="p-3 rounded-md bg-muted/30 border border-border/50" data-testid={testId}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
