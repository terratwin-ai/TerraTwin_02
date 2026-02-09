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
  Crown,
  Mic,
  MicOff,
} from "lucide-react";
import type { Steward } from "@shared/schema";

interface DmMessage {
  id: number;
  senderId: number;
  text: string;
  timestamp: Date;
}

type MessageStore = { [key: number]: DmMessage[] };

const avatarColors = [
  "bg-emerald-500/20 text-emerald-700",
  "bg-blue-500/20 text-blue-700",
  "bg-amber-500/20 text-amber-700",
  "bg-purple-500/20 text-purple-700",
  "bg-rose-500/20 text-rose-700",
  "bg-teal-500/20 text-teal-700",
  "bg-orange-500/20 text-orange-700",
  "bg-cyan-500/20 text-cyan-700",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function StewardCommunity() {
  const [, setLocation] = useLocation();
  const [activeChat, setActiveChat] = useState<Steward | null>(null);
  const [messages, setMessages] = useState<MessageStore>({});
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stewardIdStr = localStorage.getItem("stewardId");
  const stewardIdNum = stewardIdStr ? parseInt(stewardIdStr, 10) : 0;
  const stewardName = localStorage.getItem("stewardName") || "Steward";

  useEffect(() => {
    if (!stewardIdStr) {
      setLocation("/steward");
    }
  }, [stewardIdStr, setLocation]);

  const { data: allStewards = [] } = useQuery<Steward[]>({
    queryKey: ["/api/stewards"],
  });

  const otherStewards = allStewards.filter(
    (s) => s.id !== stewardIdNum
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChat]);

  const sendMessage = () => {
    if (!inputText.trim() || !activeChat) return;
    const newMsg: DmMessage = {
      id: Date.now(),
      senderId: stewardIdNum,
      text: inputText.trim(),
      timestamp: new Date(),
    };
    setMessages((prev: MessageStore) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMsg],
    }));
    setInputText("");

    setTimeout(() => {
      const replies = [
        `Salamat! I'll check on that.`,
        `Good to hear from you, ${stewardName.split(" ")[0]}!`,
        `Yes, I've been working on my plots too. Let's coordinate.`,
        `I noticed the same thing. Want to do a joint verification?`,
        `The cooperative meeting is next week. Can we discuss then?`,
        `My bamboo clumps are growing well this season!`,
      ];
      const reply: DmMessage = {
        id: Date.now() + 1,
        senderId: activeChat.id,
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date(),
      };
      setMessages((prev: MessageStore) => ({
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

  if (activeChat) {
    const chatMessages = messages[activeChat.id] || [];
    const colorIndex = activeChat.id % avatarColors.length;

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
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${avatarColors[colorIndex]}`}>
              <span className="text-sm font-medium">{getInitials(activeChat.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activeChat.name}</p>
              <p className="text-xs text-muted-foreground">{activeChat.barangay}, {activeChat.province}</p>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto p-3 space-y-3"
            ref={scrollRef}
          >
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${avatarColors[colorIndex]}`}>
                  <span className="text-xl font-medium">{getInitials(activeChat.name)}</span>
                </div>
                <p className="text-sm font-medium">{activeChat.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeChat.barangay}, {activeChat.province}
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  Send a message to start the conversation
                </p>
              </div>
            )}

            {chatMessages.map((msg: DmMessage) => {
              const isMe = msg.senderId === stewardIdNum;
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
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                  className={isListening ? "bg-red-500 hover:bg-red-600 text-white" : ""}
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
          {otherStewards.map((steward, index) => {
            const colorIndex = steward.id % avatarColors.length;
            const lastMsg = messages[steward.id]?.slice(-1)[0];
            return (
              <Card
                key={steward.id}
                className="cursor-pointer hover-elevate"
                onClick={() => setActiveChat(steward)}
                data-testid={`dm-contact-${steward.id}`}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${avatarColors[colorIndex]}`}>
                    <span className="text-sm font-medium">{getInitials(steward.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{steward.name}</p>
                      {(steward.verifiedPlots ?? 0) > 0 && (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5 flex-shrink-0">
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
                        {lastMsg.senderId === stewardIdNum ? "You: " : ""}
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
