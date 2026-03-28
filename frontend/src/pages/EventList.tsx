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
            <TabsTrigger value="mine">My Events</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : allEvents && allEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allEvents.map((event) => (
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
            {myEvents && myEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p>You haven't registered for any events yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default EventList;
