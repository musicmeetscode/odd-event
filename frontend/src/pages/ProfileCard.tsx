import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2, Share2, Briefcase, MapPin, Calendar, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas-pro";
import { brand } from "@/config/brandConfig";

const ProfileCard = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const id = Number(eventId);
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-card", id],
    queryFn: () => eventsService.getProfileCard(id),
  });

  const { data: event } = useQuery({
    queryKey: ["event", id],
    queryFn: () => eventsService.getEvent(id),
  });

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 100)); // Ensure styles are applied
      const canvas = await html2canvas(cardRef.current, { 
        useCORS: true, 
        scale: 3, 
        backgroundColor: null,
        logging: false
      });
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `profile-card-${profile?.name || "user"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsGenerating(false);
        toast.success("Profile card saved!");
      }, "image/png");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate card.");
      setIsGenerating(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!profile) return (
    <div className="max-w-md mx-auto pt-32 text-center">
      <p className="text-muted-foreground">Profile not found or access denied.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate(`/events/${id}`)}>Back to Event</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8 pt-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${id}`)}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Digital Profile Card</h1>
              <p className="text-sm text-slate-500">Sharable card for {event?.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${profile.name}'s Profile`,
                  text: `Check out my profile for ${event?.title}!`,
                  url: window.location.href,
                }).catch(() => toast.error("Sharing failed"));
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard!");
              }
            }}>
              <Share2 className="h-4 w-4 mr-1.5" /> Share
            </Button>
            <Button onClick={handleDownload} disabled={isGenerating}>
              <Download className="h-4 w-4 mr-1.5" /> {isGenerating ? "Exporting..." : "Download PNG"}
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <div
            ref={cardRef}
            className="w-[400px] bg-white rounded-[32px] overflow-hidden shadow-2xl relative"
            style={{ 
              fontFamily: "'Inter', sans-serif",
              border: "1px solid rgba(0,0,0,0.05)"
            }}
          >
            {/* Header Background */}
            <div className="h-40 bg-gradient-to-br from-blue-600 to-indigo-700 relative">
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
                  <img src={brand.logo} alt={brand.name} className="w-5 h-5 invert" crossOrigin="anonymous" />
                </div>
                <span className="text-white text-xs font-bold tracking-widest uppercase opacity-80">{brand.fullName}</span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="px-8 pb-10 -mt-16 relative">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-[28px] bg-white p-1.5 shadow-xl">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover rounded-[22px]" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 rounded-[22px] flex items-center justify-center font-bold text-slate-300 text-4xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center text-white">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">{profile.name}</h2>
                  <p className="text-blue-600 font-bold text-sm tracking-wide uppercase mt-1">{profile.role}</p>
                </div>

                <div className="space-y-2 pt-2">
                  {profile.profession && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Briefcase className="w-4 h-4 opacity-70" />
                      <span className="text-sm font-medium">{profile.profession}</span>
                    </div>
                  )}
                  {event?.location && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <MapPin className="w-4 h-4 opacity-70" />
                      <span className="text-sm font-medium">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-slate-600">
                    <Calendar className="w-4 h-4 opacity-70" />
                    <span className="text-sm font-medium">May 2026</span>
                  </div>
                </div>

                {profile.bio && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 italic">
                      "{profile.bio}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Event Participant 2026
              </div>
              <div className="text-[10px] text-blue-600 font-black uppercase">
                {brand.website}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
