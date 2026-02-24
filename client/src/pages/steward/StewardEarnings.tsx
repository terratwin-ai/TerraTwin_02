import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Plot, Steward, VerificationEvent } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  Leaf,
  Calendar,
  CheckCircle,
  ArrowUpRight,
  Smartphone,
  CircleDollarSign,
  ArrowDownToLine,
  Clock,
  ChevronRight,
} from "lucide-react";
import { StewardLayout } from "@/components/steward/StewardLayout";

function GCashLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="text-blue-600 dark:text-blue-500">
      <rect width="40" height="40" rx="8" fill="currentColor" />
      <text
        x="50%"
        y="54%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="white"
        fontWeight="800"
        fontSize="16"
        fontFamily="system-ui, sans-serif"
      >
        G
      </text>
    </svg>
  );
}

export default function StewardEarnings() {
  const [, setLocation] = useLocation();
  const [stewardId, setStewardId] = useState<string | null>(null);
  const [showCashoutSuccess, setShowCashoutSuccess] = useState(false);

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

  const availableBalance = Math.floor(totalEarnings * 0.3);
  const pendingBalance = Math.floor(totalEarnings * 0.15);

  const stewardName = steward?.name || localStorage.getItem("stewardName") || "Steward";
  const phone = steward?.province?.includes("Misamis") ? "0917•••4521" : "0926•••8103";

  const gcashTransactions = [
    { id: "gc1", type: "cashout", amount: 2500, date: "Jan 28, 2026", status: "completed", ref: "GC-78291034" },
    { id: "gc2", type: "cashout", amount: 1800, date: "Jan 15, 2026", status: "completed", ref: "GC-65430912" },
    { id: "gc3", type: "received", amount: 3200, date: "Jan 10, 2026", status: "completed", ref: "TT-CARBON-0110" },
    { id: "gc4", type: "cashout", amount: 1200, date: "Dec 22, 2025", status: "completed", ref: "GC-54320198" },
    { id: "gc5", type: "received", amount: 4500, date: "Dec 15, 2025", status: "completed", ref: "TT-VERIF-1215" },
  ];

  const handleCashout = () => {
    setShowCashoutSuccess(true);
    setTimeout(() => setShowCashoutSuccess(false), 3000);
  };

  if (!stewardId) return null;

  return (
    <StewardLayout activeTab="earnings">
      <div className="p-4 space-y-4 pb-24">
        <div>
          <h1 className="text-xl font-bold" data-testid="text-earnings-title">Earnings</h1>
          <p className="text-sm text-muted-foreground">Payments via GCash</p>
        </div>

        <Card className="overflow-hidden border-0 shadow-lg" data-testid="card-total-earnings">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 opacity-80" />
                <span className="text-sm font-medium opacity-90">Total Earned</span>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">
                <Leaf className="h-3 w-3 mr-1" /> Carbon + Harvest
              </Badge>
            </div>
            <p className="text-4xl font-bold tracking-tight" data-testid="text-total-earnings">
              ₱{totalEarnings.toLocaleString()}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm opacity-80">
              <span data-testid="text-carbon-tons">{totalCarbonTons.toFixed(1)}t CO₂</span>
              <span>{verifiedPlots.length}/{myPlots.length} plots verified</span>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden" data-testid="card-gcash-wallet">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <GCashLogo size={36} />
                <div>
                  <p className="font-semibold text-sm" data-testid="text-gcash-label">GCash Wallet</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-gcash-phone">
                    {phone} &middot; {stewardName.split(" ")[0]}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-400">
                <CheckCircle className="h-3 w-3 mr-1" /> Linked
              </Badge>
            </div>

            <div className="grid grid-cols-2 divide-x">
              <div className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Available</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-available-balance">
                  ₱{availableBalance.toLocaleString()}
                </p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-pending-balance">
                  ₱{pendingBalance.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-3 border-t">
              <Button
                className="w-full gap-2 bg-blue-600 dark:bg-blue-500 border-blue-700 dark:border-blue-600 text-white"
                onClick={handleCashout}
                disabled={availableBalance <= 0}
                data-testid="button-gcash-cashout"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Cash Out to GCash
              </Button>
            </div>
          </CardContent>
        </Card>

        {showCashoutSuccess && (
          <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700" data-testid="card-cashout-success">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-emerald-800 dark:text-emerald-300 text-sm">Cash out requested!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  ₱{availableBalance.toLocaleString()} will arrive in your GCash within 1-2 business days
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-emerald-500 mb-2" />
              <p className="text-2xl font-bold" data-testid="text-carbon-captured">{totalCarbonTons.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Tons CO₂</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CircleDollarSign className="h-5 w-5 mx-auto text-emerald-500 mb-2" />
              <p className="text-2xl font-bold" data-testid="text-rate">₱30</p>
              <p className="text-xs text-muted-foreground">Per Ton Rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Transaction History
            </h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1" data-testid="button-view-all-transactions">
              View All <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          {gcashTransactions.map((tx) => (
            <Card key={tx.id} data-testid={`card-transaction-${tx.id}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.type === "cashout"
                        ? "bg-blue-50 dark:bg-blue-950/30"
                        : "bg-emerald-50 dark:bg-emerald-950/30"
                    }`}>
                      {tx.type === "cashout" ? (
                        <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowDownToLine className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" data-testid={`text-tx-type-${tx.id}`}>
                        {tx.type === "cashout" ? "GCash Cash Out" : "Payment Received"}
                      </p>
                      <p className="text-xs text-muted-foreground">{tx.date} &middot; {tx.ref}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-semibold text-sm ${
                      tx.type === "cashout"
                        ? "text-foreground"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`} data-testid={`text-tx-amount-${tx.id}`}>
                      {tx.type === "cashout" ? "-" : "+"}₱{tx.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      {tx.type === "cashout" && <GCashLogo size={12} />}
                      <span className="text-[10px] text-muted-foreground">
                        {tx.status === "completed" ? "Completed" : "Processing"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {paidEvents.length > 0 && (
            <>
              <h2 className="font-medium flex items-center gap-2 pt-2">
                <Leaf className="h-4 w-4" />
                Verification Payments
              </h2>
              {paidEvents.map((event) => {
                const plot = myPlots.find((p) => p.id === event.plotId);
                return (
                  <Card key={event.id} data-testid={`card-verification-${event.id}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{plot?.name || "Plot"}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {event.eventType.replace("_", " ")} &middot; {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : ""}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex-shrink-0">
                          +₱{event.paymentAmount?.toLocaleString()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">How Payouts Work</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Verification payments and carbon credit earnings are deposited to your TerraTwin wallet.
                  Cash out anytime to your linked GCash account. Transfers typically arrive within 1-2 business days.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StewardLayout>
  );
}
