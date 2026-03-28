import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Question } from "@/types/api";

const QuestionBoard = () => {
  const { id, sid } = useParams<{ id: string; sid: string }>();
  const eventId = Number(id);
  const sessionId = Number(sid);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions", sessionId],
    queryFn: () => eventsService.getQuestions(sessionId),
  });

  // WebSocket setup for live Q&A
  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${wsBase}/ws/session/${sessionId}/`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "new_question" || msg.type === "question_answered") {
        // Refetch questions on update
        queryClient.invalidateQueries({ queryKey: ["questions", sessionId] });
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sessionId, queryClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setIsSubmitting(true);
    try {
      await eventsService.postQuestion(sessionId, newQuestion);
      setNewQuestion("");
      queryClient.invalidateQueries({ queryKey: ["questions", sessionId] });
    } catch {
      toast.error("Failed to post question.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => navigate(`/events/${eventId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Event
          </Button>
          <div className="flex items-center gap-2 mt-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Q&A</h1>
          </div>
        </div>
      </header>

      {/* Questions */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : questions && questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((q: Question) => (
              <Card
                key={q.id}
                className={`border-border/50 transition-all ${
                  q.is_answered ? "opacity-70" : ""
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm">{q.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{q.member_name}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(q.created_at), "h:mm a")}
                        </span>
                      </div>
                      {q.is_answered && q.answer_text && (
                        <div className="mt-3 p-3 rounded bg-primary/5 border border-primary/10">
                          <p className="text-sm">{q.answer_text}</p>
                        </div>
                      )}
                    </div>
                    {q.is_answered && (
                      <Badge
                        variant="outline"
                        className="text-green-500 border-green-500/30 shrink-0"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Answered
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No questions yet. Be the first to ask!</p>
          </div>
        )}
      </main>

      {/* Input */}
      {isAuthenticated && (
        <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm sticky bottom-0">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto px-4 py-4 flex gap-2"
          >
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isSubmitting || !newQuestion.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </footer>
      )}
    </div>
  );
};

export default QuestionBoard;
