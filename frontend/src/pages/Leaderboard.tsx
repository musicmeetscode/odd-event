import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Loader2, Maximize, Minimize } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LeaderboardEntry } from "@/types/api";

const Leaderboard = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);
  const [liveEntries, setLiveEntries] = useState<LeaderboardEntry[] | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsService.getEvent(eventId),
  });

  const { data: initialEntries, isLoading } = useQuery({
    queryKey: ["leaderboard", eventId],
    queryFn: () => eventsService.getLeaderboard(eventId),
  });

  // WebSocket for live updates
  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${wsBase}/ws/event/${eventId}/leaderboard/`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "leaderboard_update") {
        setLiveEntries(msg.data);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [eventId]);

  const entries: LeaderboardEntry[] = liveEntries || initialEntries || [];

  const rankColors: Record<number, string> = {
    1: "text-yellow-500",
    2: "text-gray-400",
    3: "text-amber-600",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2"
            onClick={() => navigate(`/events/${eventId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Event
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-7 w-7 text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold">Leaderboard</h1>
                {event && (
                  <p className="text-sm text-muted-foreground">{event.title}</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={toggleFullscreen} title="Toggle Fullscreen">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
          {liveEntries && (
            <Badge variant="outline" className="mt-3 text-green-500 border-green-500/30">
              ● Live
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Card
                key={entry.submission_id}
                className={`border-border/50 transition-all duration-300 ${
                  entry.rank <= 3
                    ? "border-l-4 border-l-yellow-500/50"
                    : ""
                }`}
              >
                <CardContent className="py-4 flex items-center gap-4">
                  <span
                    className={`text-3xl font-bold w-12 text-center ${
                      rankColors[entry.rank] || "text-muted-foreground/50"
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{entry.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.submitted_by}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono font-bold">
                      {entry.total_score.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No scores yet. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
