import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Plus, RefreshCw, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import type { EventType } from "@/types/api";
import { cn } from "@/lib/utils";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "hackathon", label: "Hackathon" },
  { value: "competition", label: "Competition" },
  { value: "conference", label: "Conference" },
  { value: "workshop", label: "Workshop" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Other" },
];

const AdminEventForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>("hackathon");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [allowTeams, setAllowTeams] = useState(false);
  const [maxTeamSize, setMaxTeamSize] = useState("5");
  
  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["event", id],
    queryFn: () => eventsService.getEvent(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setEventType(event.event_type || "hackathon");
      setStartDate(event.start_date ? event.start_date.slice(0, 16) : "");
      setEndDate(event.end_date ? event.end_date.slice(0, 16) : "");
      setLocation(event.location || "");
      setMaxAttendees(event.max_attendees ? String(event.max_attendees) : "");
      setAllowTeams(event.allow_teams || false);
      setMaxTeamSize(event.max_team_size ? String(event.max_team_size) : "5");
      setIsRecurring(event.is_recurring || false);
      setRecurrenceType(event.recurrence_type || "weekly");
      setRecurrenceEndDate(event.recurrence_end_date ? event.recurrence_end_date.slice(0, 10) : "");
    }
  }, [event]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description,
        event_type: eventType,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        location,
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
        allow_teams: allowTeams,
        max_team_size: parseInt(maxTeamSize) || 5,
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : null,
        recurrence_end_date: isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
      };

      if (isEdit) {
        return eventsService.patchEvent(Number(id), payload);
      } else {
        return eventsService.createEvent(payload);
      }
    },
    onSuccess: (data) => {
      toast.success(isEdit ? "Event updated! 🚀" : "Event created! 🎉");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ["event", id] });
      navigate(`/events/${data.id}`);
    },
    onError: (error: { response?: { data?: { detail?: string; error?: string } } }) => {
      const msg = error.response?.data?.detail || error.response?.data?.error || "An error occurred.";
      toast.error(String(msg));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Event title is required.");
      return;
    }
    mutation.mutate();
  };

  if (isEdit && isLoadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
          onClick={() => navigate(isEdit ? `/events/${id}` : "/events")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> {isEdit ? "Back to Event" : "Back to Events"}
        </Button>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {isEdit ? <Save className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
              {isEdit ? "Edit Event" : "Create Event"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Awesome Event"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell attendees about this event..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Venue or online"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Max Attendees</Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
              </div>

              {/* Team Settings */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UsersRound className={cn("h-5 w-5", allowTeams ? "text-primary" : "text-slate-400")} />
                    <Label htmlFor="allowTeams" className="font-semibold cursor-pointer">Allow Team Submissions</Label>
                  </div>
                  <Switch
                    id="allowTeams"
                    checked={allowTeams}
                    onCheckedChange={setAllowTeams}
                  />
                </div>

                {allowTeams && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="maxTeamSize">Max Members per Team</Label>
                    <Input
                      id="maxTeamSize"
                      type="number"
                      value={maxTeamSize}
                      onChange={(e) => setMaxTeamSize(e.target.value)}
                      placeholder="Default is 5"
                      min="1"
                      className="max-w-[200px]"
                    />
                  </div>
                )}
              </div>

              {/* Recurrence Settings */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Series Info</Label>
                    <p className="text-sm text-muted-foreground">
                      {isEdit ? "Update series configuration" : "Set up a recurring event series"}
                    </p>
                  </div>
                  <Switch 
                    checked={isRecurring} 
                    onCheckedChange={setIsRecurring} 
                  />
                </div>

                {isRecurring && (
                  <div className="grid gap-4 sm:grid-cols-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceType">Type</Label>
                      <Select 
                        value={recurrenceType} 
                        onValueChange={(v: "daily" | "weekly" | "monthly") => setRecurrenceType(v)}
                      >
                        <SelectTrigger id="recurrenceType">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceEnd">End Date</Label>
                      <Input
                        id="recurrenceEnd"
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        required={isRecurring}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Event")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminEventForm;
