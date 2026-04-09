import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, Download, Loader2, Share2, 
  ImageIcon, CheckCircle2, UserCircle 
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas-pro";
import { useBrand } from "@/contexts/BrandContext";
import type { Event } from "@/types/api";

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

const ProfileCard = () => {
  const { brand } = useBrand();
  const { eventId, userId } = useParams<{ eventId: string; userId: string }>();
  const navigate = useNavigate();
  const dpRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePlatform, setActivePlatform] = useState<keyof typeof PLATFORMS>("SQUARE");
  const [activeStatus, setActiveStatus] = useState<string>(ATTENDANCE_STATUS[0]);

  // Load profile card data
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile-card", eventId, userId],
    queryFn: () => eventsService.getProfileCard(eventId || "", userId),
  });

  // Load event data
  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsService.getEvent(eventId || ""),
  });

  // Effect to set initial profile image from avatar_url
  useEffect(() => {
    if (profile?.avatar_url) {
      setProfileImage(profile.avatar_url);
    }
  }, [profile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
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
      const filename = `${(profile?.display_name || profile?.name || brand.name.toLowerCase().replace(/\s+/g, "")).replace(/\s+/g, "_")}-${activePlatform.toLowerCase()}.png`;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.open(url, "_blank");
        toast.success("Image opened! Long-press it to save to your photos.");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Social badge downloaded!");
      }
      setIsGenerating(false);
    } catch {
      toast.error("Failed to generate badge.");
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile?.display_name || profile?.name}'s Profile`,
        text: `Check out my badge for ${event?.title}!`,
        url: window.location.href,
      }).catch(() => toast.error("Sharing failed"));
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoadingProfile || isLoadingEvent) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || !event) {
    return (
      <div className="max-w-md mx-auto pt-32 text-center px-4">
        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
            <UserCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground">This attendee profile couldn't be loaded. It might be private or the event link is invalid.</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>Back to Hub</Button>
      </div>
    );
  }

  const dim = PLATFORMS[activePlatform];
  const eventTitle = event.title || brand.name;
  const displayName = profile.display_name || profile.name || "Attendee";
  const profession = profile.profession || "";

  return (
    <div className="p-4 w-full h-full pt-20 bg-slate-50/50">
      <div className="max-w-4xl mx-auto py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${eventId}`)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                   <h2 className="text-2xl font-bold tracking-tight">Social Badge Generator</h2>
                   <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        Verified profile for <span className="font-semibold text-slate-900">{eventTitle}</span>
                   </p>
                </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" className="flex-1 md:flex-none" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
                <Button className="flex-1 md:flex-none bg-primary text-white" onClick={handleDownloadDP} disabled={!profileImage || isGenerating}>
                    <Download className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating..." : "Download PNG"}
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Controls */}
            <div className="lg:col-span-4 space-y-6">
                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Customization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Format</label>
                            <div className="grid grid-cols-1 gap-2">
                                {Object.entries(PLATFORMS).map(([key, val]) => (
                                    <Button
                                        key={key}
                                        variant={activePlatform === key as keyof typeof PLATFORMS ? "default" : "outline"}
                                        size="sm"
                                        className="justify-start font-semibold"
                                        onClick={() => setActivePlatform(key as keyof typeof PLATFORMS)}
                                    >
                                        {val.name}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Label</label>
                            <div className="flex flex-wrap gap-2">
                                {ATTENDANCE_STATUS.map(status => (
                                    <button
                                        key={status}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors border ${activeStatus === status ? "bg-primary border-primary text-white shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                                        onClick={() => setActiveStatus(status)}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <Button variant="outline" className="w-full bg-slate-50 hover:bg-slate-100 border-dashed border-2" onClick={() => fileInputRef.current?.click()}>
                                <ImageIcon className="h-4 w-4 mr-2" />
                                {profileImage ? "Change Picture" : "Upload Picture"}
                            </Button>
                            <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                High quality portrait images work best.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-8">
                <div className="flex justify-center bg-slate-200/50 rounded-3xl p-4 sm:p-12 border-2 border-dashed border-slate-300/50 overflow-x-auto min-h-[500px] items-center">
                    <div
                        ref={dpRef}
                        className="bg-white shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col items-center shrink-0"
                        style={{
                            width: dim.width,
                            height: dim.height,
                            fontFamily: "'Inter', sans-serif",
                            borderRadius: activePlatform === 'STORY' ? 24 : 0, 
                        }}
                    >
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${brand.primary_color}, ${brand.accent_color})` }} />
                        
                        {activePlatform === "LANDSCAPE" ? (
                            <div style={{ display: "flex", width: "100%", height: "100%" }}>
                                <div style={{ flex: "0 0 45%", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: `${brand.primary_color}08` }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <img src={brand.logo || "/logo.png"} alt={brand.name} style={{ width: 44, height: 44 }} crossOrigin="anonymous" />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ color: brand.primary_color, fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{brand.name.toUpperCase()}</span>
                                            <span style={{ color: brand.accent_color, fontWeight: 600, fontSize: 12, letterSpacing: '0.2em' }}>{brand.tagline.toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ background: `${brand.accent_color}1A`, border: `1px solid ${brand.accent_color}33`, borderRadius: 16, padding: "4px 12px", color: brand.accent_color, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", display: "inline-block", marginBottom: 12 }}>
                                            ✓ {activeStatus}
                                        </div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: brand.primary_color, lineHeight: 1.1 }}>{eventTitle}</div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: '0.1em', marginBottom: 2 }}>{brand.hashtag}</div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>CODE · CONNECT · GROW</div>
                                    </div>
                                </div>

                                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" }}>
                                    <div style={{ width: 140, height: 140, borderRadius: "50%", overflow: "hidden", border: "4px solid #ffffff", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", background: "#f8fafc", flexShrink: 0 }}>
                                        {profileImage ? (
                                            <img src={profileImage} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                                        ) : (
                                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, fontWeight: 800, color: brand.primary_color, background: `${brand.primary_color}0D` }}>
                                                {displayName[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ marginTop: 16, fontSize: 24, fontWeight: 900, color: brand.primary_color, textAlign: "center", letterSpacing: "-0.01em" }}>{displayName}</div>
                                    <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginTop: 2, textAlign: "center" }}>{profession}</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100%", width: "100%", padding: activePlatform === "STORY" ? "60px 40px" : "40px 40px 32px" }}>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <img src={brand.logo || "/logo.png"} alt={brand.name} style={{ width: activePlatform === "STORY" ? 56 : 44, height: activePlatform === "STORY" ? 56 : 44 }} crossOrigin="anonymous" />
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ color: brand.primary_color, fontWeight: 800, fontSize: activePlatform === "STORY" ? 22 : 18, lineHeight: 1 }}>{brand.name.toUpperCase()}</span>
                                    <span style={{ color: brand.accent_color, fontWeight: 600, fontSize: activePlatform === "STORY" ? 14 : 12, letterSpacing: '0.2em', marginTop: 2 }}>{brand.tagline.toUpperCase()}</span>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "center", marginTop: activePlatform === "STORY" ? 24 : 16 }}>
                                <div style={{ background: `${brand.accent_color}1A`, border: `1px solid ${brand.accent_color}33`, borderRadius: 20, padding: "6px 20px", color: brand.accent_color, fontSize: activePlatform === "STORY" ? 14 : 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
                                ✓ {activeStatus}
                                </div>
                            </div>

                            <div style={{ textAlign: "center", padding: activePlatform === "STORY" ? "24px 0" : "16px 0", flexGrow: 1, display: "flex", alignItems: "center" }}>
                                <div style={{ fontSize: activePlatform === "STORY" ? 32 : 28, fontWeight: 900, color: brand.primary_color, lineHeight: 1.1 }}>{eventTitle}</div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <div style={{ width: activePlatform === "STORY" ? 220 : 180, height: activePlatform === "STORY" ? 220 : 180, borderRadius: "50%", overflow: "hidden", border: "5px solid #ffffff", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)", background: "#f8fafc" }}>
                                {profileImage ? (
                                    <img src={profileImage} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                                ) : (
                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: activePlatform === "STORY" ? 90 : 72, fontWeight: 800, color: brand.primary_color, background: `${brand.primary_color}0D` }}>
                                    {displayName[0]}
                                    </div>
                                )}
                                </div>
                                <div style={{ marginTop: activePlatform === "STORY" ? 24 : 16, fontSize: activePlatform === "STORY" ? 34 : 28, fontWeight: 900, color: brand.primary_color, textAlign: "center", letterSpacing: "-0.01em" }}>{displayName}</div>
                                <div style={{ fontSize: activePlatform === "STORY" ? 18 : 14, color: "#64748b", fontWeight: 600, marginTop: 4, textAlign: "center" }}>{profession}</div>
                            </div>
                            
                            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: activePlatform === "STORY" ? 40 : 24 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: '0.1em' }}>{brand.hashtag}</div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>CODE · CONNECT · GROW</div>
                            </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
