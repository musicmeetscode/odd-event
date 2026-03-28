import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2, Award } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas-pro";
import type { CertificateData } from "@/types/api";

const Certificate = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();
  const certRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsService.getEvent(eventId),
  });
  const { data: cert, isLoading, error } = useQuery<CertificateData>({
    queryKey: ["certificate", eventId],
    queryFn: () => adminService.getCertificate(eventId),
  });

  const handleDownload = async () => {
    if (!certRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(certRef.current, { useCORS: true, scale: 3, backgroundColor: null });
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `certificate-${cert?.attendee_name || "attendee"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsGenerating(false);
      }, "image/png");
    } catch {
      toast.error("Failed to generate certificate.");
      setIsGenerating(false);
    }
  };

  if (isLoading) return <div className="flex justify-center pt-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error || !cert) return (
    <div className="max-w-md mx-auto pt-32 text-center">
      <p className="text-muted-foreground">You need to be registered for this event to get a certificate.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate(`/events/${eventId}`)}>Back to Event</Button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pt-20">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${eventId}`)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Your Certificate</h1>
          <p className="text-sm text-muted-foreground">{event?.title}</p>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <Button onClick={handleDownload} disabled={isGenerating}>
          <Download className="h-4 w-4 mr-1" />{isGenerating ? "Generating..." : "Download Certificate"}
        </Button>
      </div>

      <div className="flex justify-center">
        <div
          ref={certRef}
          style={{
            width: 800,
            height: 560,
            position: "relative",
            overflow: "hidden",
            fontFamily: "'Inter', 'Georgia', serif",
            background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
            borderRadius: 16,
            border: "3px solid #2962FF",
          }}
        >
          {/* Border accent */}
          <div style={{ position: "absolute", inset: 12, border: "1px solid rgba(41, 98, 255, 0.2)", borderRadius: 8 }} />

          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 32 }}>
            <img src="/logo.png" alt="Blue Ox" style={{ width: 48, height: 48 }} crossOrigin="anonymous" />
          </div>

          {/* Title */}
          <div style={{ textAlign: "center", paddingTop: 8 }}>
            <div style={{ fontSize: 12, letterSpacing: 4, textTransform: "uppercase", color: "#F58220", fontWeight: 600 }}>
              Certificate of {cert.submission ? "Achievement" : "Attendance"}
            </div>
            <div style={{ fontSize: 32, fontWeight: 300, color: "#1a1a2e", marginTop: 4 }}>
              Blue Ox Events
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
            <div style={{ width: 120, height: 2, background: "linear-gradient(90deg, transparent, #2962FF, transparent)" }} />
          </div>

          {/* Body */}
          <div style={{ textAlign: "center", padding: "0 60px" }}>
            <div style={{ fontSize: 14, color: "#666" }}>This is to certify that</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#2962FF", marginTop: 4 }}>{cert.attendee_name}</div>
            {cert.attendee_profession && (
              <div style={{ fontSize: 14, color: "#888", marginTop: 2 }}>{cert.attendee_profession}</div>
            )}
            <div style={{ fontSize: 14, color: "#666", marginTop: 12 }}>
              has successfully {cert.status === "checked_in" ? "attended" : "participated in"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a2e", marginTop: 4 }}>
              {cert.event_title}
            </div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
              {cert.event_date} • {cert.event_location}
            </div>
          </div>

          {/* Submission info */}
          {cert.submission && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#F58220", fontWeight: 600 }}>
                Project: {cert.submission.title} — Score: {cert.submission.score}
              </div>
            </div>
          )}

          {/* Award icon */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <Award style={{ width: 32, height: 32, color: "#F58220" }} />
          </div>

          {/* Bottom bar */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: "linear-gradient(90deg, #2962FF, #F58220)" }} />
        </div>
      </div>
    </div>
  );
};

export default Certificate;
