import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FolderKanban, 
  Users, 
  TreePine, 
  Leaf, 
  Calendar,
  TrendingUp,
  MapPin,
  ChevronRight
} from "lucide-react";
import type { Project } from "@shared/schema";
import { format } from "date-fns";

export function ProjectList() {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  if (isLoading) {
    return (
      <div className="p-6 h-full overflow-auto">
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const totalCreditsIssued = projects.reduce((acc, p) => acc + (p.creditsIssued || 0), 0);
  const totalCreditsRetired = projects.reduce((acc, p) => acc + (p.creditsRetired || 0), 0);
  const totalHectares = projects.reduce((acc, p) => acc + (p.totalHectares || 0), 0);
  const totalStewards = projects.reduce((acc, p) => acc + (p.totalStewards || 0), 0);

  return (
    <div className="p-6 h-full overflow-auto" data-testid="projects-list">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-projects-title">
              <FolderKanban className="h-6 w-6" />
              Projects
            </h1>
            <p className="text-muted-foreground mt-1">
              Aggregating smallholder plots for carbon credit issuance
            </p>
          </div>
          <Badge variant="secondary" className="text-sm" data-testid="badge-projects-count">
            {projects.length} projects
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Leaf className="h-5 w-5" />}
            label="Credits Issued"
            value={`${totalCreditsIssued.toFixed(1)} tCO2e`}
            color="text-emerald-600 dark:text-emerald-400"
            testId="stat-credits-issued"
          />
          <SummaryCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Credits Retired"
            value={`${totalCreditsRetired.toFixed(1)} tCO2e`}
            color="text-blue-600 dark:text-blue-400"
            testId="stat-credits-retired"
          />
          <SummaryCard
            icon={<MapPin className="h-5 w-5" />}
            label="Total Area"
            value={`${totalHectares.toFixed(1)} ha`}
            color="text-amber-600 dark:text-amber-400"
            testId="stat-total-area"
          />
          <SummaryCard
            icon={<Users className="h-5 w-5" />}
            label="Stewards"
            value={totalStewards.toString()}
            color="text-purple-600 dark:text-purple-400"
            testId="stat-total-stewards"
          />
        </div>

        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={color}>{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground" data-testid={`${testId}-label`}>{label}</p>
            <p className="text-lg font-semibold" data-testid={`${testId}-value`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const creditsProgress = project.creditsIssued && project.totalCarbonTons
    ? (project.creditsIssued / project.totalCarbonTons) * 100
    : 0;

  const methodologyColors: Record<string, string> = {
    "verra-bamboo": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    "gold-standard": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    verified: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover-elevate cursor-pointer" data-testid={`project-card-${project.id}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg" data-testid={`text-project-name-${project.id}`}>
                  {project.name}
                </CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-1" data-testid={`text-project-description-${project.id}`}>
                {project.description}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Badge className={statusColors[project.status] || statusColors.active} data-testid={`badge-status-${project.id}`}>
                {project.status}
              </Badge>
              <Badge className={methodologyColors[project.methodology || "verra-bamboo"] || methodologyColors["verra-bamboo"]} data-testid={`badge-methodology-${project.id}`}>
                {project.methodology === "gold-standard" ? "Gold Standard" : "Verra"}
              </Badge>
            </div>
          </div>
        </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <Stat
            icon={<MapPin className="h-4 w-4" />}
            label="Region"
            value={project.region}
            testId={`stat-region-${project.id}`}
          />
          <Stat
            icon={<TreePine className="h-4 w-4" />}
            label="Plots"
            value={`${project.totalPlots} (${project.totalHectares?.toFixed(1)} ha)`}
            testId={`stat-plots-${project.id}`}
          />
          <Stat
            icon={<Users className="h-4 w-4" />}
            label="Stewards"
            value={project.totalStewards?.toString() || "0"}
            testId={`stat-stewards-${project.id}`}
          />
          <Stat
            icon={<Leaf className="h-4 w-4" />}
            label="Carbon"
            value={`${project.totalCarbonTons?.toFixed(1) || 0} t`}
            testId={`stat-carbon-${project.id}`}
          />
          <Stat
            icon={<Calendar className="h-4 w-4" />}
            label="Vintage"
            value={project.vintage?.toString() || "-"}
            testId={`stat-vintage-${project.id}`}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground" data-testid={`text-progress-label-${project.id}`}>Credits Issuance Progress</span>
            <span className="font-medium" data-testid={`text-progress-value-${project.id}`}>
              {project.creditsIssued?.toFixed(1) || 0} / {project.totalCarbonTons?.toFixed(1) || 0} tCO2e
            </span>
          </div>
          <Progress value={creditsProgress} className="h-2" data-testid={`progress-credits-${project.id}`} />
        </div>

        {project.startDate && (
          <p className="text-xs text-muted-foreground mt-3" data-testid={`text-start-date-${project.id}`}>
            Started {format(new Date(project.startDate), "MMMM d, yyyy")}
          </p>
        )}
      </CardContent>
      </Card>
    </Link>
  );
}

function Stat({
  icon,
  label,
  value,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <div className="flex items-center gap-2" data-testid={testId}>
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground" data-testid={`${testId}-label`}>{label}</p>
        <p className="text-sm font-medium" data-testid={`${testId}-value`}>{value}</p>
      </div>
    </div>
  );
}
