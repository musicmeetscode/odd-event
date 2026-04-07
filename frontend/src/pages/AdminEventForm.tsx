import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
import { ArrowLeft, Save, Plus, RefreshCw, UsersRound, Award, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import type { EventType, Event, Partner, Signatory } from "@/types/api";
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
  const eventId = id || "";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>("hackathon");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [allowTeams, setAllowTeams] = useState(false);
  const [maxTeamSize, setMaxTeamSize] = useState("5");
  const [buddyGroupSize, setBuddyGroupSize] = useState("5");
  
  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [recurrenceDayOfWeek, setRecurrenceDayOfWeek] = useState<string>("0");
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<string>("1");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  // Certificate Assets
  const [selectedPartners, setSelectedPartners] = useState<number[]>([]);
  const [sig1, setSig1] = useState<string>("none");
  const [sig2, setSig2] = useState<string>("none");
  const [sig3, setSig3] = useState<string>("none");

  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsService.getEvent(eventId),
    enabled: isEdit,
  });

  const { data: partners } = useQuery({
    queryKey: ["partners"],
    queryFn: eventsService.listPartners,
  });

  const { data: signatories } = useQuery({
    queryKey: ["signatories"],
    queryFn: eventsService.listSignatories,
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
      setRecurrenceDayOfWeek(event.recurrence_day_of_week !== undefined && event.recurrence_day_of_week !== null ? String(event.recurrence_day_of_week) : "0");
      setRecurrenceDayOfMonth(event.recurrence_day_of_month ? String(event.recurrence_day_of_month) : "1");
      setRecurrenceEndDate(event.recurrence_end_date ? event.recurrence_end_date.slice(0, 10) : "");
      
      // Load assets
      setSelectedPartners(event.partners?.map((p: Partner) => p.id) || []);
      setSig1(event.signatory_1?.id ? String(event.signatory_1.id) : "none");
      setSig2(event.signatory_2?.id ? String(event.signatory_2.id) : "none");
      setSig3(event.signatory_3?.id ? String(event.signatory_3.id) : "none");
      setBuddyGroupSize(event.buddy_group_size ? String(event.buddy_group_size) : "5");
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
        recurrence_day_of_week: isRecurring && recurrenceType === "weekly" ? parseInt(recurrenceDayOfWeek) : null,
        recurrence_day_of_month: isRecurring && recurrenceType === "monthly" ? parseInt(recurrenceDayOfMonth) : null,
        recurrence_end_date: isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
        // Relational assets
        partners: selectedPartners,
        signatory_1: sig1 === "none" ? null : parseInt(sig1),
        signatory_2: sig2 === "none" ? null : parseInt(sig2),
        signatory_3: sig3 === "none" ? null : parseInt(sig3),
        buddy_group_size: parseInt(buddyGroupSize) || 5,
      };

      if (isEdit) {
        return eventsService.patchEvent(eventId, payload as unknown as Partial<Event>);
      } else {
        return eventsService.createEvent(payload as unknown as Partial<Event>);
      }
    },
    onSuccess: (data) => {
      toast.success(isEdit ? "Event updated! 🚀" : "Event created! 🎉");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      navigate(`/events/${data.uuid || data.id}`);
    },
    onError: (error: any) => { // Using any for Axios error response access is common pattern here
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

  const togglePartner = (id: number) => {
    setSelectedPartners(prev => 
        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
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
      <div className="max-w-2xl mx-auto px-4 py-8 pt-24">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
          onClick={() => navigate(isEdit ? `/events/${eventId}` : "/events")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> {isEdit ? "Back to Event" : "Back to Events"}
        </Button>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              {isEdit ? <Save className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
              {isEdit ? "Edit Event" : "Create Event"}
            </CardTitle>
            <Link to="/admin/assets">
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings2 className="w-4 h-4" /> Manage Assets
                </Button>
            </Link>
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

              {/* Certificate Branding */}
              <div className="pt-6 border-t border-border/50 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-primary" />
                  <Label className="text-base font-bold">Certificate Branding</Label>
                </div>
                
                <div className="space-y-3">
                  <Label>Event Partners (Max 3 visible on certificate)</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 max-h-40 overflow-y-auto">
                    {partners?.map((p: Partner) => (
                      <div key={p.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`partner-${p.id}`} 
                            checked={selectedPartners.includes(p.id)} 
                            onCheckedChange={() => togglePartner(p.id)}
                        />
                        <label htmlFor={`partner-${p.id}`} className="text-sm font-medium leading-none cursor-pointer truncate">
                          {p.name}
                        </label>
                      </div>
                    ))}
                    {(!partners || partners.length === 0) && <p className="text-xs text-muted-foreground italic col-span-2">No partners found. Create some in Assets.</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Signatory 1</Label>
                        <Select value={sig1} onValueChange={setSig1}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {signatories?.map((s: Signatory) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Signatory 2</Label>
                        <Select value={sig2} onValueChange={setSig2}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {signatories?.map((s: Signatory) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Signatory 3</Label>
                        <Select value={sig3} onValueChange={setSig3}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {signatories?.map((s: Signatory) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              </div>

              {/* Team Settings */}
              <div className="pt-6 border-t border-border/50">
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

              {/* Networking / Buddy Groups */}
              <div className="pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <Label className="text-base font-semibold">Networking Settings</Label>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="buddyGroupSize">Buddy Group Size</Label>
                    <p className="text-xs text-muted-foreground mb-1">
                      The number of attendees to group together during buddy group generation.
                    </p>
                    <Input
                      id="buddyGroupSize"
                      type="number"
                      min="2"
                      max="50"
                      value={buddyGroupSize}
                      onChange={(e) => setBuddyGroupSize(e.target.value)}
                      className="max-w-[120px]"
                    />
                  </div>
                </div>
              </div>

              {/* Recurrence Settings */}
              <div className="pt-6 border-t border-border/50">
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

                    {recurrenceType === "weekly" && (
                      <div className="space-y-2">
                        <Label htmlFor="recurrenceDayOfWeek">Repeats On</Label>
                        <Select value={recurrenceDayOfWeek} onValueChange={setRecurrenceDayOfWeek}>
                          <SelectTrigger id="recurrenceDayOfWeek">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Monday</SelectItem>
                            <SelectItem value="1">Tuesday</SelectItem>
                            <SelectItem value="2">Wednesday</SelectItem>
                            <SelectItem value="3">Thursday</SelectItem>
                            <SelectItem value="4">Friday</SelectItem>
                            <SelectItem value="5">Saturday</SelectItem>
                            <SelectItem value="6">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {recurrenceType === "monthly" && (
                      <div className="space-y-2">
                        <Label htmlFor="recurrenceDayOfMonth">Day of Month</Label>
                        <Input
                          id="recurrenceDayOfMonth"
                          type="number"
                          min="1"
                          max="31"
                          value={recurrenceDayOfMonth}
                          onChange={(e) => setRecurrenceDayOfMonth(e.target.value)}
                        />
                      </div>
                    )}

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
