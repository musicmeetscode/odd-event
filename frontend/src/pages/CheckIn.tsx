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
import { brand } from "@/config/brandConfig";

const PLATFORMS = {
  SQUARE: { name: "Instagram / Square", width: 500, height: 500 },
  LANDSCAPE: { name: "X / LinkedIn / FB", width: 600, height: 315 },
  STORY: { name: "WhatsApp / IG Story", width: 360, height: 640 },
};

const ATTENDANCE_STATUS = [
  "I'm Attending",
  "I Attended",
  "I'm Speaking"
];

const CheckIn = () => {
  const { loginWithGoogle } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [activePlatform, setActivePlatform] = useState<keyof typeof PLATFORMS>("SQUARE");
  const [activeStatus, setActiveStatus] = useState<string>(ATTENDANCE_STATUS[0]);

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
      link.download = `${(result?.display_name || brand.name.toLowerCase().replace(/\s+/g, "")).replace(/\s+/g, "_")}-${activePlatform.toLowerCase()}.png`;
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
    const eventTitle = result.event_title || selectedEvent?.title || brand.fullName;
    const displayName = result.display_name || "Attendee";
    const profession = result.profession || "";
    
    const dim = PLATFORMS[activePlatform];

    return (
      <div className="p-4 w-full h-full pt-16">
        <div className="max-w-4xl mx-auto py-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-1">You're Checked In! 🎉</h2>
            <p className="text-muted-foreground text-sm">
              Welcome to <span className="font-semibold text-foreground">{eventTitle}</span>
            </p>
          </div>

          <Card className="mb-6 border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-3 bg-slate-50 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg">Your Social Badge</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Customize your badge format before downloading.
                  </p>
                </div>
                
                <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                  {ATTENDANCE_STATUS.map(status => (
                    <button
                      key={status}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeStatus === status ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}
                      onClick={() => setActiveStatus(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200 border-dashed">
                {Object.entries(PLATFORMS).map(([key, val]) => (
                  <Button
                    key={key}
                    variant={activePlatform === key as keyof typeof PLATFORMS ? "default" : "outline"}
                    size="sm"
                    className="flex-1 min-w-[120px]"
                    onClick={() => setActivePlatform(key as keyof typeof PLATFORMS)}
                  >
                    {val.name}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative bg-slate-100/50">
              <div className="flex flex-wrap gap-3 mb-6 max-w-sm mx-auto">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <Button variant="outline" className="flex-1 bg-white" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {profileImage ? "Change" : "Upload Photo"}
                </Button>
                <Button className="flex-1 bg-primary text-white shadow-md shadow-primary/20" onClick={handleDownloadDP} disabled={!profileImage || isGenerating}>
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? "Processing..." : "Download"}
                </Button>
              </div>

              <div className="flex justify-center bg-slate-100/80 rounded-2xl p-4 sm:p-8 border-2 border-dashed border-slate-200 overflow-x-auto">
                <div
                  ref={dpRef}
                  className="bg-white shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col items-center shrink-0"
                  style={{
                    width: dim.width,
                    height: dim.height,
                    fontFamily: "'Inter', sans-serif",
                    borderRadius: activePlatform === 'STORY' ? 24 : 0, 
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${brand.colors.primary}, ${brand.colors.accent})` }} />
                  
                  {activePlatform === "LANDSCAPE" ? (
                    // LANDSCAPE LAYOUT
                    <div style={{ display: "flex", width: "100%", height: "100%" }}>
                      <div style={{ flex: "0 0 45%", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: `${brand.colors.primary}08` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <img src={brand.logo} alt={brand.name} style={{ width: 44, height: 44 }} crossOrigin="anonymous" />
                          <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ color: brand.colors.primary, fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{brand.name.toUpperCase()}</span>
                              <span style={{ color: brand.colors.accent, fontWeight: 600, fontSize: 12, letterSpacing: '0.2em' }}>{brand.tagline.toUpperCase()}</span>
                          </div>
                        </div>

                        <div>
                          <div style={{ background: `${brand.colors.accent}1A`, border: `1px solid ${brand.colors.accent}33`, borderRadius: 16, padding: "4px 12px", color: brand.colors.accent, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", display: "inline-block", marginBottom: 12 }}>
                            ✓ {activeStatus}
                          </div>
                          <div style={{ fontSize: 24, fontWeight: 900, color: brand.colors.primary, lineHeight: 1.1 }}>{eventTitle}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: '0.1em', marginBottom: 2 }}>{brand.hashtag}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>CODE · CONNECT · GROW</div>
                        </div>
                      </div>

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" }}>
                        <div style={{ width: 140, height: 140, borderRadius: "50%", overflow: "hidden", border: "4px solid #ffffff", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", background: "#f8fafc", flexShrink: 0 }}>
                          {profileImage ? (
                            <img src={profileImage} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, fontWeight: 800, color: brand.colors.primary, background: `${brand.colors.primary}0D` }}>
                              {displayName[0]}
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: 16, fontSize: 24, fontWeight: 900, color: brand.colors.primary, textAlign: "center", letterSpacing: "-0.01em" }}>{displayName}</div>
                        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginTop: 2, textAlign: "center" }}>{profession}</div>
                      </div>
                    </div>
                  ) : (
                    // SQUARE & STORY LAYOUT
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100%", width: "100%", padding: activePlatform === "STORY" ? "60px 40px" : "40px 40px 32px" }}>
                      
                      {/* Brand Header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src={brand.logo} alt={brand.name} style={{ width: activePlatform === "STORY" ? 56 : 44, height: activePlatform === "STORY" ? 56 : 44 }} crossOrigin="anonymous" />
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ color: brand.colors.primary, fontWeight: 800, fontSize: activePlatform === "STORY" ? 22 : 18, lineHeight: 1 }}>{brand.name.toUpperCase()}</span>
                            <span style={{ color: brand.colors.accent, fontWeight: 600, fontSize: activePlatform === "STORY" ? 14 : 12, letterSpacing: '0.2em', marginTop: 2 }}>{brand.tagline.toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Attend Status */}
                      <div style={{ display: "flex", justifyContent: "center", marginTop: activePlatform === "STORY" ? 24 : 16 }}>
                        <div style={{ background: `${brand.colors.accent}1A`, border: `1px solid ${brand.colors.accent}33`, borderRadius: 20, padding: "6px 20px", color: brand.colors.accent, fontSize: activePlatform === "STORY" ? 14 : 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
                          ✓ {activeStatus}
                        </div>
                      </div>

                      {/* Event Title */}
                      <div style={{ textAlign: "center", padding: activePlatform === "STORY" ? "24px 0" : "16px 0", flexGrow: 1, display: "flex", alignItems: "center" }}>
                        <div style={{ fontSize: activePlatform === "STORY" ? 32 : 28, fontWeight: 900, color: brand.colors.primary, lineHeight: 1.1 }}>{eventTitle}</div>
                      </div>

                      {/* Avatar */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: activePlatform === "STORY" ? 220 : 180, height: activePlatform === "STORY" ? 220 : 180, borderRadius: "50%", overflow: "hidden", border: "5px solid #ffffff", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)", background: "#f8fafc" }}>
                          {profileImage ? (
                            <img src={profileImage} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: activePlatform === "STORY" ? 90 : 72, fontWeight: 800, color: brand.colors.primary, background: `${brand.colors.primary}0D` }}>
                              {displayName[0]}
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: activePlatform === "STORY" ? 24 : 16, fontSize: activePlatform === "STORY" ? 34 : 28, fontWeight: 900, color: brand.colors.primary, textAlign: "center", letterSpacing: "-0.01em" }}>{displayName}</div>
                        <div style={{ fontSize: activePlatform === "STORY" ? 18 : 14, color: "#64748b", fontWeight: 600, marginTop: 4, textAlign: "center" }}>{profession}</div>
                      </div>
                      
                      {/* Footer */}
                      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: activePlatform === "STORY" ? 40 : 24 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: '0.1em' }}>{brand.hashtag}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>CODE · CONNECT · GROW</div>
                      </div>
                    </div>
                  )}
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
            <img src={brand.logo} alt={brand.fullName} className="w-16 h-16 mx-auto mb-4" />
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
          <img src={brand.logo} alt={brand.fullName} className="w-20 h-20 mx-auto mb-4" />
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
