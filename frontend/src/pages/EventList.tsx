import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { eventsService } from "@/services/events";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EventList = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const { data: allEvents, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: eventsService.listEvents,
  });

  const { data: myEvents } = useQuery({
    queryKey: ["my-events"],
    queryFn: eventsService.getMyEvents,
  });

  const filteredEvents = useMemo(() => {
    if (!allEvents) return [];
    const now = new Date();
    const seenGroups = new Set<string>();

    return allEvents
      .filter(event => new Date(event.end_date) >= now)
      .filter(event => {
        if (event.recurrence_group_id) {
          if (seenGroups.has(event.recurrence_group_id)) return false;
          seenGroups.add(event.recurrence_group_id);
        }
        return true;
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [allEvents]);

  const filteredMyEvents = useMemo(() => {
    if (!myEvents) return [];
    const now = new Date();
    const seenGroups = new Set<string>();
    
    return myEvents
      .filter(event => new Date(event.end_date) >= now)
      .filter(event => {
        if (event.recurrence_group_id) {
          if (seenGroups.has(event.recurrence_group_id)) return false;
          seenGroups.add(event.recurrence_group_id);
        }
        return true;
      });
  }, [myEvents]);

  const filteredAttendedEvents = useMemo(() => {
    if (!myEvents) return [];
    const now = new Date();
    const seenGroups = new Set<string>();

    return myEvents
      .filter(event => new Date(event.end_date) < now)
      .filter(event => {
        if (event.recurrence_group_id) {
          if (seenGroups.has(event.recurrence_group_id)) return false;
          seenGroups.add(event.recurrence_group_id);
        }
        return true;
      });
  }, [myEvents]);

  const filteredPastEvents = useMemo(() => {
    if (!allEvents) return [];
    const now = new Date();
    const seenGroups = new Set<string>();

    return allEvents
      .filter(event => new Date(event.end_date) < now)
      .filter(event => {
        if (event.recurrence_group_id) {
          if (seenGroups.has(event.recurrence_group_id)) return false;
          seenGroups.add(event.recurrence_group_id);
        }
        return true;
      })
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }, [allEvents]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Events</h2>
          {role === "admin" && (
            <Button onClick={() => navigate("/events/create")}>
              <Plus className="h-4 w-4 mr-1" /> Create Event
            </Button>
          )}
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Events</TabsTrigger>
            {role !== "admin" && <TabsTrigger value="mine">My Events</TabsTrigger>}
            {role !== "admin" && <TabsTrigger value="attended">Attended</TabsTrigger>}
            {role === "admin" && <TabsTrigger value="past">Past Events</TabsTrigger>}
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredEvents && filteredEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No events yet. Check back soon!</p>
                {role === "admin" && (
                  <Button className="mt-4" onClick={() => navigate("/events/create")}>
                    <Plus className="h-4 w-4 mr-1" /> Create Your First Event
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mine">
            {filteredMyEvents && filteredMyEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMyEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p>You haven't registered for any upcoming events yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="attended">
            {filteredAttendedEvents && filteredAttendedEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAttendedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No past events found in your history.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPastEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No past events yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default EventList;
