import { useState } from "react";
import * as XLSX from "xlsx";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { adminService } from "@/services/admin";
import { teamsService } from "@/services/teams";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SubmissionCard } from "@/components/SubmissionCard";
import {
  ArrowLeft, Calendar, MapPin, Users, Trophy, MessageSquare,
  Loader2, QrCode, Link2, Plus, Trash2, BarChart3, UserCheck,
  UserPlus, Edit, Download, Clock, UserCircle, UsersRound,
  Check, X, Pencil, Search, Ban, LogIn, MoreHorizontal, Eye,
  Menu,
  Award, Settings2, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import type { Submission, Session, Team, Partner, Signatory, Event, JudgingCriteria } from "@/types/api";
import { getMediaUrl } from "@/lib/utils";

const TOTAL_SCORE_LIMIT = 100;

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = id || "";
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = role === "admin";

  // ─── Session form ───
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: "", description: "", session_type: "talk", start_time: "", end_time: "", room_location: "" });

  // ─── Team form ───
  const [teamName, setTeamName] = useState("");

  // ─── Judge form ───
  const [newJudge, setNewJudge] = useState({ username: "", display_name: "" });

  // ─── Criteria form ───
  const [newCriteria, setNewCriteria] = useState({ name: "", description: "", max_score: 10, weight: 1 });

  // ─── Criteria editing ───
  const [editingCriteriaId, setEditingCriteriaId] = useState<number | null>(null);
  const [editCriteriaForm, setEditCriteriaForm] = useState({ name: "", description: "", max_score: 10, weight: 1 });

  // ─── Attendee management ───
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [attendeeFilter, setAttendeeFilter] = useState<"all" | "registered" | "checked_in" | "cancelled">("all");

  // ─── Data queries ───
  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsService.getEvent(eventId),
  });
  const { data: submissions } = useQuery({
    queryKey: ["submissions", eventId],
    queryFn: () => eventsService.getSubmissions(eventId),
    enabled: event?.is_competition === true,
  });
  const { data: sessions } = useQuery({
    queryKey: ["sessions", eventId],
    queryFn: () => eventsService.getEventSessions(eventId),
  });
  const { data: attendees } = useQuery({
    queryKey: ["attendees", eventId],
    queryFn: () => adminService.listAttendees(eventId),
  });
  const { data: partners } = useQuery({
    queryKey: ["partners"],
    queryFn: () => eventsService.listPartners(),
    enabled: isAdmin,
  });
  const { data: signatories } = useQuery({
    queryKey: ["signatories"],
    queryFn: () => eventsService.listSignatories(),
    enabled: isAdmin,
  });
  const { data: teams } = useQuery({
    queryKey: ["teams", eventId],
    queryFn: () => teamsService.listTeams(eventId),
    enabled: event?.allow_teams === true,
  });
  const { data: analytics } = useQuery({
    queryKey: ["analytics", eventId],
    queryFn: () => adminService.getAnalytics(eventId),
    enabled: isAdmin,
  });
  const { data: assignedJudges } = useQuery({
    queryKey: ["judges", eventId],
    queryFn: () => adminService.listJudges(eventId),
    enabled: isAdmin,
  });
  const { data: allJudgeUsers } = useQuery({
    queryKey: ["users", "judge"],
    queryFn: () => adminService.listUsers("judge"),
    enabled: isAdmin,
  });

  // ─── Mutations ───
  const updateBrandingMutation = useMutation({
    mutationFn: (data: Partial<Event> | Record<string, any>) => eventsService.patchEvent(eventId, data as any),
    onSuccess: () => {
      toast.success("Branding updated");
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
    onError: () => toast.error("Update failed"),
  });
  const registerMutation = useMutation({
    mutationFn: () => eventsService.registerForEvent(eventId),
    onSuccess: () => { toast.success("Registered!"); queryClient.invalidateQueries({ queryKey: ["event", eventId] }); },
    onError: () => toast.error("Registration failed."),
  });
  const deleteEventMutation = useMutation({
    mutationFn: () => eventsService.deleteEvent(eventId),
    onSuccess: () => { toast.success("Event deleted."); navigate("/events"); },
    onError: () => toast.error("Delete failed."),
  });
  const createSessionMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => eventsService.createSession(eventId, data as Partial<Session>),
    onSuccess: () => { toast.success("Session created!"); setShowSessionForm(false); setSessionForm({ title: "", description: "", session_type: "talk", start_time: "", end_time: "", room_location: "" }); queryClient.invalidateQueries({ queryKey: ["sessions", eventId] }); },
    onError: () => toast.error("Failed to create session."),
  });
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: number) => eventsService.deleteSession(eventId, sessionId),
    onSuccess: () => { toast.success("Session deleted."); queryClient.invalidateQueries({ queryKey: ["sessions", eventId] }); },
  });
  const createTeamMutation = useMutation({
    mutationFn: (name: string) => teamsService.createTeam(eventId, name),
    onSuccess: () => { toast.success("Team created!"); setTeamName(""); queryClient.invalidateQueries({ queryKey: ["teams", eventId] }); },
    onError: () => toast.error("Failed to create team."),
  });
  const joinTeamMutation = useMutation({
    mutationFn: (teamId: number) => teamsService.joinTeam(eventId, teamId),
    onSuccess: () => { toast.success("Joined team!"); queryClient.invalidateQueries({ queryKey: ["teams", eventId] }); },
    onError: () => toast.error("Failed to join team."),
  });
  const createJudgeMutation = useMutation({
    mutationFn: () => adminService.createUser({ ...newJudge, role: "judge", password: brand.defaultPassword }),
    onSuccess: (data: { id: number }) => {
      adminService.assignJudge(eventId, data.id).then(() => {
        toast.success("Judge created & assigned!");
        setNewJudge({ username: "", display_name: "" });
        queryClient.invalidateQueries({ queryKey: ["judges", eventId] });
        queryClient.invalidateQueries({ queryKey: ["users", "judge"] });
      });
    },
    onError: () => toast.error("Failed to create judge."),
  });
  const assignJudgeMutation = useMutation({
    mutationFn: (judgeId: string | number) => adminService.assignJudge(eventId, judgeId),
    onSuccess: () => { toast.success("Judge assigned!"); queryClient.invalidateQueries({ queryKey: ["judges", eventId] }); },
    onError: () => toast.error("Failed to assign judge."),
  });
  const removeJudgeMutation = useMutation({
    mutationFn: (judgeId: string | number) => adminService.removeJudge(eventId, judgeId),
    onSuccess: () => { toast.success("Judge removed."); queryClient.invalidateQueries({ queryKey: ["judges", eventId] }); },
  });
  const createCriteriaMutation = useMutation({
    mutationFn: () => adminService.createCriteria(eventId, newCriteria),
    onSuccess: () => { toast.success("Criteria added!"); setNewCriteria({ name: "", description: "", max_score: 10, weight: 1 }); queryClient.invalidateQueries({ queryKey: ["event", eventId] }); },
    onError: () => toast.error("Failed to add criteria."),
  });
  const updateCriteriaMutation = useMutation({
    mutationFn: (data: { id: number; name: string; description: string; max_score: number; weight: number }) =>
      adminService.updateCriteria(eventId, data.id, { name: data.name, description: data.description, max_score: data.max_score, weight: data.weight }),
    onSuccess: () => { toast.success("Criteria updated!"); setEditingCriteriaId(null); queryClient.invalidateQueries({ queryKey: ["event", eventId] }); },
    onError: () => toast.error("Failed to update criteria."),
  });
  const deleteCriteriaMutation = useMutation({
    mutationFn: (criteriaId: number) => adminService.deleteCriteria(eventId, criteriaId),
    onSuccess: () => { toast.success("Criteria removed."); queryClient.invalidateQueries({ queryKey: ["event", eventId] }); },
  });

  // ─── Attendee management mutations ───
  const updateAttendeeMutation = useMutation({
    mutationFn: ({ registrationId, status }: { registrationId: number; status: string }) =>
      adminService.updateAttendeeStatus(eventId, registrationId, status),
    onSuccess: (data) => { toast.success(data.detail); queryClient.invalidateQueries({ queryKey: ["attendees", eventId] }); },
    onError: () => toast.error("Failed to update attendee status."),
  });
  const removeAttendeeMutation = useMutation({
    mutationFn: (registrationId: number) => adminService.removeAttendee(eventId, registrationId),
    onSuccess: (data) => { toast.success(data.detail); queryClient.invalidateQueries({ queryKey: ["attendees", eventId] }); queryClient.invalidateQueries({ queryKey: ["event", eventId] }); },
    onError: () => toast.error("Failed to remove attendee."),
  });

  if (isLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!event) return <div className="p-8 text-center">Event not found.</div>;

  const checkInUrl = `${window.location.origin}/check-in`;
  const eventUrl = `${window.location.origin}/events/${eventId}`;
  const unassignedJudges = (allJudgeUsers || []).filter(
    (u: { id: number }) => !(assignedJudges || []).some((a: { judge: number }) => a.judge === u.id)
  );

  const exportToExcel = (type: string) => {
    let data: Record<string, unknown>[] = [];
    const filename = `${event.title.replace(/[^a-zA-Z0-9]/g, "_")}_${type}`;

    if (type === "attendees") {
      data = (attendees || []).map((a: { name: string; username?: string; email?: string; profession?: string; status: string; registered_at: string }) => ({
        Name: a.name,
        Username: a.username || "",
        Email: a.email || "",
        Profession: a.profession || "",
        Status: a.status === "checked_in" ? "Checked In" : a.status === "cancelled" ? "Cancelled" : "Registered",
        "Registered At": a.registered_at ? format(new Date(a.registered_at), "MMM d, yyyy h:mm a") : "",
      }));
    } else if (type === "submissions") {
      data = (submissions || []).map((s: Submission) => ({
        Title: s.title,
        "Submitted By": s.submitted_by_name,
        Team: s.team_name || "—",
        Description: s.description,
        "Repo URL": s.repo_url,
        "Demo URL": s.demo_url,
        "Submitted At": s.submitted_at ? format(new Date(s.submitted_at), "MMM d, yyyy h:mm a") : "",
      }));
    } else if (type === "scores") {
      // Flatten submissions with their scores
      (submissions || []).forEach((s: Submission) => {
        if (s.scores && s.scores.length > 0) {
          s.scores.forEach((sc: Score) => {
            data.push({
              Submission: s.title,
              "Submitted By": s.submitted_by_name,
              Criteria: sc.criteria_name,
              "Max Score": sc.max_score,
              Score: sc.score,
              Judge: sc.judge_name,
              Comment: sc.comment,
              "Scored At": sc.scored_at ? format(new Date(sc.scored_at), "MMM d, yyyy h:mm a") : "",
            });
          });
        } else {
          data.push({
            Submission: s.title,
            "Submitted By": s.submitted_by_name,
            Criteria: "—",
            "Max Score": "—",
            Score: "No scores yet",
            Judge: "—",
            Comment: "",
            "Scored At": "",
          });
        }
      });
    }

    if (data.length === 0) {
      toast.error(`No ${type} data to export.`);
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));
    XLSX.writeFile(wb, `${filename}.xlsx`);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported!`);
  };

  // ─── Filter attendees ───
  const filteredAttendees = (attendees || []).filter((a: { name: string; username?: string; status: string; email?: string }) => {
    const matchesSearch = !attendeeSearch || 
      a.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      (a.username && a.username.toLowerCase().includes(attendeeSearch.toLowerCase())) ||
      (a.email && a.email.toLowerCase().includes(attendeeSearch.toLowerCase()));
    const matchesFilter = attendeeFilter === "all" || a.status === attendeeFilter;
    return matchesSearch && matchesFilter;
  });
  const attendeeCounts = {
    all: (attendees || []).length,
    registered: (attendees || []).filter((a: { status: string }) => a.status === "registered").length,
    checked_in: (attendees || []).filter((a: { status: string }) => a.status === "checked_in").length,
    cancelled: (attendees || []).filter((a: { status: string }) => a.status === "cancelled").length,
  };

  // ─── Event type theme colors ───
  const typeThemes: Record<string, { gradient: string; accent: string; bg: string }> = {
    hackathon: { gradient: "from-violet-600 via-purple-600 to-indigo-700", accent: "text-violet-600", bg: "bg-violet-50" },
    competition: { gradient: "from-orange-500 via-amber-500 to-yellow-600", accent: "text-orange-600", bg: "bg-orange-50" },
    conference: { gradient: "from-blue-600 via-cyan-600 to-teal-600", accent: "text-blue-600", bg: "bg-blue-50" },
    meeting: { gradient: "from-slate-600 via-slate-700 to-gray-800", accent: "text-slate-600", bg: "bg-slate-50" },
    workshop: { gradient: "from-emerald-600 via-teal-600 to-cyan-700", accent: "text-emerald-600", bg: "bg-emerald-50" },
    other: { gradient: "from-gray-600 via-slate-600 to-zinc-700", accent: "text-gray-600", bg: "bg-gray-50" },
  };
  const theme = typeThemes[event.event_type] || typeThemes.other;

  const sessionsCount = sessions?.length || 0;
  const submissionsCount = submissions?.length || 0;
  const teamsCount = teams?.length || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12 pt-16">
      {/* ═══════════ #1: Hero Header with Gradient ═══════════ */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} text-white p-6 md:p-8 mb-6 shadow-lg`}>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full" />

        <div className="relative z-10">
          {/* Actions menu — top right */}
          <div className="flex justify-end mb-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {(event.is_competition || event.event_type === "competition" || event.event_type === "hackathon") && (
                    <>
                      <DropdownMenuItem onClick={() => navigate(`/events/${eventId}/wall-of-fame`)} className="cursor-pointer">
                        <Trophy className="h-4 w-4 mr-2 text-yellow-500" />Wall of Fame
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/events/${eventId}/leaderboard`)} className="cursor-pointer">
                        <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />Leaderboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => navigate(`/events/${eventId}/edit`)} className="cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />Edit Event
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/events/${eventId}/certificate`)} className="cursor-pointer">
                        <Eye className="h-4 w-4 mr-2 text-indigo-500" />Preview Certificate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => event.certificates_released
                          ? adminService.unreleaseCertificates(eventId).then(() => queryClient.invalidateQueries({ queryKey: ["event", eventId] }))
                          : adminService.releaseCertificates(eventId).then(() => queryClient.invalidateQueries({ queryKey: ["event", eventId] }))}
                        className="cursor-pointer"
                      >
                        <Award className="h-4 w-4 mr-2 text-green-500" />
                        {event.certificates_released ? "Unrelease Certificates" : "Release Certificates"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => { if (confirm("Delete this event?")) deleteEventMutation.mutate(); }}
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />Delete Event
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
          </div>

          {/* Event details — full width */}
          <div>
                <div className="flex flex-wrap gap-2 -mt-8 mb-3">
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">{event.event_type}</Badge>
                  {event.is_competition && <Badge className="bg-yellow-400/20 text-yellow-100 border-0 text-xs">🏆 Competition</Badge>}
                  {event.allow_teams && <Badge className="bg-blue-400/20 text-blue-100 border-0 text-xs">👥 Teams</Badge>}
                  <Badge className={`border-0 text-xs ${event.is_active ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"}`}>
                    {event.is_active ? "● Active" : "● Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => navigate("/events")} className="text-white/70 hover:text-white hover:bg-white/10 -ml-2 shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight break-words">{event.title}</h1>
                </div>
                {event.description && (
                  <p className="mt-3 text-sm text-white/70 line-clamp-2 max-w-2xl">{event.description}</p>
                )}
                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-white/80">
                  {event.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0" />{event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 shrink-0" />{format(new Date(event.start_date), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0" />{format(new Date(event.start_date), "h:mm a")}
                    {event.end_date && ` – ${format(new Date(event.end_date), "h:mm a")}`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 shrink-0" />{event.attendee_count}{event.max_attendees ? ` / ${event.max_attendees}` : ""} attendees
                  </span>
                </div>
          </div>

          {/* Register button inside hero */}
          {!isAdmin && isAuthenticated && !event.is_registered && (
            <Button className="mt-4 bg-white text-slate-900 hover:bg-white/90 font-semibold" onClick={() => registerMutation.mutate()}>
              <UserCheck className="h-4 w-4 mr-1.5" />Register for this event
            </Button>
          )}
          {!isAdmin && event.is_registered && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white border-0 text-sm py-1 px-3">✓ You're registered</Badge>
              {event.certificates_released && (
                <Button size="sm" variant="secondary" onClick={() => navigate(`/events/${eventId}/certificate`)} className="bg-white text-slate-900 border-0">
                  <Download className="h-4 w-4 mr-1.5" />Download Certificate
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => navigate(`/profile/${eventId}`)} className="bg-white/20 text-white border-0 backdrop-blur-sm">
                <UserCircle className="h-4 w-4 mr-1.5" />My Profile Card
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ #2: Stat Cards Row ═══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Attendees", value: event.attendee_count, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Sessions", value: sessionsCount, icon: Clock, color: "text-emerald-600 bg-emerald-50" },
          ...((event.is_competition || event.event_type === "competition" || event.event_type === "hackathon") ? [{ label: "Submissions", value: submissionsCount, icon: Trophy, color: "text-amber-600 bg-amber-50" }] : []),
          ...(event.allow_teams ? [{ label: "Teams", value: teamsCount, icon: UsersRound, color: "text-purple-600 bg-purple-50" }] : []),
        ].map(stat => (
          <Card key={stat.label} className="border-border/40 hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold leading-tight">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground leading-tight">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══════════ #3: Pill-Style Tabs with Icons & Counts ═══════════ */}
      {/* #5: Sticky header (the tabs stick on scroll) */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 pt-1">
        <Tabs defaultValue="overview">
          <TabsList className="flex flex-wrap h-auto gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/40">
            <TabsTrigger value="overview" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-1.5 gap-1.5">
              <Calendar className="h-3.5 w-3.5" />Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-1.5 gap-1.5">
              <Clock className="h-3.5 w-3.5" />Sessions
              {sessionsCount > 0 && <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px] font-mono">{sessionsCount}</Badge>}
            </TabsTrigger>
            {(event.is_competition || event.event_type === "competition" || event.event_type === "hackathon") && (
              <TabsTrigger value="submissions" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-1.5 gap-1.5">
                <Trophy className="h-3.5 w-3.5" />Submissions
                {submissionsCount > 0 && <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px] font-mono">{submissionsCount}</Badge>}
              </TabsTrigger>
            )}
            {event.allow_teams && (
              <TabsTrigger value="teams" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-1.5 gap-1.5">
                <UsersRound className="h-3.5 w-3.5" />Teams
                {teamsCount > 0 && <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px] font-mono">{teamsCount}</Badge>}
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="manage" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-1.5 gap-1.5">
                <Edit className="h-3.5 w-3.5" />Manage
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="stats" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-1.5 gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />Stats
              </TabsTrigger>
            )}
          </TabsList>

        {/* ═══════════ Overview Tab ═══════════ */}
        {/* #4: Activity/timeline on Overview */}
        <TabsContent value="overview" className="space-y-5 mt-4">
          {/* Description */}
          {event.description && (
            <Card className="border-border/40">
              <CardContent className="pt-5">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">About This Event</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{event.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Sessions Timeline */}
          {sessionsCount > 0 && (
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${theme.accent}`} />Schedule
                  <Badge variant="secondary" className="text-[10px] font-mono">{sessionsCount} sessions</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* #6: Session cards with speaker avatars and timeline connector */}
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-1">
                    {(sessions || []).slice(0, 5).map((s: Session, idx: number) => (
                      <div
                        key={s.id}
                        className="relative flex items-start gap-4 pl-9 py-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/events/${eventId}/sessions/${s.id}/questions`)}
                      >
                        {/* Timeline dot */}
                        <div className={`absolute left-2.5 top-4 w-[11px] h-[11px] rounded-full border-2 border-background z-10 ${
                          idx === 0 ? `bg-gradient-to-br ${theme.gradient}` : "bg-muted-foreground/30"
                        }`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm group-hover:text-primary transition-colors">{s.title}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{s.session_type}</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="font-mono">{format(new Date(s.start_time), "h:mm a")}{s.end_time ? ` – ${format(new Date(s.end_time), "h:mm a")}` : ""}</span>
                            {s.room_location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{s.room_location}</span>}
                            <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{s.question_count}</span>
                          </div>
                        </div>

                        {/* Speaker avatars */}
                        {s.speaker_names.length > 0 && (
                          <div className="flex -space-x-2 shrink-0 mt-0.5">
                            {s.speaker_names.slice(0, 3).map((name, i) => (
                              <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-background flex items-center justify-center text-[10px] font-bold text-slate-600" title={name}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {s.speaker_names.length > 3 && (
                              <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] text-muted-foreground">
                                +{s.speaker_names.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {sessionsCount > 5 && (
                    <p className="text-xs text-muted-foreground text-center mt-2 pl-9">+ {sessionsCount - 5} more sessions</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attendees */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className={`h-4 w-4 ${theme.accent}`} />Attendees
                  <Badge variant="secondary" className="text-[10px] font-mono">{attendeeCounts.all}</Badge>
                </CardTitle>
                {isAdmin && attendeeCounts.all > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-0.5">
                      <UserCheck className="h-3 w-3" />{attendeeCounts.checked_in}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                      {attendeeCounts.registered} reg.
                    </Badge>
                    {attendeeCounts.cancelled > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-500 border-red-200">
                        {attendeeCounts.cancelled} canc.
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {isAdmin && attendeeCounts.all > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, username, or email..."
                      value={attendeeSearch}
                      onChange={(e) => setAttendeeSearch(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  <div className="flex gap-1">
                    {(["all", "registered", "checked_in", "cancelled"] as const).map(f => (
                      <Button
                        key={f}
                        variant={attendeeFilter === f ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs px-2.5"
                        onClick={() => setAttendeeFilter(f)}
                      >
                        {f === "checked_in" ? "Checked In" : f.charAt(0).toUpperCase() + f.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isAdmin ? (
                filteredAttendees.length > 0 ? (
                  <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                    {filteredAttendees.map((a: { id: number; user_id: number; name: string; username?: string; email?: string; profession?: string; status: string; is_flagged?: boolean; registered_at: string }) => (
                      <div key={a.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                        a.status === "checked_in" ? "bg-green-50/50 border-green-100" :
                        a.status === "cancelled" ? "bg-red-50/30 border-red-100 opacity-60" :
                        "bg-white border-slate-100 hover:bg-slate-50"
                      }`}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            a.status === "checked_in" ? "bg-green-100 text-green-700" :
                            a.status === "cancelled" ? "bg-red-100 text-red-600" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {a.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium truncate">{a.name}</span>
                              {a.is_flagged && <span title="Flagged name" className="cursor-help text-xs">🚩</span>}
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 font-mono ${
                                a.status === "checked_in" ? "text-green-600 border-green-300 bg-green-50" :
                                a.status === "cancelled" ? "text-red-500 border-red-300 bg-red-50" :
                                "text-slate-500 border-slate-300"
                              }`}>
                                {a.status === "checked_in" ? "✓ Checked In" : a.status === "cancelled" ? "✗ Cancelled" : "Registered"}
                              </Badge>
                            </div>
                            <div className="flex gap-3 text-[11px] text-muted-foreground mt-0.5">
                              {a.username && <span>@{a.username}</span>}
                              {a.profession && <span>• {a.profession}</span>}
                              {a.email && <span>• {a.email}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {a.status !== "checked_in" && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50" title="Check in" onClick={() => updateAttendeeMutation.mutate({ registrationId: a.id, status: "checked_in" })} disabled={updateAttendeeMutation.isPending}>
                              <UserCheck className="h-3.5 w-3.5 mr-1" />Check In
                            </Button>
                          )}
                          {a.status === "checked_in" && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Revert to registered" onClick={() => updateAttendeeMutation.mutate({ registrationId: a.id, status: "registered" })} disabled={updateAttendeeMutation.isPending}>
                              Undo
                            </Button>
                          )}
                          {a.status !== "cancelled" && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50" title="Cancel registration" onClick={() => updateAttendeeMutation.mutate({ registrationId: a.id, status: "cancelled" })} disabled={updateAttendeeMutation.isPending}>
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-red-50" title="Remove from event" onClick={() => { if (confirm(`Remove ${a.name}?`)) removeAttendeeMutation.mutate(a.id); }} disabled={removeAttendeeMutation.isPending}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {attendeeSearch || attendeeFilter !== "all" ? "No attendees match your filter." : "No attendees yet."}
                  </p>
                )
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {(attendees || []).slice(0, 20).map((a: { id: number; name: string; status: string; is_flagged?: boolean }) => (
                    <div key={a.id} className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm truncate">{a.name}</span>
                      {a.status === "checked_in" && <Badge variant="outline" className="text-[9px] px-1 py-0 text-green-600">✓</Badge>}
                    </div>
                  ))}
                  {(attendees || []).length > 20 && (
                    <p className="col-span-full text-xs text-muted-foreground text-center mt-2">+ {(attendees || []).length - 20} more</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ Sessions Tab ═══════════ */}
        <TabsContent value="sessions" className="space-y-4 mt-4">
          {isAdmin && (
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Sessions</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setShowSessionForm(!showSessionForm)}>
                    <Plus className="h-4 w-4 mr-1" />{showSessionForm ? "Cancel" : "Add Session"}
                  </Button>
                </div>
              </CardHeader>
              {showSessionForm && (
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Title *</Label><Input value={sessionForm.title} onChange={e => setSessionForm(p => ({ ...p, title: e.target.value }))} /></div>
                    <div><Label>Type</Label>
                      <Select value={sessionForm.session_type} onValueChange={v => setSessionForm(p => ({ ...p, session_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["talk", "workshop", "panel", "keynote", "break", "other"].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Start Time *</Label><Input type="datetime-local" value={sessionForm.start_time} onChange={e => setSessionForm(p => ({ ...p, start_time: e.target.value }))} /></div>
                    <div><Label>End Time</Label><Input type="datetime-local" value={sessionForm.end_time} onChange={e => setSessionForm(p => ({ ...p, end_time: e.target.value }))} /></div>
                    <div><Label>Room</Label><Input value={sessionForm.room_location} onChange={e => setSessionForm(p => ({ ...p, room_location: e.target.value }))} /></div>
                  </div>
                  <div><Label>Description</Label><Textarea value={sessionForm.description} onChange={e => setSessionForm(p => ({ ...p, description: e.target.value }))} /></div>
                  <Button size="sm" onClick={() => createSessionMutation.mutate(sessionForm)}>Create Session</Button>
                </CardContent>
              )}
            </Card>
          )}
          {/* #6: Session cards with speaker avatars and timeline connector */}
          {sessionsCount > 0 ? (
            <div className="relative">
              <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />
              <div className="space-y-2">
                {(sessions || []).map((s: Session, idx: number) => (
                  <Card key={s.id} className="relative ml-9 border-border/40 hover:shadow-md transition-all group">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[calc(2.25rem+5px)] top-5 w-[11px] h-[11px] rounded-full border-2 border-background z-10 ${
                      idx === 0 ? `bg-gradient-to-br ${theme.gradient}` : "bg-muted-foreground/30"
                    }`} />
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/events/${eventId}/sessions/${s.id}/questions`)}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.session_type}</Badge>
                          <span className="font-medium text-sm group-hover:text-primary transition-colors">{s.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-mono">{format(new Date(s.start_time), "h:mm a")}{s.end_time ? ` – ${format(new Date(s.end_time), "h:mm a")}` : ""}</span>
                          {s.room_location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{s.room_location}</span>}
                          <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{s.question_count} questions</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Speaker avatars */}
                        {s.speaker_names.length > 0 && (
                          <div className="flex -space-x-2">
                            {s.speaker_names.slice(0, 3).map((name, i) => (
                              <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-background flex items-center justify-center text-[10px] font-bold text-slate-600" title={name}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {s.speaker_names.length > 3 && <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] text-muted-foreground">+{s.speaker_names.length - 3}</div>}
                          </div>
                        )}
                        {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteSessionMutation.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : <p className="text-muted-foreground text-center py-8">No sessions yet.</p>}
        </TabsContent>

        {/* ═══════════ Submissions Tab ═══════════ */}
        {(event.is_competition || event.event_type === "competition" || event.event_type === "hackathon") && (
          <TabsContent value="submissions" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Submissions ({submissionsCount})</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/events/${eventId}/leaderboard`)}><Trophy className="h-4 w-4 mr-1" />Leaderboard</Button>
                <Button size="sm" onClick={() => navigate(`/events/${eventId}/submit`)}><Plus className="h-4 w-4 mr-1" />Submit</Button>
              </div>
            </div>
            {(submissions || []).map((s: Submission) => <SubmissionCard key={s.id} submission={s} />)}
          </TabsContent>
        )}

        {/* ═══════════ Teams Tab ═══════════ */}
        {event.allow_teams && (
          <TabsContent value="teams" className="space-y-4 mt-4">
            <Card className="border-border/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Create a Team</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="Team name" value={teamName} onChange={e => setTeamName(e.target.value)} />
                  <Button onClick={() => createTeamMutation.mutate(teamName)} disabled={!teamName.trim()}>
                    <Plus className="h-4 w-4 mr-1" />Create
                  </Button>
                </div>
              </CardContent>
            </Card>
            {(teams || []).map((t: Team) => (
              <Card key={t.id} className="border-border/40">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{t.name}</h4>
                      <p className="text-xs text-muted-foreground">{t.member_count}/{event.max_team_size} members</p>
                    </div>
                    {t.member_count < event.max_team_size && (
                      <Button size="sm" variant="outline" onClick={() => joinTeamMutation.mutate(t.id)}>Join</Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {t.members.map(m => (
                      <Badge key={m.id} variant={m.role === "leader" ? "default" : "outline"}>
                        {m.user_name || m.username} {m.role === "leader" && "⭐"}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        {/* ═══════════ Manage Tab (Admin) ═══════════ */}
        {isAdmin && (
          <TabsContent value="manage" className="space-y-4 mt-4">
            {/* Sharing */}
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Event URLs & QR</CardTitle>
                <CardDescription className="text-[10px]">Use these to share the event with others or for check-in.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Event Detail URL</Label>
                    <div className="flex flex-col items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <QRCodeCanvas value={eventUrl} size={140} level="H" includeMargin={true} className="rounded-md shadow-sm bg-white p-1" />
                      <div className="flex items-center gap-2 w-full">
                        <code className="text-[10px] bg-white border border-slate-200 px-2 py-1.5 rounded flex-1 truncate">{eventUrl}</code>
                        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(eventUrl); toast.success("Copied!"); }} className="h-8">Copy</Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Public Check-in URL</Label>
                    <div className="flex flex-col items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <QRCodeCanvas value={checkInUrl} size={140} level="H" includeMargin={true} className="rounded-md shadow-sm bg-white p-1" />
                      <div className="flex items-center gap-2 w-full">
                        <code className="text-[10px] bg-white border border-slate-200 px-2 py-1.5 rounded flex-1 truncate">{checkInUrl}</code>
                        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(checkInUrl); toast.success("Copied!"); }} className="h-8">Copy</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Judges */}
            <Card className="border-border/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Judges ({assignedJudges?.length || 0})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(assignedJudges || []).map((j: { id: number; judge_id: string; judge_name: string }) => (
                  <div key={j.id} className="flex items-center justify-between text-sm">
                    <span>{j.judge_name}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeJudgeMutation.mutate(j.judge_id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                {unassignedJudges.length > 0 && (
                  <Select onValueChange={v => assignJudgeMutation.mutate(v)}>
                    <SelectTrigger><SelectValue placeholder="Assign existing judge..." /></SelectTrigger>
                    <SelectContent>
                      {unassignedJudges.map((u: { uuid: string; id: number; display_name: string; username: string }) => (
                        <SelectItem key={u.uuid || u.id} value={String(u.uuid || u.id)}>{u.display_name || u.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Create & assign new judge:</p>
                  <div className="flex gap-2">
                    <Input placeholder="Username" value={newJudge.username} onChange={e => setNewJudge(p => ({ ...p, username: e.target.value }))} />
                    <Input placeholder="Display Name" value={newJudge.display_name} onChange={e => setNewJudge(p => ({ ...p, display_name: e.target.value }))} />
                    <Button size="sm" onClick={() => createJudgeMutation.mutate()} disabled={!newJudge.username}><UserPlus className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(() => {
              const criteria = event.judging_criteria || [];
              const currentTotal = criteria.reduce((sum: number, c: JudgingCriteria) => sum + c.max_score, 0);
              const remaining = TOTAL_SCORE_LIMIT - currentTotal;
              const progressPct = Math.min((currentTotal / TOTAL_SCORE_LIMIT) * 100, 100);
              const wouldExceed = newCriteria.max_score > remaining;

              const startEditing = (c: JudgingCriteria) => {
                setEditingCriteriaId(c.id);
                setEditCriteriaForm({ name: c.name, description: c.description || "", max_score: c.max_score, weight: c.weight });
              };
              const cancelEditing = () => setEditingCriteriaId(null);
              const saveEditing = (criteriaId: number) => {
                const otherTotal = criteria.filter((c: JudgingCriteria) => c.id !== criteriaId).reduce((sum: number, c: JudgingCriteria) => sum + c.max_score, 0);
                if (otherTotal + editCriteriaForm.max_score > TOTAL_SCORE_LIMIT) {
                  toast.error(`Max score would exceed the ${TOTAL_SCORE_LIMIT}-point limit. Only ${TOTAL_SCORE_LIMIT - otherTotal} points available.`);
                  return;
                }
                updateCriteriaMutation.mutate({ id: criteriaId, ...editCriteriaForm });
              };

              return (
                <div className="space-y-4">
                  <Card className="border-border/40">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Award className="h-4 w-4 text-primary" /> Certificate Branding
                            </CardTitle>
                            <Link to="/admin/assets" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                                <Settings2 className="w-3 h-3" /> Manage Assets
                            </Link>
                        </div>
                        <CardDescription className="text-[10px]">Configure partners and signatories for this event's certificates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        {/* Partners */}
                        <div className="space-y-3">
                            <Label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
                                Event Partners
                                {event?.partners?.length > 0 && <Badge variant="secondary" className="px-1.5 h-4 text-[9px]">{event.partners.length} selected</Badge>}
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {partners?.map((p: Partner) => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => {
                                            const current = event?.partners?.map((ep: Partner) => ep.id) || [];
                                            const next = current.includes(p.id) ? current.filter((id: number) => id !== p.id) : [...current, p.id];
                                            updateBrandingMutation.mutate({ partner_ids: next });
                                        }}
                                        className={`relative group cursor-pointer border rounded-xl p-2 transition-all hover:shadow-sm ${
                                            event?.partners?.some((ep: Partner) => ep.id === p.id) 
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                                            : "border-slate-100 bg-white hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center p-1 overflow-hidden">
                                                <img src={getMediaUrl(p.logo)} alt={p.name} className="max-w-full max-h-full object-contain" />
                                            </div>
                                            <span className="text-[10px] font-medium text-slate-700 text-center line-clamp-1">{p.name}</span>
                                        </div>
                                        <div className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                            event?.partners?.some((ep: Partner) => ep.id === p.id) 
                                            ? "bg-primary border-primary text-white" 
                                            : "bg-white border-slate-200"
                                        }`}>
                                            {event?.partners?.some((ep: Partner) => ep.id === p.id) && <Check className="w-2.5 h-2.5" />}
                                        </div>
                                    </div>
                                ))}
                                {(!partners || partners.length === 0) && (
                                    <div className="col-span-full py-6 text-center border border-dashed rounded-xl bg-slate-50">
                                        <p className="text-[11px] text-muted-foreground italic">No partners available. Add some in Asset Management.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Signatories */}
                        <div className="space-y-3">
                            <Label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
                                Signatories
                                {event?.signatories?.length > 0 && <Badge variant="secondary" className="px-1.5 h-4 text-[9px]">{event.signatories.length} selected</Badge>}
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {signatories?.map((s: Signatory) => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => {
                                            const current = event?.signatories?.map((es: Signatory) => es.id) || [];
                                            const next = current.includes(s.id) ? current.filter((id: number) => id !== s.id) : [...current, s.id];
                                            updateBrandingMutation.mutate({ signatory_ids: next });
                                        }}
                                        className={`relative group cursor-pointer border rounded-xl p-2 transition-all hover:shadow-sm ${
                                            event?.signatories?.some((es: Signatory) => es.id === s.id) 
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                                            : "border-slate-100 bg-white hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-1.5 pt-1">
                                            <div className="w-full h-8 flex items-center justify-center pointer-events-none">
                                                {s.signature ? (
                                                    <img src={getMediaUrl(s.signature)} alt="Signature" className="max-h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                                                ) : (
                                                    <div className="text-[8px] italic text-slate-300 uppercase tracking-tighter">No signature</div>
                                                )}
                                            </div>
                                            <div className="text-center w-full">
                                                <div className="text-[10px] font-bold text-slate-800 truncate">{s.name}</div>
                                                <div className="text-[8px] text-slate-500 truncate">{s.title}</div>
                                            </div>
                                        </div>
                                        <div className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                            event?.signatories?.some((es: Signatory) => es.id === s.id) 
                                            ? "bg-primary border-primary text-white" 
                                            : "bg-white border-slate-200"
                                        }`}>
                                            {event?.signatories?.some((es: Signatory) => es.id === s.id) && <Check className="w-2.5 h-2.5" />}
                                        </div>
                                    </div>
                                ))}
                                {(!signatories || signatories.length === 0) && (
                                    <div className="col-span-full py-6 text-center border border-dashed rounded-xl bg-slate-50">
                                        <p className="text-[11px] text-muted-foreground italic">No signatories available. Add some in Asset Management.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {updateBrandingMutation.isPending && (
                            <div className="flex items-center gap-2 px-1">
                                <Loader2 className="w-3 h-3 text-primary animate-spin" />
                                <p className="text-[10px] text-primary font-medium">Syncing changes...</p>
                            </div>
                        )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/40">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Judging Criteria</CardTitle>
                        <Badge variant={currentTotal === TOTAL_SCORE_LIMIT ? "default" : currentTotal > TOTAL_SCORE_LIMIT ? "destructive" : "outline"} className="text-xs font-mono">
                            {currentTotal} / {TOTAL_SCORE_LIMIT} pts
                        </Badge>
                        </div>
                        <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                currentTotal > TOTAL_SCORE_LIMIT ? 'bg-destructive' : currentTotal === TOTAL_SCORE_LIMIT ? 'bg-green-500' : 'bg-primary'
                            }`}
                            style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            {currentTotal === TOTAL_SCORE_LIMIT ? "✓ Total score fully allocated" : currentTotal > TOTAL_SCORE_LIMIT ? `⚠ Exceeds limit by ${currentTotal - TOTAL_SCORE_LIMIT} points` : `${remaining} points remaining`}
                        </p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {criteria.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No criteria added yet.</p>}
                      {criteria.map((c: JudgingCriteria) => (
                        <div key={c.id} className="border rounded-lg p-3 space-y-2">
                          {editingCriteriaId === c.id ? (
                            <>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[10px] text-muted-foreground">Name</Label><Input value={editCriteriaForm.name} onChange={e => setEditCriteriaForm(p => ({ ...p, name: e.target.value }))} className="h-8 text-sm" /></div>
                                <div><Label className="text-[10px] text-muted-foreground">Max Score</Label><Input type="number" min={1} value={editCriteriaForm.max_score} onChange={e => setEditCriteriaForm(p => ({ ...p, max_score: +e.target.value }))} className="h-8 text-sm" /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-[10px] text-muted-foreground">Weight</Label><Input type="number" min={0.1} step={0.1} value={editCriteriaForm.weight} onChange={e => setEditCriteriaForm(p => ({ ...p, weight: +e.target.value }))} className="h-8 text-sm" /></div>
                                <div><Label className="text-[10px] text-muted-foreground">Description</Label><Input value={editCriteriaForm.description} onChange={e => setEditCriteriaForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" className="h-8 text-sm" /></div>
                              </div>
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" onClick={cancelEditing}><X className="h-3.5 w-3.5 mr-1" />Cancel</Button>
                                <Button size="sm" onClick={() => saveEditing(c.id)} disabled={!editCriteriaForm.name || editCriteriaForm.max_score < 1}><Check className="h-3.5 w-3.5 mr-1" />Save</Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{c.name}</span>
                                  <Badge variant="secondary" className="text-[10px] font-mono">{c.max_score} pts</Badge>
                                  <Badge variant="outline" className="text-[10px] font-mono">×{c.weight}</Badge>
                                </div>
                                {c.description && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.description}</p>}
                              </div>
                              <div className="flex items-center gap-0.5">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEditing(c)}><Pencil className="h-3 w-3" /></Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteCriteriaMutation.mutate(c.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="border-t pt-3 mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">Add New Criteria</p>
                          {remaining > 0 && <span className="text-[10px] text-muted-foreground font-mono">{remaining} pts available</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Criteria name" value={newCriteria.name} onChange={e => setNewCriteria(p => ({ ...p, name: e.target.value }))} className="h-8 text-sm" />
                          <Input type="number" placeholder="Max score" min={1} max={remaining} value={newCriteria.max_score} onChange={e => setNewCriteria(p => ({ ...p, max_score: Math.max(1, +e.target.value) }))} className="h-8 text-sm" />
                        </div>
                        {wouldExceed && newCriteria.name && <p className="text-[10px] text-destructive">⚠ Adding {newCriteria.max_score} pts would exceed the {TOTAL_SCORE_LIMIT}-point limit. Max you can add: {remaining} pts.</p>}
                        <Button size="sm" onClick={() => createCriteriaMutation.mutate()} disabled={!newCriteria.name || wouldExceed || remaining <= 0}>
                          <Plus className="h-4 w-4 mr-1" />Add Criteria
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Export */}
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Export Data (Excel)</CardTitle>
                <p className="text-[10px] text-muted-foreground">Download .xlsx files generated from the loaded data.</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportToExcel("attendees")}>
                    <Download className="h-4 w-4 mr-1" />Attendees
                  </Button>
                  {(event.is_competition || event.event_type === "competition" || event.event_type === "hackathon") && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => exportToExcel("submissions")}>
                        <Download className="h-4 w-4 mr-1" />Submissions
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => exportToExcel("scores")}>
                        <Download className="h-4 w-4 mr-1" />Scores
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ═══════════ Stats Tab (Admin) ═══════════ */}
        {isAdmin && (
          <TabsContent value="stats" className="space-y-4 mt-4">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Registered", value: analytics.total_registered, icon: Users, color: "text-blue-600 bg-blue-50" },
                    { label: "Checked In", value: `${analytics.checked_in} (${analytics.check_in_rate}%)`, icon: UserCheck, color: "text-green-600 bg-green-50" },
                    { label: "Sessions", value: analytics.sessions_count, icon: Clock, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Submissions", value: analytics.submissions_count, icon: Trophy, color: "text-amber-600 bg-amber-50" },
                    { label: "Teams", value: analytics.teams_count, icon: UsersRound, color: "text-purple-600 bg-purple-50" },
                    { label: "Judges", value: analytics.judges_count, icon: UserCircle, color: "text-indigo-600 bg-indigo-50" },
                    { label: "Avg Score", value: analytics.average_score, icon: BarChart3, color: "text-orange-600 bg-orange-50" },
                  ].map(stat => (
                    <Card key={stat.label} className="border-border/40">
                      <CardContent className="pt-4 pb-3 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xl font-bold leading-tight">{stat.value}</div>
                          <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {analytics.registration_timeline.length > 0 && (
                  <Card className="border-border/40">
                    <CardHeader><CardTitle className="text-sm">Registration Timeline</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-1 h-32">
                        {analytics.registration_timeline.map((entry: { date: string; count: number }, i: number) => {
                          const max = Math.max(...analytics.registration_timeline.map((e: { count: number }) => e.count));
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                              <div className={`bg-gradient-to-t ${theme.gradient} rounded-t w-full opacity-80`} style={{ height: `${(entry.count / max) * 100}%`, minHeight: 4 }} />
                              <span className="text-[9px] text-muted-foreground">{entry.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
          </TabsContent>
        )}
        </Tabs>
      </div>
    </div>
  );
};

export default EventDetail;

