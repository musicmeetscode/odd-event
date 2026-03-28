import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, UserCircle } from "lucide-react";
import type { Speaker } from "@/types/api";

const Speakers = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsService.getEvent(eventId),
  });
  const { data: speakers, isLoading } = useQuery({
    queryKey: ["speakers", eventId],
    queryFn: () => adminService.listSpeakers(eventId),
  });

  if (isLoading) return <div className="flex justify-center pt-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pt-20">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${eventId}`)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Speakers</h1>
          <p className="text-sm text-muted-foreground">{event?.title}</p>
        </div>
      </div>

      {(speakers || []).length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No speakers yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(speakers || []).map((speaker: Speaker) => (
            <Card key={speaker.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex gap-4 p-4">
                  <div className="flex-shrink-0">
                    {speaker.avatar_url ? (
                      <img src={speaker.avatar_url} alt={speaker.display_name} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UserCircle className="h-10 w-10 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{speaker.display_name}</h3>
                    {speaker.profession && <p className="text-sm text-primary/80">{speaker.profession}</p>}
                    {speaker.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{speaker.bio}</p>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {speaker.sessions.map(s => (
                        <Badge key={s.id} variant="outline" className="text-[10px]">{s.title}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Speakers;
