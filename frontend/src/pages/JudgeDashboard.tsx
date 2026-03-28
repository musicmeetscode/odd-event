import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { judgingService } from "@/services/judging";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoringForm } from "@/components/ScoringForm";
import { SubmissionCard } from "@/components/SubmissionCard";
import {
  ArrowLeft, Gavel, Loader2, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { JudgeDashboardEvent, Submission } from "@/types/api";

const JudgeDashboard = () => {
  useAuth(); // ensure authenticated
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State for drill‑down
  const [selectedEvent, setSelectedEvent] = useState<JudgeDashboardEvent | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["judge-dashboard"],
    queryFn: judgingService.getDashboard,
  });

  const { data: submissions, isLoading: subsLoading } = useQuery({
    queryKey: ["judge-submissions", selectedEvent?.event_id],
    queryFn: () => judgingService.getSubmissions(selectedEvent!.event_id),
    enabled: !!selectedEvent,
  });

  const scoreMutation = useMutation({
    mutationFn: (scores: { criteria: number; score: number; comment?: string }[]) =>
      judgingService.submitScores(selectedSubmission!.id, scores),
    onSuccess: (data) => {
      toast.success(data.detail || "Scores submitted!");
      queryClient.invalidateQueries({ queryKey: ["judge-dashboard"] });
      queryClient.invalidateQueries({
        queryKey: ["judge-submissions", selectedEvent?.event_id],
      });
      setSelectedSubmission(null);
    },
    onError: () => toast.error("Failed to submit scores."),
  });

  // ─── Scoring View ──────────────────────────────────────────
  if (selectedSubmission && selectedEvent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => setSelectedSubmission(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Submissions
          </Button>
          <h2 className="text-2xl font-bold mb-1">{selectedSubmission.title}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            by {selectedSubmission.submitted_by_name}
          </p>
          {selectedSubmission.description && (
            <p className="text-sm text-muted-foreground mb-6 whitespace-pre-wrap">
              {selectedSubmission.description}
            </p>
          )}

          <ScoringForm
            criteria={selectedEvent.criteria}
            onSubmit={(scores) => scoreMutation.mutate(scores)}
            isSubmitting={scoreMutation.isPending}
          />
        </div>
      </div>
    );
  }

  // ─── Submissions List ──────────────────────────────────────
  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => setSelectedEvent(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <h2 className="text-2xl font-bold mb-6">{selectedEvent.event_title}</h2>
          {subsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : submissions && submissions.length > 0 ? (
            <div className="grid gap-3">
              {submissions.map((sub) => (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  onClick={() => setSelectedSubmission(sub)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              No submissions to score yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Dashboard Overview ────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Judge Dashboard</h2>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : dashboard && dashboard.length > 0 ? (
          <div className="grid gap-4">
            {dashboard.map((evt: JudgeDashboardEvent) => (
              <Card
                key={evt.event_id}
                className="border-border/50 cursor-pointer hover:shadow-md transition-shadow hover:border-primary/30"
                onClick={() => setSelectedEvent(evt)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{evt.event_title}</CardTitle>
                    <Badge variant="outline">{evt.event_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {evt.total_submissions} submissions
                    </span>
                    <div className="flex items-center gap-1 text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                      {evt.scored_submissions} scored
                    </div>
                    <span className="text-muted-foreground">
                      {evt.criteria.length} criteria
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Gavel className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No events assigned to you yet.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default JudgeDashboard;
