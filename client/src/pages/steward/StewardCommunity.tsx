import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StewardLayout } from "@/components/steward/StewardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Send,
  Users,
  MapPin,
  Leaf,
  Mic,
  MicOff,
} from "lucide-react";
import type { Steward } from "@shared/schema";

interface DmMessage {
  id: number;
  senderId: string;
  text: string;
  timestamp: Date;
}

type MessageStore = Record<string, DmMessage[]>;

const avatarColors = [
  "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  "bg-rose-500/20 text-rose-700 dark:text-rose-400",
  "bg-teal-500/20 text-teal-700 dark:text-teal-400",
  "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function buildMockConversations(currentId: string, stewards: Steward[]): MessageStore {
  const others = stewards.filter((s) => s.id !== currentId);
  const store: MessageStore = {};

  const conversationTemplates: { incoming: string; outgoing: string }[][] = [
    [
      { incoming: "Magandang umaga! Have you noticed the new shoots on your plot near the ridge?", outgoing: "Yes! The clumps along the eastern edge are really filling in. Maybe 8-10 new culms this month." },
      { incoming: "That's great! My Calacapan plot is similar. Want to do a joint verification next week?", outgoing: "Sure, let's coordinate. Tuesday or Wednesday work for me." },
      { incoming: "Tuesday is good. I'll bring my phone for GPS tagging. The verifier said photos from two angles help.", outgoing: "Perfect. I'll prepare the growth measurement notes too." },
      { incoming: "Salamat! See you Tuesday morning then.", outgoing: "" },
    ],
    [
      { incoming: "Hi! The cooperative meeting is confirmed for next Friday at the barangay hall.", outgoing: "Thanks for letting me know. Is it about the carbon credit disbursement?" },
      { incoming: "Yes, and also about the new stewards joining from Mapulog. We need to discuss plot assignments.", outgoing: "I heard there are 3 new families interested. That's exciting for the project." },
      { incoming: "Exactly. More stewards means more hectares verified. The buyer from CDO is also attending.", outgoing: "" },
    ],
    [
      { incoming: "Have you submitted your maintenance verification yet? Deadline is end of month.", outgoing: "Not yet, I need to take updated photos. The weeding is done though." },
      { incoming: "Don't forget the GPS coordinates too. Last time mine got rejected because the location was off.", outgoing: "Good reminder, salamat! I'll use the app's GPS capture this time." },
    ],
    [
      { incoming: "The bamboo poles from my harvest are ready. Do you know any buyers in the area?", outgoing: "Try Kuya Ben at the Gitagum market. He was buying at 10 pesos per pole last week." },
      { incoming: "That's a fair price. How many poles did you harvest this season?", outgoing: "About 400 poles from my 2 hectares. The clumps are really producing well now in year 5." },
      { incoming: "Mine won't be ready until next year. But the carbon income is helping in the meantime.", outgoing: "Yes, the carbon credits are a good bridge. My last payment was 2,500 pesos." },
    ],
    [
      { incoming: "Did you see the weather alert? Heavy rain expected this weekend.", outgoing: "Yes, I'm worried about the slopes near Taparak. The young plantings might need extra support." },
      { incoming: "I'll check my plots tomorrow morning and reinforce the stakes if needed.", outgoing: "Good idea. Let me know if you need help. My plots are nearby." },
    ],
    [
      { incoming: "The satellite analysis shows our NDVI scores went up this quarter!", outgoing: "That's great news. The cooperative's overall health score must be improving." },
      { incoming: "Yes, from 0.72 to 0.81 average across all plots. The verifiers will be happy.", outgoing: "" },
    ],
    [
      { incoming: "Kumusta! Are you going to the bamboo weaving workshop next month?", outgoing: "I'm interested! Is it the one organized by the provincial agriculture office?" },
      { incoming: "Yes, they're teaching value-added products from bamboo. Could be extra income for us.", outgoing: "Count me in. Diversifying beyond poles and carbon credits sounds smart." },
    ],
  ];

  others.forEach((steward, idx) => {
    const template = conversationTemplates[idx % conversationTemplates.length];
    const msgs: DmMessage[] = [];
    let msgId = idx * 1000;
    const baseHoursAgo = 48 - idx * 6;

    template.forEach((exchange, eIdx) => {
      if (exchange.incoming) {
        msgs.push({
          id: msgId++,
          senderId: steward.id,
          text: exchange.incoming,
          timestamp: hoursAgo(Math.max(1, baseHoursAgo - eIdx * 3)),
        });
      }
      if (exchange.outgoing) {
        msgs.push({
          id: msgId++,
          senderId: currentId,
          text: exchange.outgoing,
          timestamp: hoursAgo(Math.max(0.5, baseHoursAgo - eIdx * 3 - 0.5)),
        });
      }
    });

    store[steward.id] = msgs;
  });

  return store;
}

