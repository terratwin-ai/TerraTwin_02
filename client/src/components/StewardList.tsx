import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TreePine, 
  DollarSign,
  Phone,
  MapPin,
  TrendingUp
} from "lucide-react";
import type { Steward } from "@shared/schema";

interface StewardListProps {
  stewards: Steward[];
}

export function StewardList({ stewards }: StewardListProps) {
  const totalEarnings = stewards.reduce((acc, s) => acc + (s.totalEarnings || 0), 0);
  const totalPlots = stewards.reduce((acc, s) => acc + (s.totalPlots || 0), 0);
  const verifiedPlots = stewards.reduce((acc, s) => acc + (s.verifiedPlots || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold" data-testid="text-stewards-title">Stewards</h2>
        <p className="text-muted-foreground">Community bamboo stewards in the network</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stewards.length}</p>
                <p className="text-sm text-muted-foreground">Active Stewards</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-1/10">
                <TreePine className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPlots}</p>
                <p className="text-sm text-muted-foreground">{verifiedPlots} verified plots</p>
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
                <p className="text-2xl font-bold">₱{totalEarnings.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stewards.map((steward) => {
          const verificationProgress = steward.totalPlots 
            ? ((steward.verifiedPlots || 0) / steward.totalPlots) * 100 
            : 0;

          return (
            <Card key={steward.id} className="hover-elevate" data-testid={`steward-card-${steward.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {steward.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base" data-testid="text-steward-name">
                      {steward.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{steward.barangay}, {steward.province}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {steward.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{steward.phone}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-md bg-muted/50 text-center">
                    <p className="text-lg font-semibold text-chart-1">{steward.totalPlots || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Plots</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50 text-center">
                    <p className="text-lg font-semibold text-chart-3">
                      ₱{(steward.totalEarnings || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Earnings</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Verification Progress</span>
                    <span className="font-medium">{steward.verifiedPlots || 0}/{steward.totalPlots || 0}</span>
                  </div>
                  <Progress value={verificationProgress} className="h-1.5" />
                </div>

                {steward.totalEarnings && steward.totalEarnings > 5000 && (
                  <Badge variant="secondary" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Top Performer
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stewards.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">No stewards yet</h3>
          <p className="text-muted-foreground">Stewards will appear here once added</p>
        </div>
      )}
    </div>
  );
}
