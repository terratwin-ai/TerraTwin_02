import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import type { Plot } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, Camera, MapPin, CheckCircle, Loader2, Image as ImageIcon, Leaf
} from "lucide-react";

const BAMBOO_SPECIES = [
  { value: "dendrocalamus_asper", label: "Giant Bamboo (D. asper)" },
  { value: "bambusa_blumeana", label: "Tinik (B. blumeana)" },
  { value: "guadua_angustifolia", label: "Guadua" },
  { value: "unknown", label: "Not sure" },
];

export default function StewardSubmit() {
  const [, setLocation] = useLocation();
  const params = useParams<{ plotId: string }>();
  const plotId = params.plotId;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notes, setNotes] = useState("");
  const [species, setSpecies] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [location, setLocationState] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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

  const uploadPhoto = async (file: File): Promise<string> => {
    const res = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type || "image/jpeg",
      }),
    });
    if (!res.ok) throw new Error("Failed to get upload URL");
    const { uploadURL, objectPath } = await res.json();

    const uploadRes = await fetch(uploadURL, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "image/jpeg" },
    });
    if (!uploadRes.ok) throw new Error("Failed to upload photo");

    return objectPath;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const stewardId = localStorage.getItem("stewardId");
      
      setUploadingPhotos(true);
      let evidenceUrls: string[];
      try {
        evidenceUrls = await Promise.all(photos.map((p) => uploadPhoto(p.file)));
      } finally {
        setUploadingPhotos(false);
      }

      return apiRequest("POST", "/api/verification-events", {
        plotId: plotId,
        stewardId: stewardId,
        eventType: "verification_submission",
        status: "pending",
        notes: notes || null,
        evidenceUrls,
        gpsLat: location?.lat ?? null,
        gpsLng: location?.lng ?? null,
        species: species || null,
        channel: "app",
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
      const preview = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, { file, preview }]);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const canSubmit = photos.length > 0 && location && species;
  const isSubmitting = submitMutation.isPending || uploadingPhotos;

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
                    src={photo.preview} 
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
              
              {photos.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square h-auto flex-col gap-1 border-2 border-dashed"
                  data-testid="button-add-more-photo"
                >
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-xs">Add More</span>
                </Button>
              )}
            </div>
            
            {photos.length === 0 && (
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[120px] h-auto flex-col gap-2 border-2 border-dashed"
                data-testid="button-add-photo"
              >
                <Camera className="h-8 w-8" />
                <span className="text-sm font-medium">Tap to Add Photo</span>
                <span className="text-xs font-normal text-muted-foreground">Take a photo of your bamboo plot</span>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Bamboo Species
            </h3>
            <Select value={species} onValueChange={setSpecies} data-testid="select-species">
              <SelectTrigger data-testid="select-species-trigger">
                <SelectValue placeholder="Select bamboo species" />
              </SelectTrigger>
              <SelectContent>
                {BAMBOO_SPECIES.map((s) => (
                  <SelectItem key={s.value} value={s.value} data-testid={`species-option-${s.value}`}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Select the bamboo species in this plot
            </p>
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
            disabled={!canSubmit || isSubmitting}
            data-testid="button-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {uploadingPhotos ? "Uploading Photos..." : "Submitting..."}
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
              Add photo, select species, and enable GPS
            </p>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}