export default function StewardCommunity() {
  const [, setLocation] = useLocation();
  const [activeChat, setActiveChat] = useState<Steward | null>(null);
  const [messages, setMessages] = useState<MessageStore>({});
  const [mockInitialized, setMockInitialized] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stewardId = localStorage.getItem("stewardId") || "";
  const stewardName = localStorage.getItem("stewardName") || "Steward";

  useEffect(() => {
    if (!stewardId) {
      setLocation("/steward");
    }
  }, [stewardId, setLocation]);

  const { data: allStewards = [] } = useQuery<Steward[]>({
    queryKey: ["/api/stewards"],
  });

  const otherStewards = allStewards.filter((s) => s.id !== stewardId);

  useEffect(() => {
    if (allStewards.length > 0 && stewardId && !mockInitialized) {
      setMessages(buildMockConversations(stewardId, allStewards));
      setMockInitialized(true);
    }
  }, [allStewards, stewardId, mockInitialized]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChat]);

  const sendMessage = () => {
    if (!inputText.trim() || !activeChat) return;
    const newMsg: DmMessage = {
      id: Date.now(),
      senderId: stewardId,
      text: inputText.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMsg],
    }));
    setInputText("");

    setTimeout(() => {
      const replies = [
        "Salamat! I'll check on that.",
        `Good to hear from you, ${stewardName.split(" ")[0]}!`,
        "Yes, I've been working on my plots too. Let's coordinate.",
        "I noticed the same thing. Want to do a joint verification?",
        "The cooperative meeting is next week. Can we discuss then?",
        "My bamboo clumps are growing well this season!",
        "That sounds like a good plan. Count me in.",
        "I'll ask the other stewards in our barangay too.",
      ];
      const reply: DmMessage = {
        id: Date.now() + 1,
        senderId: activeChat.id,
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => ({
        ...prev,
        [activeChat.id]: [...(prev[activeChat.id] || []), reply],
      }));
    }, 1500);
  };

  const toggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = inputText;
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + t;
        } else {
          interim = t;
        }
      }
      setInputText(finalTranscript + (interim ? " " + interim : ""));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const hasSpeechSupport =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  function formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffHrs < 48) {
      return "Yesterday " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) +
      " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (activeChat) {
    const chatMessages = messages[activeChat.id] || [];
    const colorIdx = hashString(activeChat.id) % avatarColors.length;

    return (
      <StewardLayout activeTab="community">
        <div className="flex flex-col h-[calc(100vh-120px)]">
          <div className="p-3 border-b bg-card/50 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveChat(null)}
              data-testid="button-back-to-list"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${avatarColors[colorIdx]}`}>
              <span className="text-sm font-medium">{getInitials(activeChat.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activeChat.name}</p>
              <p className="text-xs text-muted-foreground">{activeChat.barangay}, {activeChat.province}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={scrollRef}>
            {chatMessages.map((msg) => {
              const isMe = msg.senderId === stewardId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg text-sm max-w-[80%] ${
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                    >
                      {formatTimestamp(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t bg-card/50">
            <div className="flex gap-2">
              {hasSpeechSupport && (
                <Button
                  size="icon"
                  variant={isListening ? "default" : "ghost"}
                  className={isListening ? "bg-red-500 text-white" : ""}
                  onClick={toggleVoice}
                  data-testid="button-voice-dm"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Textarea
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="text-sm resize-none flex-1"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                data-testid="input-dm-message"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!inputText.trim()}
                data-testid="button-send-dm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {isListening && (
              <p className="text-xs text-red-500 animate-pulse mt-1">Listening...</p>
            )}
          </div>
        </div>
      </StewardLayout>
    );
  }

  return (
    <StewardLayout activeTab="community">
      <div className="p-4 space-y-5">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-community-title">
            <Users className="h-5 w-5 text-primary" />
            Community
          </h1>
          <p className="text-sm text-muted-foreground">
            Message fellow stewards in your cooperative
          </p>
        </div>

        <div className="space-y-2">
          {otherStewards.map((steward) => {
            const colorIdx = hashString(steward.id) % avatarColors.length;
            const lastMsg = messages[steward.id]?.slice(-1)[0];
            return (
              <Card
                key={steward.id}
                className="cursor-pointer hover-elevate"
                onClick={() => setActiveChat(steward)}
                data-testid={`dm-contact-${steward.id}`}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${avatarColors[colorIdx]}`}>
                    <span className="text-sm font-medium">{getInitials(steward.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{steward.name}</p>
                      {(steward.verifiedPlots ?? 0) > 0 && (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 flex-shrink-0">
                          <Leaf className="h-2.5 w-2.5 mr-0.5" />
                          {steward.verifiedPlots} verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {steward.barangay}, {steward.province}
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {lastMsg.senderId === stewardId ? "You: " : ""}
                        {lastMsg.text}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {otherStewards.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">No other stewards yet</p>
                <p className="text-xs text-muted-foreground">
                  Stewards in your cooperative will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </StewardLayout>
  );
}
