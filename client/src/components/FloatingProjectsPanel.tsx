import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  Search, 
  Leaf, 
  TrendingUp, 
  MapPin, 
  TreePine, 
  Users,
  Calendar,
  ChevronRight
} from "lucide-react";
import type { Project } from "@shared/schema";

interface FloatingProjectsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
}

export function FloatingProjectsPanel({ 
  isOpen, 
  onClose,
  onSelectProject 
}: FloatingProjectsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.region?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totals = projects.reduce((acc, p) => ({
    creditsIssued: acc.creditsIssued + Number(p.creditsIssued || 0),
    creditsRetired: acc.creditsRetired + Number(p.creditsRetired || 0),
    totalHectares: acc.totalHectares + Number(p.totalHectares || 0),
    totalStewards: acc.totalStewards + (p.totalStewards || 0),
  }), { creditsIssued: 0, creditsRetired: 0, totalHectares: 0, totalStewards: 0 });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:top-4 md:right-6 z-40 w-full md:w-[380px] max-h-[75vh] md:max-h-[calc(100vh-280px)] overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-right-4 duration-300"
      data-testid="floating-projects-panel"
    >
      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl h-full flex flex-col !rounded-b-none md:!rounded-b-xl">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Projects</CardTitle>
              <Badge variant="outline" className="text-xs">
                {projects.length} projects
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
              data-testid="button-close-projects"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Aggregating smallholder plots for carbon credit issuance
          </p>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-500/10 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs mb-1">
                <Leaf className="h-3 w-3" />
                <span>Credits Issued</span>
              </div>
              <div className="text-lg font-bold">{totals.creditsIssued.toFixed(1)} tCO2e</div>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-1">
                <TreePine className="h-3 w-3" />
                <span>Plots</span>
              </div>
              <div className="text-lg font-bold">{projects.reduce((sum, p) => sum + (p.totalPlots || 0), 0)}</div>
            </div>
            <div className="bg-sky-500/10 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-sky-400 text-xs mb-1">
                <MapPin className="h-3 w-3" />
                <span>Total Area</span>
              </div>
              <div className="text-lg font-bold">{totals.totalHectares.toFixed(1)} ha</div>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs mb-1">
                <Users className="h-3 w-3" />
                <span>Stewards</span>
              </div>
              <div className="text-lg font-bold">{totals.totalStewards}</div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50"
              data-testid="input-search-projects"
            />
          </div>

          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className="bg-background/50 hover-elevate cursor-pointer"
                onClick={() => onSelectProject(project.id)}
                data-testid={`card-project-${project.id}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{project.name}</h3>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        {project.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30 capitalize">
                        {project.methodology?.replace("-", " ")}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{project.region}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TreePine className="h-3 w-3 text-emerald-400" />
                      <span>{project.totalPlots} ({project.totalHectares} ha)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-sky-400" />
                      <span>{project.totalStewards}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-purple-400" />
                      <span>{project.vintage}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Credits Issuance</span>
                      <span>{Number(project.creditsIssued || 0).toFixed(1)} / {Number(project.totalCarbonTons || 0).toFixed(1)} tCO2e</span>
                    </div>
                    <Progress 
                      value={project.totalCarbonTons ? (Number(project.creditsIssued) / Number(project.totalCarbonTons)) * 100 : 0} 
                      className="h-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
