import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  MapPin, 
  Users, 
  TreePine, 
  Leaf, 
  Calendar,
  FileText,
  Check,
  Clock,
  Circle,
  Building2,
  ExternalLink,
  Map
} from "lucide-react";
import type { Project, Steward, ProjectMilestone, ProjectDocument, Cooperative, Plot } from "@shared/schema";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom small circular marker
const plotIcon = L.divIcon({
  className: "plot-marker",
  html: `<div style="
    width: 12px;
    height: 12px;
    background: #10b981;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -8]
});

// Component to fit map bounds to markers
function FitBounds({ plots }: { plots: Plot[] }) {
  const map = useMap();
  
  if (plots.length > 0) {
    const bounds = L.latLngBounds(
      plots.map(p => [p.latitude, p.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
  }
  
  return null;
}

// Search result type
type SearchResult = {
  type: "plot" | "location";
  name: string;
  lat: number;
  lon: number;
  detail?: string;
};

// Search control component
function MapSearch({ plots }: { plots: Plot[] }) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    const searchResults: SearchResult[] = [];
    
    // Search plots first
    const matchingPlots = plots.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    matchingPlots.forEach(p => {
      searchResults.push({
        type: "plot",
        name: p.name,
        lat: p.latitude,
        lon: p.longitude,
        detail: `${p.areaHectares} ha • ${p.status}`
      });
    });
    
    // Search locations via Photon
    // Normalize query: expand common abbreviations
    const normalizedQuery = searchQuery
      .replace(/\bmt\.?\s*/gi, "Mount ")
      .replace(/\bst\.?\s*/gi, "Saint ")
      .trim();
    
    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(normalizedQuery)}&limit=5&lat=8.0&lon=125.0&location_bias_scale=0.5`
      );
      const data = await response.json();
      const phResults = (data.features || [])
        .filter((loc: { properties: { country?: string } }) => loc.properties?.country === "Philippines")
        .slice(0, 3);
      
      phResults.forEach((loc: { properties: { name: string; city?: string; state?: string }; geometry: { coordinates: number[] } }) => {
        const props = loc.properties;
        const coords = loc.geometry.coordinates;
        searchResults.push({
          type: "location",
          name: props.name,
          lat: coords[1],
          lon: coords[0],
          detail: [props.city, props.state].filter(Boolean).join(", ")
        });
      });
    } catch (error) {
      console.error("Location search failed:", error);
    }
    
    setResults(searchResults);
    setShowResults(true);
    setIsSearching(false);
  };

  const selectResult = (result: SearchResult) => {
    map.flyTo([result.lat, result.lon], result.type === "plot" ? 15 : 14, { duration: 1.5 });
    setShowResults(false);
    setQuery(result.name);
  };

  return (
    <div className="absolute top-3 right-3 z-[1000]" data-testid="map-search">
      <div className="flex gap-1">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search plots..."
          className="px-3 py-1.5 text-sm bg-background/95 border border-border rounded-md w-40 md:w-56 focus:outline-none focus:ring-1 focus:ring-primary"
          data-testid="input-map-search"
        />
        {isSearching && (
          <span className="absolute right-2 top-2 text-xs text-muted-foreground">...</span>
        )}
      </div>
      {showResults && results.length > 0 && (
        <div className="mt-1 bg-background/95 border border-border rounded-md shadow-lg max-h-48 overflow-y-auto" data-testid="search-results">
          {results.map((result, i) => (
            <button
              key={i}
              onClick={() => selectResult(result)}
              className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-start gap-2 border-b border-border last:border-0"
              data-testid={`search-result-${i}`}
            >
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground mt-0.5">
                {result.type === "plot" ? "Plot" : "Map"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{result.name}</p>
                {result.detail && (
                  <p className="text-xs text-muted-foreground truncate">{result.detail}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", id],
  });

  const { data: stewards = [] } = useQuery<Steward[]>({
    queryKey: ["/api/projects", id, "stewards"],
  });

  const { data: milestones = [] } = useQuery<ProjectMilestone[]>({
    queryKey: ["/api/projects", id, "milestones"],
  });

  const { data: documents = [] } = useQuery<ProjectDocument[]>({
    queryKey: ["/api/projects", id, "documents"],
  });

  const { data: cooperatives = [] } = useQuery<Cooperative[]>({
    queryKey: ["/api/projects", id, "cooperatives"],
  });

  const { data: plots = [] } = useQuery<Plot[]>({
    queryKey: ["/api/projects", id, "plots"],
  });

  if (projectLoading || !project) {
    return (
      <div className="p-6 h-full overflow-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const methodologyColors: Record<string, string> = {
    "verra-bamboo": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    "gold-standard": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    verified: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };

  const sortedMilestones = [...milestones].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  const sortedDocuments = [...documents].sort((a, b) => 
    new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
  );

  return (
    <div className="p-3 md:p-6 h-full overflow-auto" data-testid="project-detail">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        <div className="flex items-start gap-3 flex-wrap">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate" data-testid="text-project-name">{project.name}</h1>
            <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-project-description">{project.description}</p>
            <div className="flex gap-2 mt-2">
              <Badge className={statusColors[project.status] || statusColors.active} data-testid="badge-status">
                {project.status}
              </Badge>
              <Badge className={methodologyColors[project.methodology || "verra-bamboo"]} data-testid="badge-methodology">
                {project.methodology === "gold-standard" ? "Gold Standard" : "Verra"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <StatCard
            icon={<MapPin className="h-5 w-5" />}
            label="Total Area"
            value={`${project.totalHectares?.toFixed(1) || 0} ha`}
            testId="stat-area"
          />
          <StatCard
            icon={<TreePine className="h-5 w-5" />}
            label="Plots"
            value={project.totalPlots?.toString() || "0"}
            testId="stat-plots"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Stewards"
            value={project.totalStewards?.toString() || "0"}
            testId="stat-stewards"
          />
          <StatCard
            icon={<Leaf className="h-5 w-5" />}
            label="Carbon Sequestered"
            value={`${project.totalCarbonTons?.toFixed(1) || 0} tCO2e`}
            testId="stat-carbon"
          />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full overflow-x-auto flex" data-testid="tabs-list">
            <TabsTrigger value="overview" className="flex-1 text-xs md:text-sm" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1 text-xs md:text-sm" data-testid="tab-timeline">Timeline</TabsTrigger>
            <TabsTrigger value="documents" className="flex-1 text-xs md:text-sm" data-testid="tab-documents">Docs</TabsTrigger>
            <TabsTrigger value="stewards" className="flex-1 text-xs md:text-sm" data-testid="tab-stewards">Stewards</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            {/* Map showing all plot locations */}
            <Card data-testid="card-plot-map">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Plot Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {plots.length > 0 ? (
                  <div className="h-[300px] rounded-lg overflow-hidden relative" data-testid="map-container">
                    <MapContainer
                      center={[plots[0]?.latitude || 8.5, plots[0]?.longitude || 124.6]}
                      zoom={10}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      />
                      <MapSearch plots={plots} />
                      <FitBounds plots={plots} />
                      {plots.map((plot) => (
                        <Marker 
                          key={plot.id} 
                          position={[plot.latitude, plot.longitude]}
                          icon={plotIcon}
                        >
                          <Popup>
                            <div className="text-sm">
                              <p className="font-medium">{plot.name}</p>
                              <p className="text-muted-foreground">{plot.areaHectares} ha</p>
                              <Badge variant={plot.status === "verified" ? "default" : "secondary"} className="mt-1">
                                {plot.status}
                              </Badge>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No plots to display</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Project Plots
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {plots.map((plot) => (
                      <div 
                        key={plot.id} 
                        className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg"
                        data-testid={`plot-item-${plot.id}`}
                      >
                        <div>
                          <p className="font-medium" data-testid={`text-plot-name-${plot.id}`}>{plot.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {plot.areaHectares} ha • {plot.clumpCount} clumps
                          </p>
                        </div>
                        <Badge 
                          variant={plot.status === "verified" ? "default" : "secondary"}
                          data-testid={`badge-plot-status-${plot.id}`}
                        >
                          {plot.status}
                        </Badge>
                      </div>
                    ))}
                    {plots.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No plots assigned yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Cooperatives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cooperatives.map((coop) => (
                      <div 
                        key={coop.id} 
                        className="p-4 border rounded-lg"
                        data-testid={`coop-item-${coop.id}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="font-medium" data-testid={`text-coop-name-${coop.id}`}>{coop.name}</h4>
                          <Badge variant="outline">{coop.memberCount} members</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{coop.region}</p>
                        {coop.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{coop.notes}</p>
                        )}
                      </div>
                    ))}
                    {cooperatives.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No cooperatives yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Credit Issuance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Credits Issued</p>
                    <p className="text-lg md:text-2xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-credits-issued">
                      {project.creditsIssued?.toFixed(1) || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">tCO2e</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Credits Retired</p>
                    <p className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-credits-retired">
                      {project.creditsRetired?.toFixed(1) || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">tCO2e</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Vintage Year</p>
                    <p className="text-lg md:text-2xl font-bold" data-testid="text-vintage">
                      {project.vintage || "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {sortedMilestones.map((milestone, index) => (
                    <TimelineItem 
                      key={milestone.id} 
                      milestone={milestone} 
                      isLast={index === sortedMilestones.length - 1}
                    />
                  ))}
                  {sortedMilestones.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No milestones defined yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Submission date</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Title</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDocuments.map((doc) => (
                        <tr key={doc.id} className="border-b" data-testid={`doc-row-${doc.id}`}>
                          <td className="py-4 px-2 text-muted-foreground" data-testid={`text-doc-date-${doc.id}`}>
                            {doc.submittedAt ? format(new Date(doc.submittedAt), "d MMM yyyy") : "-"}
                          </td>
                          <td className="py-4 px-2 font-medium" data-testid={`text-doc-title-${doc.id}`}>
                            {doc.title}
                          </td>
                          <td className="py-4 px-2 text-right">
                            {doc.fileUrl ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-1" 
                                data-testid={`button-download-${doc.id}`}
                                asChild
                              >
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                  PDF <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm" data-testid={`text-no-file-${doc.id}`}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sortedDocuments.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No documents uploaded yet</p>
                  )}
                  {sortedDocuments.length > 0 && (
                    <div className="flex items-center justify-between gap-4 mt-4 text-sm text-muted-foreground">
                      <span data-testid="text-doc-count">Showing {sortedDocuments.length} of {sortedDocuments.length}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stewards" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Project Stewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stewards.map((steward) => (
                    <StewardCard key={steward.id} steward={steward} plots={plots} />
                  ))}
                  {stewards.length === 0 && (
                    <p className="text-muted-foreground text-center py-8 col-span-full">No stewards assigned yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  testId 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground" data-testid={`${testId}-label`}>{label}</p>
            <p className="text-lg font-semibold" data-testid={`${testId}-value`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineItem({ 
  milestone, 
  isLast 
}: { 
  milestone: ProjectMilestone; 
  isLast: boolean;
}) {
  const getStatusIcon = () => {
    switch (milestone.status) {
      case "completed":
        return <Check className="h-4 w-4 text-white" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-white" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  const getStatusBg = () => {
    switch (milestone.status) {
      case "completed":
        return "bg-emerald-500 dark:bg-emerald-600";
      case "in_progress":
        return "bg-amber-500 dark:bg-amber-600";
      default:
        return "bg-muted border-2 border-muted-foreground/30";
    }
  };

  const getDateLabel = () => {
    if (milestone.status === "completed" && milestone.completedAt) {
      return `Completed ${format(new Date(milestone.completedAt), "d MMM yyyy")}`;
    }
    if (milestone.dueDate) {
      const dueDate = new Date(milestone.dueDate);
      const quarter = Math.ceil((dueDate.getMonth() + 1) / 3);
      return `Expected Q${quarter} ${dueDate.getFullYear()}`;
    }
    return "";
  };

  return (
    <div className="flex gap-4" data-testid={`milestone-item-${milestone.id}`}>
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusBg()}`}>
          {getStatusIcon()}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[60px] ${milestone.status === "completed" ? "bg-emerald-300 dark:bg-emerald-700" : "bg-muted-foreground/20"}`} />
        )}
      </div>
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <span className="text-sm text-muted-foreground" data-testid={`text-milestone-date-${milestone.id}`}>
            {getDateLabel()}
          </span>
          {milestone.status === "in_progress" && (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" data-testid={`badge-milestone-status-${milestone.id}`}>
              IN PROGRESS
            </Badge>
          )}
        </div>
        <h4 className="font-semibold text-lg" data-testid={`text-milestone-title-${milestone.id}`}>{milestone.title}</h4>
        {milestone.description && (
          <p className="text-muted-foreground mt-1" data-testid={`text-milestone-desc-${milestone.id}`}>{milestone.description}</p>
        )}
      </div>
    </div>
  );
}

function StewardCard({ 
  steward, 
  plots 
}: { 
  steward: Steward; 
  plots: Plot[];
}) {
  const stewardPlots = plots.filter(p => p.stewardId === steward.id);
  const totalHectares = stewardPlots.reduce((sum, p) => sum + (p.areaHectares || 0), 0);

  return (
    <Card className="hover-elevate" data-testid={`steward-card-${steward.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold" data-testid={`text-steward-name-${steward.id}`}>{steward.name}</h4>
            <p className="text-sm text-muted-foreground">{steward.barangay}, {steward.province}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <TreePine className="h-3 w-3" />
                {stewardPlots.length} plots
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {totalHectares.toFixed(1)} ha
              </span>
            </div>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-2" data-testid={`text-steward-earnings-${steward.id}`}>
              ₱{(steward.totalEarnings || 0).toLocaleString()} earned
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
