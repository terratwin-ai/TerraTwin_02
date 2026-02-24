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
  projectCount: number;
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
  projectCount,
  onLogout,
  onOpenSatellite,
  onSearch
}: FloatingNavMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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
    <div className="fixed top-0 left-0 right-0 md:right-auto md:top-4 md:left-4 z-50" data-testid="floating-nav-menu">
      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden w-full md:w-[380px] !rounded-none md:!rounded-xl">
        <CardContent className="p-0">
          {/* Header row - compact on mobile */}
          <div className="flex items-center gap-2 px-2 py-1.5 md:p-3 md:border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsExpanded(!isExpanded);
                if (isExpanded) setShowMobileSearch(false);
              }}
              data-testid="button-toggle-nav"
            >
              {isExpanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center gap-1.5">
              <img src={logoImage} alt="TerraTwin" className="h-5 w-5 md:h-6 md:w-6" />
              <span className="font-semibold text-sm">TerraTwin</span>
            </div>

            <div className="flex items-center gap-0.5 ml-auto">
              {/* Mobile-only: compact action icons */}
              <div className="flex items-center md:hidden">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1.5" />
                {onSearch && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowMobileSearch(!showMobileSearch);
                      setIsExpanded(false);
                    }}
                    data-testid="button-toggle-search-mobile"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
                {onOpenSatellite && activeView === "landscape" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenSatellite}
                    data-testid="button-open-satellite-mobile"
                  >
                    <Satellite className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                title="Log out"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile search bar - toggled by search icon */}
          {showMobileSearch && !isExpanded && (
            <div className="px-2 pb-2 md:hidden animate-in fade-in slide-in-from-top-1 duration-150">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search plots..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-8 pl-8 text-sm bg-muted/50"
                  autoFocus
                  data-testid="input-search-plots-mobile"
                />
              </form>
            </div>
          )}

          {/* Expanded nav menu */}
          {isExpanded && (
            <div className="p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeView === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    onViewChange(item.id);
                    setIsExpanded(false);
                  }}
                  data-testid={`nav-${item.id}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.id === "projects" && (
                    <Badge variant="outline" className="ml-auto text-xs" data-testid="badge-project-count">
                      {projectCount}
                    </Badge>
                  )}
                  {item.id === "plots" && (
                    <Badge variant="outline" className="ml-auto text-xs" data-testid="badge-plot-count">
                      {plotCount}
                    </Badge>
                  )}
                  {item.id === "stewards" && (
                    <Badge variant="outline" className="ml-auto text-xs" data-testid="badge-steward-count">
                      {stewardCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}

          {/* Desktop-only: info row + search (always visible when not expanded) */}
          {!isExpanded && (
            <div className="hidden md:block px-3 py-2 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
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
