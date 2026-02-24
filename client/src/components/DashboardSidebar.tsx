import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Map, 
  TreePine, 
  Users, 
  CheckCircle, 
  TrendingUp,
  Leaf,
  DollarSign,
  FolderKanban
} from "lucide-react";
import type { Plot, Steward } from "@shared/schema";
import logoImage from "@/assets/terratwin-logo.png";

interface DashboardSidebarProps {
  plots: Plot[];
  stewards: Steward[];
  selectedPlotId: string | null;
  onPlotSelect: (id: string) => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

export function DashboardSidebar({
  plots,
  stewards,
  selectedPlotId,
  onPlotSelect,
  activeView,
  onViewChange,
}: DashboardSidebarProps) {
  const verifiedPlots = plots.filter((p) => p.status === "verified").length;
  const pendingPlots = plots.filter((p) => p.status === "pending" || p.status === "submitted").length;
  const totalCarbonTons = plots.reduce((acc, p) => acc + (p.carbonTons || 0), 0);
  const totalClumps = plots.reduce((acc, p) => acc + (p.clumpCount || 0), 0);

  const navItems = [
    { id: "landscape", label: "Landscape View", icon: Map },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "plots", label: "My Plots", icon: TreePine },
    { id: "stewards", label: "Stewards", icon: Users },
    { id: "verifications", label: "Verifications", icon: CheckCircle },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-0">
        <div className="flex items-center gap-3 mb-3">
          <img src={logoImage} alt="TerraTwin" className="h-6 w-auto" />
          <h1 className="font-medium text-base tracking-wide text-sidebar-foreground lowercase">terratwin</h1>
        </div>
        <div className="h-0.5 w-full rounded-full" style={{ background: 'linear-gradient(90deg, #ef4444 0%, #f97316 25%, #fbbf24 50%, #84cc16 75%, #10b981 100%)' }} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.id)}
                    isActive={activeView === item.id}
                    data-testid={`nav-${item.id}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 space-y-3">
              <OverviewStat
                icon={<TreePine className="h-4 w-4" />}
                label="Total Plots"
                value={plots.length.toString()}
                subValue={`${verifiedPlots} verified`}
                progress={(verifiedPlots / Math.max(plots.length, 1)) * 100}
              />
              <OverviewStat
                icon={<Leaf className="h-4 w-4" />}
                label="Carbon Sequestered"
                value={`${totalCarbonTons.toFixed(1)}t`}
                subValue={`${totalClumps} clumps`}
              />
              <OverviewStat
                icon={<Users className="h-4 w-4" />}
                label="Active Stewards"
                value={stewards.length.toString()}
                subValue="across barangays"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Recent Plots</span>
            <Badge variant="secondary" className="text-xs">
              {pendingPlots} pending
            </Badge>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {plots.slice(0, 5).map((plot) => (
                <SidebarMenuItem key={plot.id}>
                  <SidebarMenuButton
                    onClick={() => onPlotSelect(plot.id)}
                    isActive={selectedPlotId === plot.id}
                    data-testid={`plot-item-${plot.id}`}
                  >
                    <StatusDot status={plot.status} />
                    <span className="truncate flex-1">{plot.name}</span>
                    <span className="text-xs text-sidebar-foreground/60">
                      {plot.clumpCount}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="p-3 rounded-lg bg-sidebar-accent">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-sidebar-accent-foreground" />
            <span className="text-sm font-medium text-sidebar-accent-foreground">
              This Month
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <DollarSign className="h-4 w-4 text-sidebar-primary" />
            <span className="text-2xl font-bold text-sidebar-foreground">
              ₱{(totalCarbonTons * 400).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-sidebar-foreground/70 mt-1">
            Estimated carbon value
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function OverviewStat({
  icon,
  label,
  value,
  subValue,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  progress?: number;
}) {
  return (
    <div className="p-3 rounded-lg bg-sidebar-accent/50">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sidebar-primary">{icon}</span>
        <span className="text-xs text-sidebar-foreground/70">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xl font-semibold text-sidebar-foreground">{value}</span>
        <span className="text-xs text-sidebar-foreground/60">{subValue}</span>
      </div>
      {progress !== undefined && (
        <Progress value={progress} className="h-1 mt-2" />
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    verified: "bg-emerald-500",
    pending: "bg-amber-400",
    submitted: "bg-orange-500",
    under_review: "bg-red-500",
  };

  return (
    <span className={`w-2 h-2 rounded-full ${colorMap[status] || "bg-gray-500"}`} />
  );
}
