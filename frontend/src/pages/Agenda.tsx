import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, MapPin, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { Session } from "@/types/api";

const SESSION_COLORS: Record<string, string> = {
  keynote: "bg-purple-500/10 border-purple-500/30 text-purple-500",
  talk: "bg-blue-500/10 border-blue-500/30 text-blue-500",
  workshop: "bg-green-500/10 border-green-500/30 text-green-500",
  panel: "bg-orange-500/10 border-orange-500/30 text-orange-500",
  break: "bg-gray-500/10 border-gray-500/30 text-gray-500",
  other: "bg-slate-500/10 border-slate-500/30 text-slate-500",
};

const Agenda = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = id || "";
  const navigate = useNavigate();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsService.getEvent(eventId),
  });
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions", eventId],
    queryFn: () => eventsService.getEventSessions(eventId),
  });

  if (eventLoading || isLoading) return <div className="flex justify-center pt-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  // Group sessions by date
  const grouped: Record<string, Session[]> = {};
  (sessions || []).forEach((s: Session) => {
    const dateKey = format(new Date(s.start_time), "yyyy-MM-dd");
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(s);
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pt-20">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${eventId}`)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">{event?.title}</p>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No sessions scheduled yet.</p>
      ) : (
        Object.entries(grouped).map(([date, daySessions]) => (
          <div key={date} className="mb-8">
            <h2 className="text-lg font-semibold mb-3 sticky top-16 bg-background py-2 z-10">
              {format(new Date(date), "EEEE, MMMM d, yyyy")}
            </h2>
            <div className="relative pl-6 border-l-2 border-border space-y-4">
              {daySessions.map((s: Session) => {
                const colorClass = SESSION_COLORS[s.session_type] || SESSION_COLORS.other;
                return (
                  <div key={s.id} className="relative">
                    <div className="absolute -left-[29px] top-2 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <Card
                      className={`border ${colorClass.split(" ").slice(1).join(" ")} cursor-pointer hover:shadow-md transition-shadow`}
                      onClick={() => navigate(`/events/${eventId}/sessions/${s.id}/questions`)}
                    >
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-[10px] ${colorClass}`}>{s.session_type}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(s.start_time), "h:mm a")}
                            {s.end_time && ` – ${format(new Date(s.end_time), "h:mm a")}`}
                          </span>
                        </div>
                        <h3 className="font-semibold">{s.title}</h3>
                        {s.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          {s.room_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.room_location}</span>}
                          {s.speaker_names.length > 0 && <span>🎤 {s.speaker_names.join(", ")}</span>}
                          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{s.question_count}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Agenda;
