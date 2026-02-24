import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, MessageSquare, Bot, ChevronRight, ArrowLeft, Trash2
} from "lucide-react";
import { format } from "date-fns";
import type { Plot, Steward, Conversation, Message } from "@shared/schema";
import { AgentChat } from "@/components/AgentChat";

interface StewardChatListProps {
  plot: Plot;
  steward?: Steward;
}

export function StewardChatList({ plot, steward }: StewardChatListProps) {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const stewardId = localStorage.getItem("stewardId");

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", { plotId: plot.id }],
    queryFn: async () => {
      const res = await fetch(`/api/conversations?plotId=${plot.id}`);
      return res.json();
    },
  });

  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/conversations", {
        title: `${plot.name} - ${format(new Date(), "MMM d, yyyy h:mm a")}`,
        plotId: plot.id,
        stewardId: stewardId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", { plotId: plot.id }] });
      setActiveConversationId(data.id);
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", { plotId: plot.id }] });
    },
  });

  if (activeConversationId) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-3 border-b bg-card/50">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/conversations", { plotId: plot.id }] });
              queryClient.invalidateQueries({ queryKey: [`/api/conversations/${activeConversationId}`] });
              setActiveConversationId(null);
            }}
            data-testid="button-back-to-chats"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {conversations.find(c => c.id === activeConversationId)?.title || "Chat"}
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <AgentChat 
            plot={plot} 
            steward={steward} 
            existingConversationId={activeConversationId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Conversations</h3>
            {conversations.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {conversations.length}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => createConversation.mutate()}
            disabled={createConversation.isPending}
            data-testid="button-new-chat"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a new chat to ask questions about this plot,
                carbon tracking, or verification.
              </p>
            </div>
            <Button
              className="gap-1.5"
              onClick={() => createConversation.mutate()}
              disabled={createConversation.isPending}
              data-testid="button-start-first-chat"
            >
              <Plus className="h-4 w-4" />
              Start Your First Chat
            </Button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                onSelect={() => setActiveConversationId(conv.id)}
                onDelete={() => deleteConversation.mutate(conv.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function ConversationItem({ 
  conversation, 
  onSelect, 
  onDelete 
}: { 
  conversation: Conversation; 
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { data: convData } = useQuery<{ messages: Message[] }>({
    queryKey: [`/api/conversations/${conversation.id}`],
    staleTime: 0,
  });

  const messageCount = convData?.messages?.length || 0;
  const lastMessage = convData?.messages?.[convData.messages.length - 1];
  const preview = lastMessage?.content
    ? lastMessage.content.slice(0, 80) + (lastMessage.content.length > 80 ? "..." : "")
    : "No messages yet";

  return (
    <Card 
      className="border-border/50 cursor-pointer hover:bg-accent/50 transition-colors group"
      onClick={onSelect}
      data-testid={`conversation-item-${conversation.id}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{conversation.title}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {lastMessage?.role === "assistant" ? preview : 
               lastMessage?.role === "user" ? `You: ${preview}` : preview}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(conversation.createdAt), "MMM d, yyyy")}
              </span>
              {messageCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                  {messageCount} messages
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                data-testid={`button-delete-chat-${conversation.id}`}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
