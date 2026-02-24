import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Plot, Steward } from "@shared/schema";
import ReactMarkdown from "react-markdown";

interface AgentChatProps {
  plot: Plot;
  steward?: Steward;
  existingConversationId?: number | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AgentChat({ plot, steward, existingConversationId }: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(existingConversationId || null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentPlotId = useRef<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const { data: existingConvData, isLoading: isLoadingConv } = useQuery<{ messages: { role: string; content: string }[] }>({
    queryKey: [`/api/conversations/${existingConversationId}`],
    enabled: !!existingConversationId,
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (existingConvData?.messages && existingConvData.messages.length > 0) {
      const loaded: ChatMessage[] = existingConvData.messages
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content.replace(/^You are TerraTwin AI[\s\S]*?User Question: /m, ""),
        }));
      setMessages(loaded);
    }
  }, [existingConvData]);

  const createConversationMutation = useMutation({
    mutationFn: async (plotData: { title: string; plotId: string; stewardId?: string }) => {
      const res = await apiRequest("POST", "/api/conversations", plotData);
      return res.json();
    },
    onSuccess: (data) => {
      setConversationId(data.id);
      setMessages([]);
    },
  });

  useEffect(() => {
    if (existingConversationId) {
      setConversationId(existingConversationId);
      return;
    }
    if (plot.id !== currentPlotId.current) {
      currentPlotId.current = plot.id;
      const stewardId = localStorage.getItem("stewardId");
      createConversationMutation.mutate({
        title: `Plot: ${plot.name}`,
        plotId: plot.id,
        ...(stewardId ? { stewardId } : {}),
      });
    }
  }, [plot.id, plot.name, existingConversationId]);

  async function sendMessage() {
    if (!input.trim() || isStreaming || !conversationId) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    const contextPrompt = `You are TerraTwin AI, an expert assistant for bamboo stewardship verification in the Philippines.
    
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

Provide helpful, concise guidance about plot management, verification processes, carbon tracking, or steward earnings. Be friendly and practical.`;

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

  return (
    <div className="flex flex-col w-full h-full">
      <ScrollArea className="flex-1 p-3" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Ask me anything about this plot
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
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
                    msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:my-1.5 [&_h2]:my-1 [&_h3]:my-1 [&_code]:text-xs [&_pre]:text-xs [&_pre]:my-1 [&_pre]:p-2 [&_pre]:rounded [&_blockquote]:my-1 [&_blockquote]:pl-2 [&_blockquote]:border-l-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )
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
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="flex gap-2 w-full p-3 border-t">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this plot..."
          className="min-h-[40px] max-h-[100px] resize-none text-sm flex-1"
          disabled={isStreaming}
          data-testid="input-chat-message"
        />
        <Button
          size="icon"
          onClick={sendMessage}
          disabled={!input.trim() || isStreaming}
          data-testid="button-send-message"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
