import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Plot, Steward, VerificationEvent } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Leaf, Calendar, CheckCircle } from "lucide-react";
import { StewardLayout } from "@/components/steward/StewardLayout";

export default function StewardEarnings() {
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

  const { data: stewards = [] } = useQuery<Steward[]>({
    queryKey: ["/api/stewards"],
    enabled: !!stewardId,
  });

  const { data: plots = [] } = useQuery<Plot[]>({
    queryKey: ["/api/plots"],
    enabled: !!stewardId,
  });

  const { data: events = [] } = useQuery<VerificationEvent[]>({
    queryKey: ["/api/verification-events"],
    enabled: !!stewardId,
  });

  const steward = stewards.find((s) => s.id.toString() === stewardId);
  const myPlots = plots.filter((p) => p.stewardId?.toString() === stewardId);
  const verifiedPlots = myPlots.filter((p) => p.status === "verified");
  
  const paidEvents = events.filter(
    (e) => myPlots.some((p) => p.id === e.plotId) && e.paymentAmount && e.paymentAmount > 0
  );
  
  const totalCarbonTons = myPlots.reduce((sum, p) => sum + (p.carbonTons || 0), 0);
  const totalEarnings = steward?.totalEarnings || paidEvents.reduce((sum, e) => sum + (e.paymentAmount || 0), 0);

  if (!stewardId) return null;

  return (
    <StewardLayout activeTab="earnings">
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-xl font-bold">Earnings</h1>
          <p className="text-sm text-muted-foreground">Your verification payments</p>
        </div>

        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold">₱{totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-emerald-500 mb-2" />
              <p className="text-2xl font-bold">{totalCarbonTons.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Tons CO₂ Captured</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-5 w-5 mx-auto text-emerald-500 mb-2" />
              <p className="text-2xl font-bold">{verifiedPlots.length}/{myPlots.length}</p>
              <p className="text-xs text-muted-foreground">Plots Verified</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Payment History
          </h2>
          
          {paidEvents.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Leaf className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No payments yet</p>
                <p className="text-xs mt-1">Complete verifications to earn payments</p>
              </CardContent>
            </Card>
          ) : (
            paidEvents.map((event) => {
              const plot = myPlots.find((p) => p.id === event.plotId);
              return (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{plot?.name || "Plot"}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {event.eventType.replace("_", " ")} • {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                        +₱{event.paymentAmount?.toLocaleString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </StewardLayout>
  );
}
