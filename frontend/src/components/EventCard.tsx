import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/types/api";
import { format } from "date-fns";

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

  return (
    <Card
      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 border-border/50 hover:border-primary/30"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-snug">{event.title}</CardTitle>
          <Badge
            variant="outline"
            className={typeColors[event.event_type] || typeColors.other}
          >
            {event.event_type}
          </Badge>
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
            {format(new Date(event.start_date), "MMM d, yyyy")}
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
