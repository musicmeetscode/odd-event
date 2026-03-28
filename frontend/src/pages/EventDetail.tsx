import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { adminService } from "@/services/admin";
import { teamsService } from "@/services/teams";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SubmissionCard } from "@/components/SubmissionCard";
import {
  ArrowLeft, Calendar, MapPin, Users, Trophy, MessageSquare,
  Loader2, QrCode, Link2, Plus, Trash2, BarChart3, UserCheck,
  UserPlus, Edit, Download, Clock, UserCircle, UsersRound,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Submission, Session, Team, EventAnalytics } from "@/types/api";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = role === "admin";

  // ─── Edit state ───
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", location: "", event_type: "", allow_teams: false, max_team_size: 5 });

  // ─── Session form ───
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: "", description: "", session_type: "talk", start_time: "", end_time: "", room_location: "" });

  // ─── Team form ───
  const [teamName, setTeamName] = useState("");

  // ─── Judge form ───
  const [newJudge, setNewJudge] = useState({ username: "", display_name: "" });

  // ─── Criteria form ───
  const [newCriteria, setNewCriteria] = useState({ name: "", description: "", max_score: 10, weight: 1 });

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
  const registerMutation = useMutation({
    mutationFn: () => eventsService.registerForEvent(eventId),
    onSuccess: () => { toast.success("Registered!"); queryClient.invalidateQueries({ queryKey: ["event", eventId] }); },
    onError: () => toast.error("Registration failed."),
  });
  const updateEventMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => eventsService.patchEvent(eventId, data as Partial<typeof event>),
    onSuccess: () => { toast.success("Event updated!"); setIsEditing(false); queryClient.invalidateQueries({ queryKey: ["event", eventId] }); },
    onError: () => toast.error("Update failed."),
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
    mutationFn: () => adminService.createUser({ ...newJudge, role: "judge", password: "blueox2026" }),
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
    mutationFn: (judgeId: number) => adminService.assignJudge(eventId, judgeId),
    onSuccess: () => { toast.success("Judge assigned!"); queryClient.invalidateQueries({ queryKey: ["judges", eventId] }); },
    onError: () => toast.error("Failed to assign judge."),
  });
  const removeJudgeMutation = useMutation({
    mutationFn: (judgeId: number) => adminService.removeJudge(eventId, judgeId),
    onSuccess: () => { toast.success("Judge removed."); queryClient.invalidateQueries({ queryKey: ["judges", eventId] }); },
  });
  const createCriteriaMutation = useMutation({
    mutationFn: () => adminService.createCriteria(eventId, newCriteria),
    onSuccess: () => { toast.success("Criteria added!"); setNewCriteria({ name: "", description: "", max_score: 10, weight: 1 }); queryClient.invalidateQueries({ queryKey: ["event", eventId] }); },
    onError: () => toast.error("Failed to add criteria."),
  });
  const deleteCriteriaMutation = useMutation({
    mutationFn: (criteriaId: number) => adminService.deleteCriteria(eventId, criteriaId),
    onSuccess: () => { toast.success("Criteria removed."); queryClient.invalidateQueries({ queryKey: ["event", eventId] }); },
  });

  if (isLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!event) return <div className="p-8 text-center">Event not found.</div>;

  const checkInUrl = `${window.location.origin}/check-in`;
  const eventUrl = `${window.location.origin}/events/${eventId}`;
  const unassignedJudges = (allJudgeUsers || []).filter(
    (u: { id: number }) => !(assignedJudges || []).some((a: { judge: number }) => a.judge === u.id)
  );

  const handleStartEdit = () => {
    setEditForm({
      title: event.title, description: event.description,
      location: event.location, event_type: event.event_type,
      allow_teams: event.allow_teams, max_team_size: event.max_team_size,
    });
    setIsEditing(true);
  };

  const handleExport = (type: string) => {
    const token = localStorage.getItem("auth_token");
    const url = adminService.getExportUrl(eventId, type);
    window.open(`${url}&token=${token}`, "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pt-20">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/events")}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          {isEditing ? (
            <Input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="text-2xl font-bold" />
          ) : (
            <h1 className="text-2xl font-bold">{event.title}</h1>
          )}
          <div className="flex gap-2 mt-1">
            <Badge variant="outline">{event.event_type}</Badge>
            {event.is_competition && <Badge className="bg-secondary/80">Competition</Badge>}
            {event.allow_teams && <Badge className="bg-blue-600">Teams</Badge>}
            <Badge variant={event.is_active ? "default" : "destructive"}>{event.is_active ? "Active" : "Inactive"}</Badge>
          </div>
        </div>


        {!isEditing && (
          <div className="flex flex-wrap gap-2">
            {event.is_competition && (
              <Button variant="secondary" size="sm" onClick={() => navigate(`/events/${eventId}/leaderboard`)}>
                <Trophy className="h-4 w-4 mr-1 text-yellow-500" /> Leaderboard
              </Button>
            )}
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={handleStartEdit}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => { if (confirm("Delete this event?")) deleteEventMutation.mutate(); }}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
              </>
            )}
          </div>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={() => updateEventMutation.mutate(editForm)}>Save</Button>
          </div>
        )}
      </div>

      {/* ─── Meta ─── */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
        {event.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span>}
        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(event.start_date), "MMM d, yyyy h:mm a")}</span>
        <span className="flex items-center gap-1"><Users className="h-4 w-4" />{event.attendee_count} attendees</span>
      </div>

      {isEditing && (
        <Card className="mb-6">
          <CardContent className="pt-4 space-y-3">
            <div><Label>Description</Label><Textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Location</Label><Input value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.allow_teams} onChange={e => setEditForm(p => ({ ...p, allow_teams: e.target.checked }))} /> Allow Teams</label>
              {editForm.allow_teams && <div><Label>Max Team Size</Label><Input type="number" value={editForm.max_team_size} onChange={e => setEditForm(p => ({ ...p, max_team_size: +e.target.value }))} className="w-20" /></div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Register button ─── */}
      {!isAdmin && isAuthenticated && !event.is_registered && (
        <Button className="mb-6" onClick={() => registerMutation.mutate()}>
          <UserCheck className="h-4 w-4 mr-1" />Register for this event
        </Button>
      )}

      {/* ─── Tabs ─── */}
      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions"><Clock className="h-3.5 w-3.5 mr-1" />Sessions</TabsTrigger>
          {event.is_competition && <TabsTrigger value="submissions"><Trophy className="h-3.5 w-3.5 mr-1" />Submissions</TabsTrigger>}
          {event.allow_teams && <TabsTrigger value="teams"><UsersRound className="h-3.5 w-3.5 mr-1" />Teams</TabsTrigger>}
          {isAdmin && <TabsTrigger value="manage">Manage</TabsTrigger>}
          {isAdmin && <TabsTrigger value="stats"><BarChart3 className="h-3.5 w-3.5 mr-1" />Stats</TabsTrigger>}
        </TabsList>

        {/* ─── Overview ─── */}
        <TabsContent value="overview" className="space-y-4">
          {event.description && <Card><CardContent className="pt-4"><p className="whitespace-pre-wrap">{event.description}</p></CardContent></Card>}
          <Card>
            <CardHeader><CardTitle className="text-sm">Attendees ({attendees?.length || 0})</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {(attendees || []).slice(0, 20).map((a: { id: number; name: string; status: string }) => (
                  <div key={a.id} className="flex items-center gap-1.5">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{a.name}</span>
                    {a.status === "checked_in" && <Badge variant="outline" className="text-[10px] px-1">✓</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Sessions ─── */}
        <TabsContent value="sessions" className="space-y-4">
          {isAdmin && (
            <Card>
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
          {(sessions || []).length > 0 ? (
            <div className="space-y-2">
              {(sessions || []).map((s: Session) => (
                <Card key={s.id} className="hover:shadow transition-shadow">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{s.session_type}</Badge>
                        <span
                          className="font-medium cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/events/${eventId}/sessions/${s.id}/questions`)}
                        >{s.title}</span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{format(new Date(s.start_time), "h:mm a")}{s.end_time ? ` - ${format(new Date(s.end_time), "h:mm a")}` : ""}</span>
                        {s.room_location && <span>📍 {s.room_location}</span>}
                        {s.speaker_names.length > 0 && <span>🎤 {s.speaker_names.join(", ")}</span>}
                        <span>💬 {s.question_count} questions</span>
                      </div>
                    </div>
                    {isAdmin && <Button variant="ghost" size="icon" onClick={() => deleteSessionMutation.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-center py-8">No sessions yet.</p>}
        </TabsContent>

        {/* ─── Submissions ─── */}
        {event.is_competition && (
          <TabsContent value="submissions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Submissions ({submissions?.length || 0})</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/events/${eventId}/leaderboard`)}><Trophy className="h-4 w-4 mr-1" />Leaderboard</Button>
                <Button size="sm" onClick={() => navigate(`/events/${eventId}/submit`)}><Plus className="h-4 w-4 mr-1" />Submit</Button>
              </div>
            </div>
            {(submissions || []).map((s: Submission) => <SubmissionCard key={s.id} submission={s} />)}
          </TabsContent>
        )}

        {/* ─── Teams ─── */}
        {event.allow_teams && (
          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Create a Team</CardTitle>
              </CardHeader>
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
              <Card key={t.id}>
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

        {/* ─── Manage (Admin) ─── */}
        {isAdmin && (
          <TabsContent value="manage" className="space-y-4">
            {/* Sharing */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Event URLs & QR</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" /><code className="text-xs bg-muted px-2 py-1 rounded flex-1">{eventUrl}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(eventUrl); toast.success("Copied!"); }}>Copy</Button>
                </div>
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" /><code className="text-xs bg-muted px-2 py-1 rounded flex-1">{checkInUrl}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(checkInUrl); toast.success("Copied!"); }}>Copy</Button>
                </div>
              </CardContent>
            </Card>

            {/* Judges */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Judges ({assignedJudges?.length || 0})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(assignedJudges || []).map((j: { id: number; judge: number; judge_name: string }) => (
                  <div key={j.id} className="flex items-center justify-between text-sm">
                    <span>{j.judge_name}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeJudgeMutation.mutate(j.judge)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                {unassignedJudges.length > 0 && (
                  <Select onValueChange={v => assignJudgeMutation.mutate(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Assign existing judge..." /></SelectTrigger>
                    <SelectContent>
                      {unassignedJudges.map((u: { id: number; display_name: string; username: string }) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.display_name || u.username}</SelectItem>
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

            {/* Criteria */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Judging Criteria</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(event.judging_criteria || []).map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span>{c.name} (max: {c.max_score}, weight: {c.weight})</span>
                    <Button size="sm" variant="ghost" onClick={() => deleteCriteriaMutation.mutate(c.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Criteria name" value={newCriteria.name} onChange={e => setNewCriteria(p => ({ ...p, name: e.target.value }))} />
                  <Input type="number" placeholder="Max score" value={newCriteria.max_score} onChange={e => setNewCriteria(p => ({ ...p, max_score: +e.target.value }))} />
                </div>
                <Button size="sm" onClick={() => createCriteriaMutation.mutate()} disabled={!newCriteria.name}><Plus className="h-4 w-4 mr-1" />Add Criteria</Button>
              </CardContent>
            </Card>

            {/* Export */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Export Data</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["attendees", "submissions", "scores", "teams"].map(type => (
                    <Button key={type} variant="outline" size="sm" onClick={() => handleExport(type)}>
                      <Download className="h-4 w-4 mr-1" />{type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ─── Stats (Admin) ─── */}
        {isAdmin && (
          <TabsContent value="stats" className="space-y-4">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Registered", value: analytics.total_registered, icon: Users },
                    { label: "Checked In", value: `${analytics.checked_in} (${analytics.check_in_rate}%)`, icon: UserCheck },
                    { label: "Sessions", value: analytics.sessions_count, icon: Clock },
                    { label: "Submissions", value: analytics.submissions_count, icon: Trophy },
                    { label: "Teams", value: analytics.teams_count, icon: UsersRound },
                    { label: "Judges", value: analytics.judges_count, icon: UserCircle },
                    { label: "Avg Score", value: analytics.average_score, icon: BarChart3 },
                  ].map(stat => (
                    <Card key={stat.label}>
                      <CardContent className="pt-4 text-center">
                        <stat.icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {analytics.registration_timeline.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Registration Timeline</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-1 h-32">
                        {analytics.registration_timeline.map((entry, i) => {
                          const max = Math.max(...analytics.registration_timeline.map(e => e.count));
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                              <div className="bg-primary/80 rounded-t w-full" style={{ height: `${(entry.count / max) * 100}%`, minHeight: 4 }} />
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
  );
};

export default EventDetail;
