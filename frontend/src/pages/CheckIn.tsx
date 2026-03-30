import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CheckCircle2, ArrowLeft, Calendar, MapPin, Users,
  Loader2, LogIn
} from "lucide-react";
import { format } from "date-fns";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import type { Event } from "@/types/api";
import { useBrand } from "@/contexts/BrandContext";

const CheckIn = () => {
  const { brand } = useBrand();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: eventsService.listEvents,
  });

  const activeEvents = events?.filter((e: Event) => e.is_active) || [];

  const onGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!selectedEvent) return;
    try {
      const data = await loginWithGoogle(credentialResponse.credential, selectedEvent.uuid);
      if (data.check_in_result) {
        toast.success("Checked in with Google! 🎉");
        // Redirect to the unified Profile Card (badge generator)
        navigate(`/profile/${selectedEvent.uuid}`);
      } else {
        toast.error("Authentication successful, but check-in failed.");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Google Sign-In failed.");
    }
  };

  if (selectedEvent) {
    return (
      <div className="flex items-center justify-center p-4 w-full h-full pt-20">
        <Card className="w-full max-w-md border-border/50 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
          <CardHeader className="text-center pb-8 pt-10 relative">
            <Button variant="ghost" size="sm" className="absolute left-4 top-4" onClick={() => setSelectedEvent(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <img src={brand.logo || "/logo.png"} alt={brand.name} className="w-16 h-16 mx-auto mb-4" />
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
    <div className="p-4 w-full h-full pt-20 bg-slate-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto py-8">
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
                key={event.uuid || event.id}
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
