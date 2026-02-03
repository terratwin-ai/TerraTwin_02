import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  MapPin,
  Filter,
  Search,
  TreePine,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import type { Plot } from "@shared/schema";

interface FloatingLandscapeChatProps {
  plots: Plot[];
  onFilterPlots: (filteredIds: string[] | null) => void;
  onHighlightPlot: (plotId: string | null) => void;
  onSelectPlot: (plotId: string) => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  plotResults?: Plot[];
}

export function FloatingLandscapeChat({ 
  plots, 
  onFilterPlots, 
  onHighlightPlot,
  onSelectPlot 
}: FloatingLandscapeChatProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function parseQuery(query: string): { action: string; results: Plot[] } {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("verified") || lowerQuery.includes("complete")) {
      const results = plots.filter(p => p.status === "verified");
      return { action: "filter_verified", results };
    }
    
    if (lowerQuery.includes("pending") || lowerQuery.includes("waiting")) {
      const results = plots.filter(p => p.status === "pending");
      return { action: "filter_pending", results };
    }
    
    if (lowerQuery.includes("low health") || lowerQuery.includes("poor health") || lowerQuery.includes("unhealthy")) {
      const results = plots.filter(p => (p.healthScore || 0) < 50);
      return { action: "filter_low_health", results };
    }
    
    if (lowerQuery.includes("high health") || lowerQuery.includes("healthy")) {
      const results = plots.filter(p => (p.healthScore || 0) >= 75);
      return { action: "filter_high_health", results };
    }
    
    if (lowerQuery.includes("largest") || lowerQuery.includes("biggest")) {
      const results = [...plots].sort((a, b) => b.areaHectares - a.areaHectares).slice(0, 5);
      return { action: "filter_largest", results };
    }
    
    if (lowerQuery.includes("most carbon") || lowerQuery.includes("highest carbon")) {
      const results = [...plots].sort((a, b) => (b.carbonTons || 0) - (a.carbonTons || 0)).slice(0, 5);
      return { action: "filter_carbon", results };
    }
    
    if (lowerQuery.includes("all plots") || lowerQuery.includes("show all") || lowerQuery.includes("reset")) {
      return { action: "show_all", results: plots };
    }

    const plotNameMatch = plots.find(p => 
      lowerQuery.includes(p.name.toLowerCase())
    );
    if (plotNameMatch) {
      return { action: "find_plot", results: [plotNameMatch] };
    }
    
    return { action: "unknown", results: [] };
  }

  function generateResponse(action: string, results: Plot[]): string {
    switch (action) {
      case "filter_verified":
        return `Found ${results.length} verified plots. These plots have completed the verification process and are actively generating carbon credits.`;
      case "filter_pending":
        return `Found ${results.length} plots pending verification. These are awaiting steward submission or review.`;
      case "filter_low_health":
        return `Found ${results.length} plots with health scores below 50%. These may need attention or intervention.`;
      case "filter_high_health":
        return `Found ${results.length} healthy plots with scores above 75%. These are performing well.`;
      case "filter_largest":
        return `Here are the 5 largest plots by area. The biggest is ${results[0]?.name} at ${results[0]?.areaHectares.toFixed(1)} hectares.`;
      case "filter_carbon":
        return `Here are the top 5 plots by carbon sequestration. ${results[0]?.name} leads with ${results[0]?.carbonTons?.toFixed(1) || 0} tons CO2e.`;
      case "show_all":
        return `Showing all ${results.length} plots. The filter has been cleared.`;
      case "find_plot":
        return `Found "${results[0]?.name}". Click on the result below to view details.`;
      default:
        return `I can help you search and filter plots. Try asking:\n• "Show verified plots"\n• "Find plots with low health"\n• "Show largest plots"\n• "Which plots have the most carbon?"`;
    }
  }

  async function sendMessage() {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsProcessing(true);
    setIsExpanded(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const { action, results } = parseQuery(userMessage);
    const response = generateResponse(action, results);

    if (action !== "unknown" && action !== "show_all") {
      onFilterPlots(results.map(p => p.id));
    } else if (action === "show_all") {
      onFilterPlots(null);
    }

    setMessages((prev) => [...prev, { 
      role: "assistant", 
      content: response,
      plotResults: results.length > 0 && results.length <= 10 ? results : undefined
    }]);
    setIsProcessing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (isMinimized) {
    return (
      <Button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        data-testid="button-open-landscape-chat"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out ${
        isExpanded ? "w-[420px]" : "w-[380px]"
      }`}
      data-testid="floating-landscape-chat"
    >
      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
        <CardHeader className="p-3 border-b flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Search & Filter</p>
              <p className="text-xs text-muted-foreground">Ask about plots, status, or carbon</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMinimized(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {isExpanded && messages.length > 0 && (
          <ScrollArea className="max-h-[350px] p-3" ref={scrollRef as any}>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className="space-y-2">
                  <div
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`px-3 py-2 rounded-lg text-sm max-w-[85%] whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                  
                  {msg.plotResults && msg.role === "assistant" && (
                    <div className="ml-8 space-y-1">
                      {msg.plotResults.map((plot) => (
                        <Button
                          key={plot.id}
                          variant="ghost"
                          className="w-full justify-start gap-2 h-auto py-2 px-3 bg-background/50"
                          onClick={() => onSelectPlot(plot.id)}
                        >
                          <TreePine className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium">{plot.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {plot.areaHectares.toFixed(1)} ha • {plot.healthScore}% health
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              plot.status === "verified" ? "border-emerald-500/50 text-emerald-500" :
                              plot.status === "pending" ? "border-amber-500/50 text-amber-500" :
                              "border-orange-500/50 text-orange-500"
                            }`}
                          >
                            {plot.status}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-muted text-sm">
                    Searching...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <CardContent className="p-3 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsExpanded(true)}
              placeholder="Search plots... e.g. 'Show verified plots'"
              className="min-h-[44px] max-h-[100px] resize-none text-sm flex-1 bg-muted/50"
              disabled={isProcessing}
              data-testid="input-landscape-search"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || isProcessing}
              className="h-11 w-11"
              data-testid="button-send-search"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {!isExpanded && (
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover-elevate text-xs"
                onClick={() => { setInput("Show verified plots"); setIsExpanded(true); }}
              >
                <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
                Verified
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover-elevate text-xs"
                onClick={() => { setInput("Show pending plots"); setIsExpanded(true); }}
              >
                <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                Pending
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover-elevate text-xs"
                onClick={() => { setInput("Show largest plots"); setIsExpanded(true); }}
              >
                <TreePine className="h-3 w-3 mr-1" />
                Largest
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover-elevate text-xs"
                onClick={() => { setInput("Show all plots"); setIsExpanded(true); }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear filter
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
