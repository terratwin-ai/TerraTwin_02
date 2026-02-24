import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Steward } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, User, ArrowRight, MapPin } from "lucide-react";

export default function StewardLogin() {
  const [, setLocation] = useLocation();
  const [stewardCode, setStewardCode] = useState("");
  const [error, setError] = useState("");

  const { data: stewards = [], isLoading } = useQuery<Steward[]>({
    queryKey: ["/api/stewards"],
  });

  const handleCodeSubmit = () => {
    const found = stewards.find(
      (s) => s.id.toString() === stewardCode || 
             s.name.toLowerCase().includes(stewardCode.toLowerCase())
    );
    
    if (found) {
      localStorage.setItem("stewardId", found.id.toString());
      localStorage.setItem("stewardName", found.name);
      setLocation("/steward/home");
    } else {
      setError("Steward not found. Please check your code.");
    }
  };

  const handleSelectSteward = (steward: Steward) => {
    localStorage.setItem("stewardId", steward.id.toString());
    localStorage.setItem("stewardName", steward.name);
    setLocation("/steward/home");
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md bg-background flex flex-col min-h-screen shadow-2xl">
        <header className="p-4 border-b bg-card/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Leaf className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold">TerraTwin</h1>
            <p className="text-xs text-muted-foreground">Steward Portal</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <div className="text-center pt-8 pb-4">
          <h2 className="text-2xl font-bold mb-2">Welcome, Steward</h2>
          <p className="text-muted-foreground">Enter your code or select your name below</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Enter Steward Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Your name or ID..."
              value={stewardCode}
              onChange={(e) => {
                setStewardCode(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
              data-testid="input-steward-code"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button 
              className="w-full gap-2" 
              onClick={handleCodeSubmit}
              disabled={!stewardCode.trim()}
              data-testid="button-login"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or select</span>
          </div>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading stewards...</div>
          ) : (
            stewards.map((steward) => (
              <Card 
                key={steward.id} 
                className="cursor-pointer hover-elevate"
                onClick={() => handleSelectSteward(steward)}
                data-testid={`steward-option-${steward.id}`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{steward.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {steward.barangay}, {steward.province}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
      </div>
    </div>
  );
}
