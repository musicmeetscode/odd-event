import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, LogOut, Loader2, FileQuestion } from "lucide-react";
import { sessionService } from "@/services/sessions";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const colorClasses = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
};

const colors = ["primary", "secondary", "accent", "destructive"] as const;

const SpeakerDashboard = () => {
  const navigate = useNavigate();
  const { username, logout } = useAuth();

  // Fetch sessions from backend
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['speaker-sessions'],
    queryFn: sessionService.getAllSessions,
    retry: 2,
  });

  const handleLogout = async () => {
    try {
      await logout(); // Wait for backend logout to complete
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
          <p className="text-lg text-muted-foreground">Loading your sessions...</p>
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
          <Button onClick={() => navigate("/speaker-login")}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Speaker Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome, {username} 👋
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                localStorage.setItem("speaker","yes")
                navigate('/questions')
              }}
              className="flex items-center gap-2"
            >
              <FileQuestion className="w-4 h-4" />
              Question list
            </Button>
            <Button
              variant="secondary"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Back Home
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Your Sessions
          </h2>
          <p className="text-muted-foreground">
            Select a session to manage Q&A
          </p>
        </div>

        {/* Session Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sessions && sessions.length > 0 ? (
            sessions.map((session, index) => {
              const color = colors[index % colors.length];
              return (
                <button
                  key={session.id}
                  onClick={() => {
                    console.log('🔘 Session card clicked:', session.id, session.title);
                    navigate(`/speaker-qa/${session.id}`, { state: { session } });
                  }}
                  className="group bg-card rounded-xl p-6 shadow-material-md hover:shadow-material-lg transition-all duration-300 border-2 border-transparent hover:border-secondary text-left"
                >
                  {/* Icon */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]} transition-colors`}
                    >
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-secondary transition-colors">
                        {session.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {session.room_location}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Start Time:</span>
                      <span className="font-medium text-foreground">
                        {new Date(session.start_time).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm font-medium text-foreground group-hover:text-secondary transition-colors">
                      Open Session Dashboard
                    </span>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No sessions assigned to you yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakerDashboard;
