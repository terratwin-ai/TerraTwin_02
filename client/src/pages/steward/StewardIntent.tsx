import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StewardLayout } from "@/components/steward/StewardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ClipboardCheck,
  BadgeCheck,
  Handshake,
  Wrench,
  Loader2,
  CheckCircle2,
  Clock,
  Users,
  Banknote,
  Zap,
  Mic,
  MicOff,
} from "lucide-react";
import type { Plot } from "@shared/schema";

const intentTypes = [
  {
    id: "harvest-verification",
    label: "Harvest verification",
    description: "Verify bamboo poles are ready for selective harvest",
    icon: ClipboardCheck,
  },
  {
    id: "carbon-preapproval",
    label: "Carbon credit pre-approval",
    description: "Get pre-approved for carbon credit issuance",
    icon: BadgeCheck,
  },
  {
    id: "buyer-matching",
    label: "Buyer matching",
    description: "Find buyers for harvested bamboo poles",
    icon: Handshake,
  },
  {
    id: "technical-assistance",
    label: "Technical assistance",
    description: "Request help with plot management or maintenance",
    icon: Wrench,
  },
];

export default function StewardIntent() {
  const [, setLocation] = useLocation();
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [customIntent, setCustomIntent] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<string>("");
  const [urgencyWeeks, setUrgencyWeeks] = useState([2]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    verifiers: number;
    estimatedDays: number;
    expectedPayment: number;
  } | null>(null);

  const stewardId = localStorage.getItem("stewardId");

  useEffect(() => {
    if (!stewardId) {
      setLocation("/steward");
    }
  }, [stewardId, setLocation]);

  const { data: plots = [] } = useQuery<Plot[]>({
    queryKey: ["/api/plots"],
  });

  const stewardPlots = plots.filter(
    (p) => String(p.stewardId) === stewardId
  );

  const recognitionRef = useRef<any>(null);

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

    let finalTranscript = customIntent;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
        } else {
          interim = transcript;
        }
      }
      setCustomIntent(finalTranscript + (interim ? " " + interim : ""));
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
    setSelectedIntent("custom");
    setShowCustomInput(true);
  };

  const hasSpeechSupport =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const handleBroadcast = async () => {
    if (!selectedIntent || !selectedPlot) return;
    setIsBroadcasting(true);
    setBroadcastResult(null);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const verifiers = Math.floor(Math.random() * 4) + 2;
    const days = Math.max(2, Math.floor(urgencyWeeks[0] * 7 * 0.4));
    const plot = stewardPlots.find((p) => String(p.id) === selectedPlot);
    const hectares = plot?.areaHectares || 1;
    const basePayment =
      selectedIntent === "harvest-verification"
        ? 12500
        : selectedIntent === "carbon-preapproval"
          ? 8000
          : selectedIntent === "buyer-matching"
            ? 15000
            : 5000;
    const payment = Math.round(basePayment * hectares);

    setBroadcastResult({
      verifiers,
      estimatedDays: days,
      expectedPayment: payment,
    });
    setIsBroadcasting(false);
  };

  const urgencyLabel =
    urgencyWeeks[0] === 1
      ? "1 week"
      : `${urgencyWeeks[0]} weeks`;

  const isReady = selectedIntent && selectedPlot && (selectedIntent !== "custom" || customIntent.trim());

  return (
    <StewardLayout activeTab="intent">
      <div className="p-4 space-y-5">
        <div>
          <h1 className="text-xl font-bold" data-testid="text-intent-title">
            I need...
          </h1>
          <p className="text-sm text-muted-foreground">
            Broadcast your intent to the network
          </p>
        </div>

        <div className="space-y-2">
          {intentTypes.map((intent) => {
            const Icon = intent.icon;
            const isSelected = selectedIntent === intent.id;
            return (
              <Card
                key={intent.id}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "hover-elevate"
                }`}
                onClick={() => setSelectedIntent(intent.id)}
                data-testid={`intent-option-${intent.id}`}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "bg-primary/20"
                        : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        isSelected ? "text-primary" : ""
                      }`}
                    >
                      {intent.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {intent.description}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "border-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Card
            className={`cursor-pointer transition-colors ${
              selectedIntent === "custom"
                ? "border-primary bg-primary/5"
                : "hover-elevate"
            }`}
            onClick={() => {
              setSelectedIntent("custom");
              setShowCustomInput(true);
            }}
            data-testid="intent-option-custom"
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedIntent === "custom"
                    ? "bg-primary/20"
                    : "bg-muted"
                }`}
              >
                <Plus
                  className={`h-5 w-5 ${
                    selectedIntent === "custom" ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    selectedIntent === "custom" ? "text-primary" : ""
                  }`}
                >
                  Something else...
                </p>
                <p className="text-xs text-muted-foreground">
                  Tell us what you need
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedIntent === "custom"
                    ? "border-primary"
                    : "border-muted-foreground/30"
                }`}
              >
                {selectedIntent === "custom" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>
            </CardContent>
          </Card>

          {showCustomInput && selectedIntent === "custom" && (
            <div className="pl-2 space-y-2">
              <div className="relative">
                <Textarea
                  placeholder="Describe what you need..."
                  value={customIntent}
                  onChange={(e) => setCustomIntent(e.target.value)}
                  className="text-sm resize-none pr-12"
                  rows={2}
                  data-testid="input-custom-intent"
                />
                {hasSpeechSupport && (
                  <Button
                    size="icon"
                    variant={isListening ? "default" : "ghost"}
                    className={`absolute right-1.5 top-1.5 ${
                      isListening ? "bg-red-500 hover:bg-red-600 text-white" : ""
                    }`}
                    onClick={toggleVoice}
                    data-testid="button-voice-input"
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              {isListening && (
                <p className="text-xs text-red-500 animate-pulse">Listening...</p>
              )}
            </div>
          )}

          {hasSpeechSupport && !showCustomInput && (
            <Card
              className="cursor-pointer border-dashed hover-elevate"
              onClick={toggleVoice}
              data-testid="button-voice-intent"
            >
              <CardContent className="p-3 flex items-center justify-center gap-2">
                <Mic className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Or speak your intent
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Plot</label>
            <Select value={selectedPlot} onValueChange={setSelectedPlot}>
              <SelectTrigger data-testid="select-plot">
                <SelectValue placeholder="Select a plot" />
              </SelectTrigger>
              <SelectContent>
                {stewardPlots.map((plot) => (
                  <SelectItem key={plot.id} value={String(plot.id)}>
                    {plot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Urgency</label>
              <span className="text-sm text-muted-foreground">
                {urgencyLabel}
              </span>
            </div>
            <Slider
              value={urgencyWeeks}
              onValueChange={setUrgencyWeeks}
              min={1}
              max={8}
              step={1}
              data-testid="slider-urgency"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Urgent</span>
              <span>Flexible</span>
            </div>
          </div>

        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!isReady || isBroadcasting}
          onClick={handleBroadcast}
          data-testid="button-broadcast-intent"
        >
          {isBroadcasting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Broadcasting...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Broadcast Intent
            </>
          )}
        </Button>

        {broadcastResult && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium">Intent Broadcast</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold" data-testid="text-matching-verifiers">
                    {broadcastResult.verifiers}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Verifiers found
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold" data-testid="text-estimated-days">
                    {broadcastResult.estimatedDays} days
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Est. verification
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold text-emerald-500" data-testid="text-expected-payment">
                    ₱{broadcastResult.expectedPayment.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expected payment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StewardLayout>
  );
}
