import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Clock, 
  Eye, 
  AlertCircle,
  Camera,
  Calendar,
  DollarSign,
  FileCheck
} from "lucide-react";
import type { VerificationEvent, Plot, Steward } from "@shared/schema";

interface VerificationListProps {
  events: VerificationEvent[];
  plots: Plot[];
  stewards: Steward[];
}

export function VerificationList({ events, plots, stewards }: VerificationListProps) {
  const pendingEvents = events.filter(e => e.status === "pending" || e.status === "submitted");
  const reviewEvents = events.filter(e => e.status === "under_review");
  const completedEvents = events.filter(e => e.status === "verified" || e.status === "paid");

  const getPlotName = (plotId: string | null) => {
    if (!plotId) return "Unknown Plot";
    const plot = plots.find(p => p.id === plotId);
    return plot?.name || "Unknown Plot";
  };

  const getStewardName = (stewardId: string | null) => {
    if (!stewardId) return "Unknown";
    const steward = stewards.find(s => s.id === stewardId);
    return steward?.name || "Unknown";
  };

  const statusConfig = {
    pending: { label: "Pending", color: "bg-amber-500/10 text-amber-700 border-amber-200", icon: Clock },
    submitted: { label: "Submitted", color: "bg-blue-500/10 text-blue-700 border-blue-200", icon: Eye },
    under_review: { label: "Under Review", color: "bg-purple-500/10 text-purple-700 border-purple-200", icon: AlertCircle },
    verified: { label: "Verified", color: "bg-green-500/10 text-green-700 border-green-200", icon: CheckCircle },
    paid: { label: "Paid", color: "bg-chart-1/10 text-chart-1 border-chart-1/20", icon: DollarSign },
  };

  const eventTypeLabels: Record<string, string> = {
    planting: "Planting",
    maintenance: "Maintenance",
    survival_check: "Survival Check",
    growth_measurement: "Growth Measurement",
    harvest: "Harvest",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold" data-testid="text-verifications-title">Verifications</h2>
        <p className="text-muted-foreground">Track and manage verification events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingEvents.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reviewEvents.length}</p>
                <p className="text-sm text-muted-foreground">Under Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedEvents.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <DollarSign className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ₱{events.reduce((acc, e) => acc + (e.paymentAmount || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Payouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All Events</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">Pending ({pendingEvents.length})</TabsTrigger>
          <TabsTrigger value="review" data-testid="tab-review">Under Review ({reviewEvents.length})</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed ({completedEvents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          <EventList 
            events={events} 
            statusConfig={statusConfig} 
            eventTypeLabels={eventTypeLabels}
            getPlotName={getPlotName}
            getStewardName={getStewardName}
          />
        </TabsContent>
        <TabsContent value="pending" className="space-y-4 mt-4">
          <EventList 
            events={pendingEvents} 
            statusConfig={statusConfig} 
            eventTypeLabels={eventTypeLabels}
            getPlotName={getPlotName}
            getStewardName={getStewardName}
          />
        </TabsContent>
        <TabsContent value="review" className="space-y-4 mt-4">
          <EventList 
            events={reviewEvents} 
            statusConfig={statusConfig} 
            eventTypeLabels={eventTypeLabels}
            getPlotName={getPlotName}
            getStewardName={getStewardName}
          />
        </TabsContent>
        <TabsContent value="completed" className="space-y-4 mt-4">
          <EventList 
            events={completedEvents} 
            statusConfig={statusConfig} 
            eventTypeLabels={eventTypeLabels}
            getPlotName={getPlotName}
            getStewardName={getStewardName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventList({
  events,
  statusConfig,
  eventTypeLabels,
  getPlotName,
  getStewardName,
}: {
  events: VerificationEvent[];
  statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }>;
  eventTypeLabels: Record<string, string>;
  getPlotName: (id: string | null) => string;
  getStewardName: (id: string | null) => string;
}) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-1">No events found</h3>
        <p className="text-muted-foreground">Verification events will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const config = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.pending;
        const StatusIcon = config.icon;

        return (
          <Card key={event.id} className="hover-elevate" data-testid={`event-card-${event.id}`}>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">
                      {eventTypeLabels[event.eventType] || event.eventType}
                    </h4>
                    <Badge variant="outline" className={`gap-1 ${config.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{getPlotName(event.plotId)}</span>
                    <span>by {getStewardName(event.stewardId)}</span>
                    {event.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {event.paymentAmount && (
                    <p className="font-semibold text-chart-1">₱{event.paymentAmount.toLocaleString()}</p>
                  )}
                  {event.evidenceUrls && event.evidenceUrls.length > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {event.evidenceUrls.length} files
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" data-testid={`button-view-event-${event.id}`}>
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
