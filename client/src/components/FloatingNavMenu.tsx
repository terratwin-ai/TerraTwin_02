import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Menu, 
  X, 
  Map, 
  TreePine, 
  Users, 
  CheckCircle,
  FolderKanban,
  LogOut,
  Satellite,
  Search,
  MapPin
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
  onSearch?: (query: string) => void;
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
  onOpenSatellite,
  onSearch
}: FloatingNavMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (onSearch) {
      if (value.trim()) {
        onSearch(value.trim());
      } else {
        onSearch("");
      }
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50" data-testid="floating-nav-menu">
      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden w-[380px]">
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
            <div className="px-3 py-2 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>Mt. Anggas, Mindanao</span>
                </div>
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
              
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search plots..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-8 pl-8 text-sm bg-muted/50"
                  data-testid="input-search-plots"
                />
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
