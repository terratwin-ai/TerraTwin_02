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
  Leaf,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Plot, Steward } from "@shared/schema";

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  return lines.map((line, lineIndex) => {
    const parts: (string | JSX.Element)[] = [];
    let remaining = line;
    let keyIndex = 0;
    
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(<strong key={`b-${lineIndex}-${keyIndex++}`}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }
    
    const isBullet = line.trim().startsWith('- ');
    if (isBullet) {
      return (
        <div key={lineIndex} className="flex gap-1.5 ml-1">
          <span className="text-muted-foreground">•</span>
          <span>{parts.slice(1).length > 0 ? parts.map((p, i) => typeof p === 'string' ? p.replace(/^- /, '') : p) : line.replace(/^- /, '')}</span>
        </div>
      );
    }
    
    return (
      <span key={lineIndex}>
        {parts}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
}

interface FloatingChatPanelProps {
  plot: Plot;
  steward?: Steward;
  onQueryResult?: (result: QueryResult) => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  data?: EmbeddedData;
}

interface EmbeddedData {
  type: "stats" | "chart" | "table" | "highlight";
  title?: string;
  values?: Record<string, string | number>;
  items?: Array<{ label: string; value: string | number }>;
}

interface QueryResult {
  action: "filter" | "highlight" | "zoom";
  criteria?: string;
  plotIds?: string[];
}

export function FloatingChatPanel({ plot, steward, onQueryResult }: FloatingChatPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentPlotId = useRef<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createConversationMutation = useMutation({
    mutationFn: async (plotData: { title: string; plotId: string }) => {
      const res = await apiRequest("POST", "/api/conversations", plotData);
      return res.json();
    },
    onSuccess: (data) => {
      setConversationId(data.id);
      setMessages([]);
    },
  });

  useEffect(() => {
    if (plot.id !== currentPlotId.current) {
      currentPlotId.current = plot.id;
      createConversationMutation.mutate({
        title: `Plot: ${plot.name}`,
        plotId: plot.id,
      });
    }
  }, [plot.id, plot.name]);

  function parseQueryIntent(query: string): QueryResult | null {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("show") && lowerQuery.includes("low ndvi")) {
      return { action: "filter", criteria: "low_ndvi" };
    }
    if (lowerQuery.includes("highlight") || lowerQuery.includes("mark")) {
      return { action: "highlight", plotIds: [plot.id] };
    }
    if (lowerQuery.includes("zoom") || lowerQuery.includes("focus")) {
      return { action: "zoom", plotIds: [plot.id] };
    }
    return null;
  }

  function generateEmbeddedData(query: string): EmbeddedData | undefined {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("carbon") || lowerQuery.includes("sequester")) {
      return {
        type: "stats",
        title: "Carbon Metrics",
        values: {
          "Annual Rate": `${(plot.areaHectares * 8.75).toFixed(1)} t CO2e`,
          "Total Stock": `${plot.carbonTons?.toFixed(1) || 0} tons`,
          "Credit Value": `$${((plot.carbonTons || 0) * 30).toFixed(0)}`
        }
      };
    }
    
    if (lowerQuery.includes("health") || lowerQuery.includes("ndvi") || lowerQuery.includes("vegetation")) {
      const healthScore = plot.healthScore ?? 0;
      return {
        type: "stats",
        title: "Vegetation Health",
        values: {
          "Health Score": `${healthScore}%`,
          "Status": healthScore >= 75 ? "Dense" : healthScore >= 50 ? "Moderate" : "Low",
          "Trend": "Stable"
        }
      };
    }
    
    if (lowerQuery.includes("income") || lowerQuery.includes("earn") || lowerQuery.includes("money")) {
      const carbonIncome = (plot.areaHectares * 8.75 * 30 * 2).toFixed(0);
      const poleIncome = (plot.areaHectares * 150 * 10 * 12).toFixed(0);
      return {
        type: "stats",
        title: "Income Projections",
        values: {
          "Carbon Credits": `$${carbonIncome}`,
          "Pole Harvest": `$${poleIncome}`,
          "Total (2yr)": `$${(parseInt(carbonIncome) + parseInt(poleIncome)).toLocaleString()}`
        }
      };
    }
    
    return undefined;
  }

  async function sendMessage() {
    if (!input.trim() || isStreaming || !conversationId) return;

    const userMessage = input.trim();
    setInput("");
    
    const queryResult = parseQueryIntent(userMessage);
    if (queryResult && onQueryResult) {
      onQueryResult(queryResult);
    }
    
    const embeddedData = generateEmbeddedData(userMessage);
    
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);
    setIsExpanded(true);

    const contextPrompt = `You are TerraTwin AI, an expert assistant for bamboo stewardship verification in the Philippines. You help users explore and analyze bamboo plots conversationally.
    
Current Plot Context:
- Plot Name: ${plot.name}
- Location: ${plot.latitude.toFixed(4)}°N, ${plot.longitude.toFixed(4)}°E
- Area: ${plot.areaHectares.toFixed(2)} hectares
- Clump Count: ${plot.clumpCount || 0}
- Health Score: ${plot.healthScore}%
- Carbon Sequestered: ${plot.carbonTons?.toFixed(1) || 0} tons
- Verification Status: ${plot.status}
${steward ? `- Steward: ${steward.name} from ${steward.barangay}, ${steward.province}` : ""}

User Question: ${userMessage}

Provide helpful, concise guidance. Be conversational and practical. If the user asks about data, reference specific numbers from the plot.`;

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contextPrompt }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "", data: embeddedData }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        let isDone = false;
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                isDone = true;
                break;
              }
              if (data.content) {
                assistantMessage += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                    data: embeddedData,
                  };
                  return newMessages;
                });
              }
            } catch {}
          }
        }
        if (isDone) break;
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsStreaming(false);
    }
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
        className="fixed bottom-4 right-4 md:bottom-4 md:left-4 md:right-auto z-50 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90"
        data-testid="button-open-chat"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto transition-all duration-300 ease-out w-full md:w-[380px] z-50"
      style={{ maxHeight: "500px" }}
      data-testid="floating-chat-panel"
    >
      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden max-h-[500px] flex flex-col !rounded-b-none md:!rounded-b-xl">
        <CardHeader className="p-3 border-b flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">TerraTwin AI</p>
              <p className="text-xs text-muted-foreground">Ask about plots, carbon, or trends</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="button-toggle-expand"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMinimized(true)}
              data-testid="button-minimize-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {isExpanded && messages.length > 0 && (
          <div 
            className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent" 
            ref={scrollRef}
          >
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className="space-y-2">
                  <div
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`chat-message-${msg.role}-${i}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.content ? (
                        <div className="whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                  
                  {msg.data && msg.role === "assistant" && (
                    <div className="ml-8">
                      <Card className="bg-background/50 border-border/30">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {msg.data.type === "stats" && <BarChart3 className="h-3.5 w-3.5 text-primary" />}
                            <span className="text-xs font-medium">{msg.data.title}</span>
                          </div>
                          {msg.data.values && (
                            <div className="grid grid-cols-3 gap-2">
                              {Object.entries(msg.data.values).map(([key, value]) => (
                                <div key={key} className="text-center">
                                  <p className="text-xs text-muted-foreground">{key}</p>
                                  <p className="text-sm font-medium">{value}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <CardContent className="p-3 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsExpanded(true)}
              placeholder="Ask about carbon, health, or search plots..."
              className="min-h-[44px] max-h-[100px] resize-none text-sm flex-1 bg-muted/50"
              disabled={isStreaming}
              data-testid="input-chat-message"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="h-11 w-11"
              data-testid="button-send-message"
            >
              {isStreaming ? (
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
                onClick={() => { setInput("What's the carbon potential?"); setIsExpanded(true); }}
              >
                <Leaf className="h-3 w-3 mr-1" />
                Carbon potential
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover-elevate text-xs"
                onClick={() => { setInput("Show vegetation health"); setIsExpanded(true); }}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Vegetation health
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover-elevate text-xs"
                onClick={() => { setInput("Projected earnings?"); setIsExpanded(true); }}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Earnings
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
