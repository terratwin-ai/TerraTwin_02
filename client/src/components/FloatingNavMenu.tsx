import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  Map, 
  TreePine, 
  Users, 
  CheckCircle,
  FolderKanban,
  LogOut,
  Satellite
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import logoImage from "@/assets/terratwin-logo.png";

interface FloatingNavMenuProps {
  activeView: string;
  onViewChange: (view: string) => void;
  plotCount: number;
  stewardCount: number;
  onLogout: () => void;
  onOpenSatellite?: () => void;
}

const navItems = [
  { id: "landscape", label: "Landscape", icon: Map },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "plots", label: "Plots", icon: TreePine },
  { id: "stewards", label: "Stewards", icon: Users },
  { id: "verifications", label: "Verifications", icon: CheckCircle },
];

export function FloatingNavMenu({ 
  activeView, 
  onViewChange, 
  plotCount, 
  stewardCount,
  onLogout,
  onOpenSatellite
}: FloatingNavMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed top-4 left-4 z-50" data-testid="floating-nav-menu">
      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden w-fit">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 p-3 border-b">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="button-toggle-nav"
            >
              {isExpanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="TerraTwin" className="h-6 w-6" />
              <span className="font-semibold text-sm">TerraTwin</span>
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onLogout}
                title="Log out"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[200px]">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeView === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    onViewChange(item.id);
                    if (item.id === "landscape") {
                      setIsExpanded(false);
                    }
                  }}
                  data-testid={`nav-${item.id}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.id === "plots" && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {plotCount}
                    </Badge>
                  )}
                  {item.id === "stewards" && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {stewardCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}

          {!isExpanded && (
            <div className="px-3 py-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {plotCount} plots
              </Badge>
              {onOpenSatellite && activeView === "landscape" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 ml-auto"
                  onClick={onOpenSatellite}
                  data-testid="button-open-satellite"
                >
                  <Satellite className="h-3.5 w-3.5" />
                  <span className="text-xs">Satellite</span>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
