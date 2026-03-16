import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SessionCard from "@/components/SessionCard";
import { sessionService } from "@/services/sessions";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Color mapping for sessions (cycles through colors)
const colors = ["primary", "secondary", "accent", "destructive"] as const;

const SessionSelection = () => {
  const navigate = useNavigate();
  const { username, logout } = useAuth();

  // Fetch sessions from backend
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionService.getAllSessions,
    retry: 2,
  });

  const handleSessionSelect = (sessionId: number) => {
    localStorage.setItem("devfest-session-id", sessionId.toString());
    navigate("/questions");
  };

  const handleLogout = async () => {
    try {
      // await logout(); // Wait for backend logout to complete (Turned on for now)
      navigate("/");
      toast.success("Logged out successfully");
    } catch (err) {
      console.error("Logout error:", err);
      // Still navigate away even if error occurs
      navigate("/");
      toast.error("Logout failed, but local session cleared");
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-lg text-destructive mb-4">Failed to load sessions</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Please try again later"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-primary hover:underline"
          >
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Logo and Logout Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-primary">
            <span className="text-2xl font-bold">&lt;</span>
            <span className="text-2xl font-bold">&gt;</span>
            <span className="text-xl font-semibold text-foreground ml-2">GDG Cloud Mbarara</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive transition-colors text-sm font-medium"
          >
            Back Home
          </button>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-10 bg-primary rounded-full"></div>
            <div className="w-2 h-10 bg-secondary rounded-full"></div>
            <div className="w-2 h-10 bg-accent rounded-full"></div>
            <div className="w-2 h-10 bg-destructive rounded-full"></div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            Welcome, {username} 👋
          </h1>
          <p className="text-xl text-muted-foreground">
            Select the session you are attending
          </p>
        </div>

        {/* Session Cards */}
        <div className="grid gap-4 md:gap-6">
          {sessions && sessions.length > 0 ? (
            sessions.map((session, index) => (
              <SessionCard
                key={session.id}
                id={session.id}
                title={session.title}
                description={`Room: ${session.room_location} | ${new Date(session.start_time).toLocaleString()}`}
                color={colors[index % colors.length]}
                onClick={() => handleSessionSelect(session.id)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No sessions available at the moment</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/attendee-login");
            }}
            className="text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            ← Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionSelection;
