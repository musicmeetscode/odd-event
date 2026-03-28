import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Send, MessageCircle, CheckCircle2, Loader2,
  Trash2, RotateCcw, Reply, X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Question } from "@/types/api";

const QuestionBoard = () => {
  const { id, sid } = useParams<{ id: string; sid: string }>();
  const eventId = Number(id);
  const sessionId = Number(sid);
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const isModeratorRole = role === "admin" || role === "speaker";

  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "unanswered" | "answered">("all");

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

  // ─── Moderation mutations ───
  const answerMutation = useMutation({
    mutationFn: ({ questionId, answer }: { questionId: number; answer: string }) =>
      eventsService.answerQuestion(questionId, answer),
    onSuccess: () => {
      toast.success("Question answered!");
      setAnsweringId(null);
      setAnswerText("");
      queryClient.invalidateQueries({ queryKey: ["questions", sessionId] });
    },
    onError: () => toast.error("Failed to answer question."),
  });

  const unanswerMutation = useMutation({
    mutationFn: (questionId: number) => eventsService.markQuestionUnanswered(questionId),
    onSuccess: () => {
      toast.success("Marked as unanswered.");
      queryClient.invalidateQueries({ queryKey: ["questions", sessionId] });
    },
    onError: () => toast.error("Failed to update question."),
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: number) => eventsService.deleteQuestion(questionId),
    onSuccess: () => {
      toast.success("Question deleted.");
      queryClient.invalidateQueries({ queryKey: ["questions", sessionId] });
    },
    onError: () => toast.error("Failed to delete question."),
  });

  // ─── Filter questions ───
  const filteredQuestions = (questions || []).filter((q: Question) => {
    if (filterMode === "unanswered") return !q.is_answered;
    if (filterMode === "answered") return q.is_answered;
    return true;
  });

  const totalCount = questions?.length || 0;
  const unansweredCount = (questions || []).filter((q: Question) => !q.is_answered).length;
  const answeredCount = totalCount - unansweredCount;

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
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">Q&A</h1>
              <Badge variant="outline" className="text-xs font-mono">{totalCount}</Badge>
            </div>
          </div>

          {/* Filter tabs (moderators see these always, others see if there are questions) */}
          {totalCount > 0 && (
            <div className="flex gap-1 mt-3">
              {([
                { key: "all" as const, label: "All", count: totalCount },
                { key: "unanswered" as const, label: "Unanswered", count: unansweredCount },
                { key: "answered" as const, label: "Answered", count: answeredCount },
              ]).map(tab => (
                <Button
                  key={tab.key}
                  variant={filterMode === tab.key ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7 px-2.5"
                  onClick={() => setFilterMode(tab.key)}
                >
                  {tab.label}
                  <span className="ml-1 font-mono opacity-70">{tab.count}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Questions */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredQuestions.length > 0 ? (
          <div className="space-y-3">
            {filteredQuestions.map((q: Question) => (
              <Card
                key={q.id}
                className={`border-border/50 transition-all ${
                  q.is_answered ? "border-green-500/20 bg-green-50/30" : ""
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm">{q.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">{q.member_name}</span>
                        <span>•</span>
                        <span>{format(new Date(q.created_at), "h:mm a")}</span>
                      </div>

                      {/* Answer display */}
                      {q.is_answered && q.answer_text && (
                        <div className="mt-3 p-3 rounded-lg bg-green-500/5 border border-green-500/15">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Reply className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">Answer</span>
                          </div>
                          <p className="text-sm text-slate-700">{q.answer_text}</p>
                        </div>
                      )}

                      {/* Inline answer form */}
                      {answeringId === q.id && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            placeholder="Type your answer..."
                            className="min-h-[80px] text-sm resize-none"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => { setAnsweringId(null); setAnswerText(""); }}
                            >
                              <X className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              disabled={!answerText.trim() || answerMutation.isPending}
                              onClick={() => answerMutation.mutate({ questionId: q.id, answer: answerText })}
                            >
                              {answerMutation.isPending ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Reply className="h-3 w-3 mr-1" />
                              )}
                              Submit Answer
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status badge and moderator actions */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {q.is_answered && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-500/30 text-[10px]"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-0.5" />
                          Answered
                        </Badge>
                      )}

                      {/* Moderator action buttons */}
                      {isModeratorRole && answeringId !== q.id && (
                        <div className="flex gap-0.5">
                          {!q.is_answered ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Answer this question"
                              onClick={() => { setAnsweringId(q.id); setAnswerText(""); }}
                            >
                              <Reply className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              title="Mark as unanswered"
                              onClick={() => unanswerMutation.mutate(q.id)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {role === "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-red-50"
                              title="Delete question"
                              onClick={() => {
                                if (confirm("Delete this question?")) {
                                  deleteMutation.mutate(q.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>
              {filterMode === "all"
                ? "No questions yet. Be the first to ask!"
                : filterMode === "unanswered"
                  ? "All questions have been answered! 🎉"
                  : "No answered questions yet."}
            </p>
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
