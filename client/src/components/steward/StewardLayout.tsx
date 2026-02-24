import { useLocation } from "wouter";
import { Home, Camera, Wallet, Zap, Users, Map, LogOut, Leaf } from "lucide-react";

interface StewardLayoutProps {
  children: React.ReactNode;
  activeTab: "home" | "map" | "capture" | "intent" | "community" | "earnings";
}

export function StewardLayout({ children, activeTab }: StewardLayoutProps) {
  const [, setLocation] = useLocation();
  const stewardName = localStorage.getItem("stewardName") || "Steward";

  const handleLogout = () => {
    localStorage.removeItem("stewardId");
    localStorage.removeItem("stewardName");
    setLocation("/steward");
  };

  const tabs = [
    { id: "home", label: "Plots", icon: Home, path: "/steward/home" },
    { id: "map", label: "Map", icon: Map, path: "/steward/map" },
    { id: "capture", label: "Capture", icon: Camera, path: "/steward/capture" },
    { id: "community", label: "Community", icon: Users, path: "/steward/community" },
    { id: "earnings", label: "Earnings", icon: Wallet, path: "/steward/earnings" },
  ];

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md bg-background flex flex-col min-h-screen shadow-2xl relative">
        <header className="p-3 border-b bg-card/50 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Leaf className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">TerraTwin</p>
            <p className="text-xs text-muted-foreground">{stewardName}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-muted-foreground hover:text-foreground"
          data-testid="button-logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

        <nav className="absolute bottom-0 left-0 right-0 bg-card border-t z-20">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setLocation(tab.path)}
                  className={`flex-1 flex flex-col items-center py-3 gap-1 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
