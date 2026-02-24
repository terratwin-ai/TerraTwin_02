import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import type { Plot } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, Camera, MapPin, CheckCircle, Loader2, Image as ImageIcon
} from "lucide-react";

export default function StewardSubmit() {
  const [, setLocation] = useLocation();
  const params = useParams<{ plotId: string }>();
  const plotId = params.plotId;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocationState] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("stewardId");
    if (!id) {
      setLocation("/steward");
    }
  }, [setLocation]);

  useEffect(() => {
    getLocation();
  }, []);

  const { data: plots = [] } = useQuery<Plot[]>({
    queryKey: ["/api/plots"],
  });

  const plot = plots.find((p) => p.id.toString() === plotId);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const stewardId = localStorage.getItem("stewardId");
      return apiRequest("POST", "/api/verification-events", {
        plotId: plotId,
        stewardId: stewardId,
        eventType: "verification_submission",
        status: "pending",
        notes: location ? `${notes}\n\nGPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : notes,
        evidenceUrls: photos,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verification-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plots"] });
      toast({
        title: "Verification Submitted",
        description: "Your evidence has been submitted for review.",
      });
      setLocation("/steward/home");
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS not available", variant: "destructive" });
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGettingLocation(false);
      },
      () => {
        setGettingLocation(false);
        toast({ title: "Could not get location", variant: "destructive" });
      },
      { enableHighAccuracy: true }
    );
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit = photos.length > 0 && location;

  if (!plot) {
    return (
      <div className="min-h-screen bg-black flex justify-center">
        <div className="w-full max-w-md bg-background flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md bg-background flex flex-col min-h-screen shadow-2xl relative">
        <header className="p-3 border-b bg-card/50 flex items-center gap-3 sticky top-0 z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation(`/steward/plot/${plotId}`)}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-medium">Submit Verification</h1>
          <p className="text-xs text-muted-foreground">{plot.name}</p>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-24">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Capture Photos
            </h3>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoCapture}
              className="hidden"
              data-testid="input-photo"
            />
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={photo} 
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full text-xs"
                    data-testid={`button-remove-photo-${index}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                data-testid="button-add-photo"
              >
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">Add Photo</span>
              </button>
            </div>
            
            {photos.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Take at least one photo of your bamboo plot
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              GPS Location
            </h3>
            
            {gettingLocation ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Getting your location...
              </div>
            ) : location ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">
                  {location.lat.toFixed(6)}°N, {location.lng.toFixed(6)}°E
                </span>
              </div>
            ) : (
              <Button variant="outline" onClick={getLocation} className="w-full">
                <MapPin className="h-4 w-4 mr-2" />
                Get Location
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Notes (Optional)</h3>
            <Textarea
              placeholder="Any observations about the plot condition, growth, issues..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              data-testid="input-notes"
            />
          </CardContent>
        </Card>

        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            className="w-full h-14 text-lg gap-2"
            onClick={() => submitMutation.mutate()}
            disabled={!canSubmit || submitMutation.isPending}
            data-testid="button-submit"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Submit Verification
              </>
            )}
          </Button>
          {!canSubmit && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Add at least one photo and enable GPS
            </p>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}
