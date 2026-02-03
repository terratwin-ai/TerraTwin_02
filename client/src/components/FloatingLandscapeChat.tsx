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
  TreePine,
  Leaf,
  TrendingUp
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
}

export function FloatingLandscapeChat({ 
  plots, 
  onFilterPlots, 
  onHighlightPlot,
  onSelectPlot 
}: FloatingLandscapeChatProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/conversations", {
        title: "Landscape Analysis",
        plotId: plots[0]?.id || "landscape"
      });
      return res.json();
    },
    onSuccess: (data) => {
      setConversationId(data.id);
    },
  });

  useEffect(() => {
    if (!conversationId && plots.length > 0) {
      createConversationMutation.mutate();
    }
  }, [plots.length]);

  const totalHectares = plots.reduce((sum, p) => sum + p.areaHectares, 0);
  const totalCarbon = plots.reduce((sum, p) => sum + (p.carbonTons || 0), 0);
  const verifiedPlots = plots.filter(p => p.status === "verified").length;
  const avgHealth = plots.length > 0 
    ? Math.round(plots.reduce((sum, p) => sum + (p.healthScore || 0), 0) / plots.length)
    : 0;

  async function sendMessage() {
    if (!input.trim() || isStreaming || !conversationId) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    const contextPrompt = `You are TerraTwin AI, an expert assistant for bamboo stewardship and agroforestry in the Philippines, specifically for the Mt. Anggas region in Gitagum, Misamis Oriental.

Project Landscape Context:
- Total Project Area: 4,160 hectares (Mt. Anggas region)
- Active Plots: ${plots.length} registered bamboo plots
- Total Managed Area: ${totalHectares.toFixed(1)} hectares
- Carbon Sequestered: ${totalCarbon.toFixed(1)} tons CO2e
- Verified Plots: ${verifiedPlots} of ${plots.length}
- Average Health Score: ${avgHealth}%

Plot Details:
${plots.slice(0, 10).map(p => `- ${p.name}: ${p.areaHectares.toFixed(1)} ha, ${p.status}, ${p.healthScore}% health, ${(p.carbonTons || 0).toFixed(1)} tons CO2`).join('\n')}

User Question: ${userMessage}

Provide helpful, practical guidance about bamboo species selection, land management, carbon credits, stewardship practices, or the Mt. Anggas restoration project. Be concise but thorough.`;

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

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        data-testid="button-open-landscape-chat"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div 
      className="fixed bottom-6 left-6 z-50 transition-all duration-300 ease-out w-[380px]"
      style={{ maxHeight: "calc(100vh - 280px)" }}
      data-testid="floating-landscape-chat"
    >
      <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden flex flex-col max-h-[inherit]">
        <CardHeader className="p-3 border-b flex flex-row items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">TerraTwin AI</p>
              <p className="text-xs text-muted-foreground">Ask about bamboo & carbon</p>
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

        {isExpanded && (
          <>
            {messages.length === 0 && (
              <div className="p-3 space-y-3 flex-shrink-0">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <TreePine className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className="text-xs font-medium">{plots.length}</p>
                    <p className="text-[10px] text-muted-foreground">Plots</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <Leaf className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <p className="text-xs font-medium">{totalCarbon.toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">t CO2e</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                    <p className="text-xs font-medium">{avgHealth}%</p>
                    <p className="text-[10px] text-muted-foreground">Health</p>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Try asking:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Best bamboo species for Mindanao?",
                      "Carbon credit pricing",
                      "Plot verification process"
                    ].map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant="secondary"
                        className="cursor-pointer text-[10px] hover:bg-secondary/80"
                        onClick={() => setInput(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <ScrollArea className="flex-1 min-h-0 max-h-[300px] p-3" ref={scrollRef as any}>
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
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
                        {msg.content || (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <CardContent className="p-3 border-t flex-shrink-0">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about bamboo, carbon, land..."
                  className="min-h-[40px] max-h-[80px] resize-none text-sm"
                  disabled={isStreaming || !conversationId}
                  data-testid="input-landscape-chat"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming || !conversationId}
                  size="icon"
                  className="h-10 w-10 flex-shrink-0"
                  data-testid="button-send-landscape-chat"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
