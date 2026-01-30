import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, Lock, ArrowRight, AlertCircle } from "lucide-react";

interface AdminLoginProps {
  onLogin: () => void;
}

const DEMO_PASSWORD = "terratwin2026";

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DEMO_PASSWORD) {
      localStorage.setItem("adminAuth", "true");
      onLogin();
    } else {
      setError("Invalid password");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">TerraTwin</h1>
          <p className="text-muted-foreground">Digital Infrastructure for Bamboo Stewardship</p>
        </div>

        <Card className="border-border/50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              Admin Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="text-center"
                  data-testid="input-admin-password"
                />
                {error && (
                  <div className="flex items-center gap-2 text-sm text-amber-400 justify-center">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full gap-2" data-testid="button-admin-login">
                Access Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground mb-2">Are you a steward?</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/steward"}
                data-testid="button-steward-portal"
              >
                Go to Steward Portal
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Demo Mode - Contact admin for access
        </p>
      </div>
    </div>
  );
}
