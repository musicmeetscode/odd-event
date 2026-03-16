import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2, Wifi, WifiOff } from "lucide-react";
import SpeakerQuestionItem from "@/components/SpeakerQuestionItem";
import { useToast } from "@/hooks/use-toast";
import { questionService } from '@/services/questions';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Question } from '@/types/api';
import { toast as sonnerToast } from 'sonner';

const SpeakerQAManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentAnswerText, setCurrentAnswerText] = useState("");
  const [answeringQuestionId, setAnsweringQuestionId] = useState<number | null>(null);

  const sessionId = parseInt(id || "0");
  const session = location.state?.session || {
    title: "Session Q&A",
    description: "Manage questions for your session",
  };

  useEffect(() => {
    const speakerName = localStorage.getItem("devfest-username");
    if (!speakerName) {
      navigate("/speaker-login");
    }
  }, [navigate]);

  // Fetch questions from API
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['speaker-questions', sessionId],
    queryFn: () => questionService.getQuestions(sessionId),
    enabled: !!sessionId && sessionId > 0,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket(sessionId, {
    onNewQuestion: (question) => {
      queryClient.setQueryData(['speaker-questions', sessionId], (old: Question[] = []) => 
        [question, ...old]
      );
      sonnerToast.info(`New question from ${question.member_name}`, {
        description: question.content.substring(0, 60) + '...',
      });
    },
    onQuestionAnswered: (question) => {
      queryClient.setQueryData(['speaker-questions', sessionId], (old: Question[] = []) =>
        old.map(q => q.id === question.id ? question : q)
      );
    },
  });

  // Mutation for answering questions
  const answerMutation = useMutation({
    mutationFn: ({ questionId, answerText }: { questionId: number; answerText: string }) =>
      questionService.markAnswered(questionId, answerText),
    onSuccess: () => {
      sonnerToast.success("Answer submitted!", {
        description: "Your answer has been shared with attendees",
      });
      setCurrentAnswerText("");
      setAnsweringQuestionId(null);
      queryClient.invalidateQueries({ queryKey: ['speaker-questions', sessionId] });
    },
    onError: (error) => {
      console.error('Error answering question:', error);
      sonnerToast.error("Failed to submit answer", {
        description: "Please try again",
      });
    },
  });

  const handleStartAnswering = (questionId: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      setAnsweringQuestionId(questionId);
      document.getElementById('answer-box')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmitAnswer = () => {
    if (answeringQuestionId && currentAnswerText.trim()) {
      answerMutation.mutate({
        questionId: answeringQuestionId,
        answerText: currentAnswerText,
      });
    }
  };

  const handleCancelAnswer = () => {
    setAnsweringQuestionId(null);
    setCurrentAnswerText("");
  };

  const pendingQuestions = questions.filter((q) => !q.is_answered);
  const answeredQuestions = questions.filter((q) => q.is_answered);
  
  const answeringQuestion = answeringQuestionId 
    ? questions.find(q => q.id === answeringQuestionId)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/speaker-dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {session.title} — Speaker Panel
              </h1>
              <p className="text-muted-foreground mt-1">{session.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-500 font-medium">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-500 font-medium">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Pending Questions */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Pending Questions
            </h2>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {pendingQuestions.length}
            </span>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">Loading questions...</p>
              </div>
            ) : pendingQuestions.length > 0 ? (
              pendingQuestions.map((question) => (
                <SpeakerQuestionItem
                  key={question.id}
                  id={question.id}
                  question={question.content}
                  askedBy={question.member_name}
                  timestamp={new Date(question.created_at).toLocaleTimeString()}
                  isAnswered={question.is_answered}
                  onAnswerQuestion={handleStartAnswering}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <p className="text-muted-foreground">No pending questions</p>
              </div>
            )}
          </div>
        </div>

        {/* Answer Box */}
        <div id="answer-box" className="mb-8 bg-card rounded-xl p-6 shadow-material-md border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Answer Question
          </h3>
          {answeringQuestion ? (
            <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Answering:</p>
              <p className="text-sm font-medium">{answeringQuestion.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Asked by {answeringQuestion.member_name}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              Click "Answer Question" on a question below to respond
            </p>
          )}
          <div className="space-y-4">
            <Textarea
              placeholder={answeringQuestion ? "Type your answer here..." : "Select a question to answer"}
              value={currentAnswerText}
              onChange={(e) => setCurrentAnswerText(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={!answeringQuestion || answerMutation.isPending}
            />
            <div className="flex justify-end gap-2">
              {answeringQuestion && (
                <Button
                  onClick={handleCancelAnswer}
                  variant="outline"
                  disabled={answerMutation.isPending}
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSubmitAnswer}
                disabled={!answeringQuestion || !currentAnswerText.trim() || answerMutation.isPending}
                className="flex items-center gap-2"
              >
                {answerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Answer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Answered Questions */}
        {answeredQuestions.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Answered Questions
              </h2>
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
                {answeredQuestions.length}
              </span>
            </div>
            <div className="space-y-4">
              {answeredQuestions.map((question) => (
                <SpeakerQuestionItem
                  key={question.id}
                  id={question.id}
                  question={question.content}
                  askedBy={question.member_name}
                  timestamp={new Date(question.created_at).toLocaleTimeString()}
                  isAnswered={question.is_answered}
                  answerText={question.answer_text}
                  onAnswerQuestion={handleStartAnswering}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakerQAManagement;
