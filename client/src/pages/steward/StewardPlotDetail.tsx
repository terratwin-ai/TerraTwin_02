import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import type { Plot, VerificationEvent, Steward } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentChat } from "@/components/AgentChat";
import { 
  ArrowLeft, MapPin, Leaf, Camera, CheckCircle2, Clock, 
  AlertCircle, FileCheck, TreeDeciduous, DollarSign, Calendar, Bot
} from "lucide-react";

const statusConfig = {
  verified: { icon: CheckCircle2, label: "Verified", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
  pending: { icon: Clock, label: "Pending Verification", color: "bg-amber-400/20 text-amber-500 border-amber-400/30" },
  submitted: { icon: FileCheck, label: "Submitted", color: "bg-orange-500/20 text-orange-500 border-orange-500/30" },
  under_review: { icon: AlertCircle, label: "Under Review", color: "bg-red-500/20 text-red-500 border-red-500/30" },
};

export default function StewardPlotDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const plotId = params.id;
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const id = localStorage.getItem("stewardId");
    if (!id) {
      setLocation("/steward");
    }
  }, [setLocation]);

  const { data: plots = [] } = useQuery<Plot[]>({
    queryKey: ["/api/plots"],
  });

  const { data: events = [] } = useQuery<VerificationEvent[]>({
    queryKey: ["/api/verification-events"],
  });

  const { data: stewards = [] } = useQuery<Steward[]>({
    queryKey: ["/api/stewards"],
  });

  const plot = plots.find((p) => p.id.toString() === plotId);
  const plotEvents = events.filter((e) => e.plotId?.toString() === plotId);
  const steward = stewards.find((s) => s.id === plot?.stewardId);

  if (!plot) {
    return (
      <div className="min-h-screen bg-black flex justify-center">
        <div className="w-full max-w-md bg-background flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading plot...</p>
        </div>
      </div>
    );
  }

  const config = statusConfig[plot.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;
  const needsVerification = plot.status === "pending" || plot.status === "under_review";
  const estimatedValue = (plot.carbonTons || 0) * 400;

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md bg-background flex flex-col min-h-screen shadow-2xl relative">
        <header className="p-3 border-b bg-card/50 flex items-center gap-3 sticky top-0 z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation("/steward/home")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-medium">{plot.name}</h1>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {plot.latitude.toFixed(4)}°N, {plot.longitude.toFixed(4)}°E
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-2 border-b bg-card/30">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1 gap-1.5" data-testid="tab-details">
              <Leaf className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="agent" className="flex-1 gap-1.5" data-testid="tab-agent">
              <Bot className="h-4 w-4" />
              AI Agent
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="flex-1 overflow-auto m-0 p-4 space-y-4 pb-24">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className={`${config.color}`}>
                  <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                  {config.label}
                </Badge>
                {plot.healthScore && (
                  <span className="text-sm text-muted-foreground">{plot.healthScore}% healthy</span>
                )}
              </div>
              <Progress value={plot.healthScore || 0} className="h-2" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<TreeDeciduous className="h-4 w-4 text-emerald-500" />} label="Clumps" value={plot.clumpCount?.toString() || "0"} />
            <StatCard icon={<MapPin className="h-4 w-4 text-amber-400" />} label="Area" value={`${plot.areaHectares} ha`} />
            <StatCard icon={<Leaf className="h-4 w-4 text-emerald-400" />} label="Carbon" value={`${plot.carbonTons || 0}t`} />
            <StatCard icon={<DollarSign className="h-4 w-4 text-amber-300" />} label="Est. Value" value={`₱${estimatedValue.toLocaleString()}`} />
          </div>

          {plotEvents.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Verification History
                </h3>
                <div className="space-y-3">
                  {plotEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-start gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        event.status === "approved" ? "bg-emerald-500" : 
                        event.status === "pending" ? "bg-amber-400" : "bg-red-500"
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium capitalize">{event.eventType.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : ""}
                          {event.paymentAmount && ` • ₱${event.paymentAmount.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {needsVerification && (
            <div className="absolute bottom-4 left-4 right-4">
              <Button 
                className="w-full h-14 text-lg gap-2"
                onClick={() => setLocation(`/steward/submit/${plotId}`)}
                data-testid="button-capture"
              >
                <Camera className="h-5 w-5" />
                Capture Verification
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="agent" className="flex-1 overflow-hidden m-0">
          <AgentChat plot={plot} steward={steward} />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
