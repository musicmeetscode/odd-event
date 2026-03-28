import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { eventsService } from "@/services/events";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CheckCircle2, ArrowLeft, Calendar, MapPin, Users,
  Loader2, Download, ImageIcon, LogIn
} from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas-pro";
import { GoogleLogin } from "@react-oauth/google";
import type { Event } from "@/types/api";

const CheckIn = () => {
  const { loginWithGoogle } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const dpRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: eventsService.listEvents,
  });

  const activeEvents = events?.filter((e: Event) => e.is_active) || [];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onGoogleSuccess = async (credentialResponse: any) => {
    if (!selectedEvent) return;
    try {
      const data = await loginWithGoogle(credentialResponse.credential, selectedEvent.id);
      if (data.check_in_result) {
        setResult(data.check_in_result);
        // Use Google avatar if user didn't upload one
        if (data.avatar_url && !profileImage) {
          setProfileImage(data.avatar_url);
        }
        toast.success("Checked in with Google! 🎉");
      } else {
        toast.error("Authentication successful, but check-in failed.");
      }
    } catch (error) {
      toast.error("Google Sign-In failed.");
    }
  };

  const handleDownloadDP = async () => {
    if (!dpRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const canvas = await html2canvas(dpRef.current, {
        useCORS: true,
        scale: 3,
        backgroundColor: "#ffffff",
      });
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(result?.display_name || "blueox").replace(/\s+/g, "_")}-dp.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsGenerating(false);
      toast.success("DP downloaded!");
    } catch {
      toast.error("Failed to generate DP.");
      setIsGenerating(false);
    }
  };

  if (result) {
    const eventTitle = result.event_title || selectedEvent?.title || "Blue Ox Events";
    const displayName = result.display_name || "Attendee";
    const profession = result.profession || "";

    return (
      <div className="p-4 w-full h-full pt-20">
        <div className="max-w-2xl mx-auto py-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're Checked In! 🎉</h2>
            <p className="text-muted-foreground">
              Welcome to <span className="font-semibold text-foreground">{eventTitle}</span>
            </p>
          </div>

          <Card className="mb-6 border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-slate-50/50">
              <CardTitle className="text-lg">Your Event DP</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate your personalized social media badge for the event.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3 mb-6">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {profileImage ? "Change Photo" : "Upload Photo"}
                </Button>
                <Button className="flex-1 bg-primary text-white" onClick={handleDownloadDP} disabled={!profileImage || isGenerating}>
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? "Processing..." : "Download DP"}
                </Button>
              </div>

              <div className="flex justify-center bg-slate-100 rounded-xl p-8 border-2 border-dashed border-slate-200">
                <div
                  ref={dpRef}
                  style={{
                    width: 500,
                    height: 500,
                    position: "relative",
                    overflow: "hidden",
                    fontFamily: "'Inter', sans-serif",
                    background: "#ffffff",
                    borderRadius: 24,
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: "linear-gradient(90deg, #1a365d, #F58220)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "32px 32px 0" }}>
                    <img src="/logo.png" alt="Blue Ox" style={{ width: 44, height: 44 }} crossOrigin="anonymous" />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#1a365d", fontWeight: 800, fontSize: 18, leadingHeight: 1 }}>BLUE OX</span>
                        <span style={{ color: "#F58220", fontWeight: 600, fontSize: 12, trackingSpacing: '0.2em' }}>KAMPUS</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                    <div style={{ background: "rgba(245, 130, 32, 0.1)", border: "1px solid rgba(245, 130, 32, 0.2)", borderRadius: 20, padding: "6px 20px", color: "#F58220", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
                      ✓ I'm Attending
                    </div>
                  </div>

                  <div style={{ textAlign: "center", padding: "16px 32px 0" }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#1a365d", lineHeight: 1.1 }}>{eventTitle}</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 32px 0" }}>
                    <div style={{ width: 200, height: 200, borderRadius: "50%", overflow: "hidden", border: "6px solid #ffffff", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.2)", background: "#f8fafc" }}>
                      {profileImage ? (
                        <img src={profileImage} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyCenter: "center", fontSize: 80, fontWeight: 800, color: "#1a365d", background: "rgba(26, 54, 93, 0.05)" }}>
                          {displayName[0]}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 20, fontSize: 32, fontWeight: 900, color: "#1a365d", textAlign: "center", letterSpacing: "-0.01em" }}>{displayName}</div>
                    <div style={{ fontSize: 16, color: "#64748b", fontWeight: 600, marginTop: 4 }}>{profession}</div>
                  </div>
                  
                  <div style={{ position: "absolute", bottom: 24, left: 32, right: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", trackingSpacing: '0.1em' }}>#BLUEOXKAMPUS2026</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>CODE · CONNECT · GROW</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={() => setResult(null)}>Check In Another Person</Button>
        </div>
      </div>
    );
  }

  if (selectedEvent) {
    return (
      <div className="flex items-center justify-center p-4 w-full h-full pt-20">
        <Card className="w-full max-w-md border-border/50 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
          <CardHeader className="text-center pb-8 pt-10 relative">
            <Button variant="ghost" size="sm" className="absolute left-4 top-4" onClick={() => setSelectedEvent(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <img src="/logo.png" alt="Blue Ox Events" className="w-16 h-16 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">Check In</CardTitle>
            <p className="text-muted-foreground mt-2">Almost there! Sign in to verify your attendance at:</p>
            <Badge variant="secondary" className="mx-auto mt-3 py-1.5 px-4 text-sm font-semibold">{selectedEvent.title}</Badge>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="flex flex-col items-center gap-6">
                <div className="w-full flex flex-col items-center">
                    <GoogleLogin
                        onSuccess={onGoogleSuccess}
                        onError={() => toast.error("Log in failed")}
                        useOneTap
                        shape="pill"
                        theme="filled_blue"
                        width="100%"
                        text="continue_with"
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full">
                    <div className="h-[1px] bg-slate-100 flex-1" />
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Safe & Secure</span>
                    <div className="h-[1px] bg-slate-100 flex-1" />
                </div>
                
                <p className="text-xs text-center text-muted-foreground px-6 leading-relaxed">
                    By checking in, you agree to our Terms of Service and Privacy Policy. We will keep your data (name, email, photo) for up to 3 months.
                </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 w-full h-full pt-20">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-12">
          <img src="/logo.png" alt="Blue Ox Events" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Event Check-In</h1>
          <p className="text-lg text-muted-foreground">Welcome! Please select an event to check in and generate your attendee badge.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary/40" /></div>
        ) : activeEvents.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeEvents.map((event: Event) => (
              <Card
                key={event.id}
                className="border-slate-100 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="h-2 bg-slate-50 group-hover:bg-primary transition-colors" />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{event.event_type}</Badge>
                    {event.is_competition && <Badge className="bg-orange-500 text-white text-[10px] uppercase tracking-wider">Comp</Badge>}
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors leading-tight">{event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5 text-sm text-slate-500">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{event.location || "Online / TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{event.start_date ? format(new Date(event.start_date), "MMM d, yyyy") : "TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>{event.attendee_count} checking in</span>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-slate-900 hover:bg-primary transition-all gap-2 py-6 text-base font-semibold">
                    Check In Now <LogIn className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-900 mb-1">No Active Events</h3>
            <p className="text-slate-500">There are no events currently open for check-in. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
