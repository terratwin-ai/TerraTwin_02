import type { Plot, Steward } from "@shared/schema";
import { AgentChat } from "./AgentChat";

interface PlotPanelProps {
  children: React.ReactNode;
  plot: Plot;
  steward?: Steward;
}

export function PlotPanel({ children, plot, steward }: PlotPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      <div className="border-t shrink-0 bg-card">
        <AgentChat plot={plot} steward={steward} />
      </div>
    </div>
  );
}
