import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/types/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  hackathon: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  competition: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  meeting: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  conference: "bg-green-500/10 text-green-500 border-green-500/20",
  workshop: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const navigate = useNavigate();
  const isPast = new Date(event.end_date) < new Date();

  return (
    <Card
      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 border-border/50 hover:border-primary/30"
      onClick={() => navigate(`/events/${event.uuid}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {(event.is_recurring || event.recurrence_group_id) && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 px-1.5 py-0">
                  <RefreshCw className="h-3 w-3" />
                  Series
                </Badge>
              )}
              <CardTitle className="text-lg leading-snug">{event.title}</CardTitle>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge
              variant="outline"
              className={cn(typeColors[event.event_type] || typeColors.other)}
            >
              {event.event_type}
            </Badge>
            {isPast && (
              <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/20 text-[10px] py-0">
                Past
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(event.start_date), "EEEE, MMM d, yyyy")}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {event.attendee_count}
            {event.max_attendees ? ` / ${event.max_attendees}` : ""} attending
          </span>
        </div>

        {event.is_registered && (
          <Badge variant="secondary" className="text-xs">
            ✓ Registered
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
