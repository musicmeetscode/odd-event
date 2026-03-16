import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import QuestionItem from "@/components/QuestionItem";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionService } from "@/services/questions";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Question } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";

const QuestionBoard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useAuth();
  const queryClient = useQueryClient();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [questionText, setQuestionText] = useState("");

  // Get session from location state or localStorage
  useEffect(() => {
    const session = location.state?.session;
    const savedSessionId = localStorage.getItem("devfest-session-id");

    if (session) {
      setSessionId(session.id);
      setSessionTitle(session.title);
      localStorage.setItem("devfest-session-id", session.id.toString());
    } else if (savedSessionId) {
      setSessionId(parseInt(savedSessionId));
    } else {
      toast.error("No session selected");
      navigate("/sessions");
    }
  }, [location, navigate]);

  // Fetch questions for this session
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', sessionId],
    queryFn: () => questionService.getQuestions(),
    enabled: !!sessionId,
    refetchInterval: 5000, // Poll every 5 seconds as fallback
  });

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket(sessionId || 0, {
    onNewQuestion: (question: Question) => {
      queryClient.setQueryData(['questions', sessionId], (old: Question[] = []) => {
        // Avoid duplicates
        if (old.some(q => q.id === question.id)) return old;
        return [question, ...old];
      });
      toast.info(`New question from ${question.member_name}`);
    },
    onQuestionAnswered: (question: Question) => {
      queryClient.setQueryData(['questions', sessionId], (old: Question[] = []) =>
        old.map(q => q.id === question.id ? question : q)
      );
      toast.success("Question answered by speaker");
    },
  });

  // Mutation for submitting questions
  const submitMutation = useMutation({
    mutationFn: (content: string) => questionService.createQuestion(sessionId!, content),
    onSuccess: () => {
      setQuestionText("");
      toast.success("Question submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ['questions', sessionId] });
    },
    onError: () => {
      toast.error("Failed to submit question. Please try again.");
    },
  });

  const handleSubmitQuestion = () => {
    if (!questionText.trim()) {
      toast.error("Please enter a question");
      return;
    }
    submitMutation.mutate(questionText.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitQuestion();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border  top-0 z-10 shadow-material-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 ">
          <div className="flex items-center gap-4">

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/sessions")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
              <div className="text-ceter">
                <h1 className="text-2xl font-bold text-foreground">
                  {sessionTitle || 'Session'} Q&A
                </h1>
                <p className="text-muted-foreground mt-1">
                  Ask your questions during the session
                  {isConnected && <span className="ml-2 text-green-500">● Live</span>}
                </p>
              </div>
            </div>
            <div className="flex ml-auto items-center gap-3 mb-4">
              <div className="w-2 h-10 bg-primary rounded-full"></div>
              <div className="w-2 h-10 bg-secondary rounded-full"></div>
              <div className="w-2 h-10 bg-accent rounded-full"></div>
              <div className="w-2 h-10 bg-destructive rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Question Input Section. Only shown to speakers */}
        {localStorage.getItem("speaker") == null && <div className="bg-card rounded-xl p-6 shadow-material-md border border-border mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Ask a Question
          </h2>

          <div className="space-y-4">
            <Textarea
              placeholder="Type your question here..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[100px] resize-none border-2 focus:border-primary transition-colors"
              maxLength={500}
            />

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                {questionText.length}/500 characters
              </span>

              <Button
                onClick={handleSubmitQuestion}
                disabled={submitMutation.isPending || !questionText.trim()}
                className="shadow-material-sm hover:shadow-material-md transition-all"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Question
                    <Send className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>}

        {/* Questions List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            All Questions ({questions.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-3">
              {questions.map((q) => (
                <QuestionItem
                  questionId={q.id}
                  key={q.id}
                  question={q.content}
                  askerName={q.member_name}
                  timestamp={new Date(q.created_at).toLocaleTimeString()}
                  isAnswered={q.is_answered}
                  answerText={q.answer_text || undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No questions yet. Be the first to ask!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuestionBoard;
