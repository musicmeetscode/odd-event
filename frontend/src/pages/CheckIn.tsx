import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CheckCircle2, UserCheck, ArrowLeft, Calendar, MapPin, Users,
  Loader2, Download, ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas-pro";
import type { Event } from "@/types/api";

const CheckIn = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    detail: string;
    username: string;
    display_name: string;
    event_title: string;
    account_created: boolean;
    default_password: string | null;
  } | null>(null);

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

  const toTitleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !profession.trim() || !selectedEvent) {
      toast.error("Name and Profession are required.");
      return;
    }

    if (name.trim().length < 3 || profession.trim().length < 3) {
      toast.error("Name and Profession must be at least 3 characters.");
      return;
    }

    const safePattern = /^[a-zA-Z0-9 .-]+$/;
    if (!safePattern.test(name) || !safePattern.test(profession)) {
      toast.error("Name and Profession can only contain alphanumeric characters, spaces, dots, and hyphens.");
      return;
    }

    if (phone && !/^[0-9+ ]+$/.test(phone)) {
      toast.error("Phone number can only contain digits, spaces and '+'.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedName = toTitleCase(name.trim());
      const data = await authService.checkIn(
        selectedEvent.id,
        formattedName,
        toTitleCase(profession.trim()),
        email || undefined,
        phone || undefined
      );
      setResult({ ...data, display_name: formattedName });
      toast.success("Checked in! 🎉");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Check-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDP = async () => {
    if (!dpRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const canvas = await html2canvas(dpRef.current, {
        useCORS: true,
        scale: 3,
        backgroundColor: null,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${(name || "blueox").replace(/\s+/g, "_")}-dp.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsGenerating(false);
      }, "image/png");
    } catch {
      toast.error("Failed to generate DP.");
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSelectedEvent(null);
    setName("");
    setProfession("");
    setEmail("");
    setPhone("");
    setProfileImage(null);
  };

  // ─── Success state with DP ───
  if (result) {
    const eventTitle = result.event_title || selectedEvent?.title || "Blue Ox Events";
    const eventDate = selectedEvent?.start_date
      ? format(new Date(selectedEvent.start_date), "MMM d, yyyy")
      : "";
    const eventLocation = selectedEvent?.location || "";

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-2xl mx-auto py-8">
          {/* Success message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're In! 🎉</h2>
            <p className="text-muted-foreground">
              Welcome to <span className="font-semibold text-foreground">{eventTitle}</span>
            </p>
          </div>

          {/* Account info */}
          {result.account_created && result.default_password && (
            <Card className="mb-6 border-primary/20">
              <CardContent className="pt-4 pb-4 text-sm">
                <p className="font-medium text-primary mb-2">Account Created!</p>
                <p>
                  Username: <span className="font-mono font-semibold">{result.username}</span>
                </p>
                <p>
                  Default password: <span className="font-mono font-semibold">{result.default_password}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll be asked to set a new password when you sign in.
                </p>
              </CardContent>
            </Card>
          )}

          {/* DP Preview Card */}
          <Card className="mb-6 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Event DP</CardTitle>
              <p className="text-sm text-muted-foreground">
                {profileImage
                  ? "Your DP is ready! Download it below."
                  : "Upload a photo to generate your personalized event DP."}
              </p>
            </CardHeader>
            <CardContent>
              {/* Upload photo */}
              <div className="flex gap-2 mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  {profileImage ? "Change Photo" : "Upload Photo"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleDownloadDP}
                  disabled={!profileImage || isGenerating}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isGenerating ? "Generating..." : "Download DP"}
                </Button>
              </div>

              {/* The DP render target */}
              <div className="flex justify-center">
                <div
                  ref={dpRef}
                  style={{
                    width: 500,
                    height: 500,
                    position: "relative",
                    overflow: "hidden",
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    background: "#ffffff",
                    borderRadius: 16,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                >
                  {/* Subtle top brand bar */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "linear-gradient(90deg, #2962FF, #F58220)" }} />

                  {/* Top bar with logo */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "24px 24px 0",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <img
                      src="/logo.png"
                      alt="Blue Ox"
                      style={{ width: 36, height: 36 }}
                      crossOrigin="anonymous"
                    />
                    <span
                      style={{
                        color: "#F58220",
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      Blue Ox Events
                    </span>
                  </div>

                  {/* "I will be at" badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      position: "relative",
                      zIndex: 1,
                      marginTop: 12,
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(41, 98, 255, 0.08)",
                        border: "1px solid rgba(41, 98, 255, 0.2)",
                        borderRadius: 20,
                        padding: "4px 16px",
                        color: "#2962FF",
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      ✓ I will be at
                    </div>
                  </div>

                  {/* Event title */}
                  <div
                    style={{
                      textAlign: "center",
                      padding: "12px 24px 0",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#111827",
                        lineHeight: 1.2,
                      }}
                    >
                      {eventTitle}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 16,
                        marginTop: 6,
                        fontSize: 12,
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      {eventDate && <span>📅 {eventDate}</span>}
                      {eventLocation && <span>📍 {eventLocation}</span>}
                    </div>
                  </div>

                  {/* Profile photo + name section */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "24px 24px 0",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {/* Photo */}
                    <div
                      style={{
                        width: 180,
                        height: 180,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "4px solid #ffffff",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                        background: "#f3f4f6",
                      }}
                    >
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 64,
                            fontWeight: 700,
                            color: "#2962FF",
                            background: "rgba(41, 98, 255, 0.1)",
                          }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div
                      style={{
                        marginTop: 16,
                        fontSize: 28,
                        fontWeight: 800,
                        color: "#111827",
                        textAlign: "center",
                        lineHeight: 1.1,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {name || "Your Name"}
                    </div>

                    {/* Profession */}
                    <div
                      style={{
                        fontSize: 16,
                        color: "#4b5563",
                        fontWeight: 500,
                        marginTop: 4,
                        textAlign: "center",
                      }}
                    >
                      {profession || ""}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              Check In Another Person
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 2: Fill in details ───
  if (selectedEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center pb-2 relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4"
              onClick={() => setSelectedEvent(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <img src="/logo.png" alt="Blue Ox Events" className="w-12 h-12 mx-auto mb-2" />
            <CardTitle className="text-xl">Check In</CardTitle>
            <Badge variant="outline" className="mx-auto mt-1">{selectedEvent.title}</Badge>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">Profession / Title *</Label>
                <Input
                  id="profession"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Software Developer"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+256..."
                />
              </div>

              {/* Pre-upload photo */}
              <div className="space-y-2">
                <Label>Profile Photo (for your event DP)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  {profileImage ? "✓ Photo Selected — Change" : "Upload Photo"}
                </Button>
              </div>

              <Button type="submit" className="w-full h-12 text-base gap-2" disabled={isSubmitting}>
                <UserCheck className="h-5 w-5" />
                {isSubmitting ? "Checking in..." : "Check In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Step 1: Pick an event ───
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Blue Ox Events" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-3xl font-bold tracking-tight">Event Check-In</h1>
          <p className="text-muted-foreground mt-1">Select an event to check in</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : activeEvents.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeEvents.map((event: Event) => (
              <Card
                key={event.id}
                className="border-border/50 cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
                onClick={() => setSelectedEvent(event)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{event.event_type}</Badge>
                    {event.is_competition && (
                      <Badge className="bg-secondary/80 text-white text-xs">Competition</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.start_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{format(new Date(event.start_date), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{event.attendee_count} attendees</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <UserCheck className="h-4 w-4 mr-1" /> Check In Here
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No active events at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
