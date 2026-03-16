import { MessageCircle, CheckCircle2, Check } from "lucide-react";
import { Button } from "./ui/button";
import { useMutation } from "@tanstack/react-query";
import { questionService } from "@/services/questions";
import { toast } from "sonner";
import { useState } from "react";

interface QuestionItemProps {
  question: string;
  questionId: number;
  askerName: string;
  timestamp: string;
  isAnswered?: boolean;
  answerText?: string;
}

const QuestionItem = ({ question, questionId, askerName, timestamp, isAnswered, answerText }: QuestionItemProps) => {
  const [aswered, setaswered] = useState<boolean>(false)
  const answerMutation = useMutation({
    mutationFn: () =>
      questionService.markAnswered(questionId, "In audience answer"),
    onSuccess: () => {
      toast.success("Cleared", {
        description: "Your answer has been shared with attendees",
      });
      setaswered(true)
      // queryClient.invalidateQueries({ queryKey: ['speaker-questions', sessionId] });
    },
    onError: (error) => {
      console.error('Error answering question:', error);
      toast.error("Failed to submit answer", {
        description: "Please try again",
      });
    },
  });
  const handleSubmitAnswer = () => {
    answerMutation.mutate();
  };
  return (
    <div className={`bg-card rounded-lg p-4 shadow-material-sm hover:shadow-material-md transition-shadow border ${isAnswered ? 'border-green-500/50' : 'border-border'
      }`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAnswered ? 'bg-green-500/10' : 'bg-primary/10'
            }`}>
            {isAnswered ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <MessageCircle className="w-5 h-5 text-primary" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-foreground font-medium mb-2 leading-relaxed">
            {question}
          </p>

          {isAnswered && answerText && (
            <div className="mt-3 pl-4 border-l-2 border-green-500/50">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-green-600">Speaker: </span>
                {answerText}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
            <span className="font-medium">{askerName}</span>
            <span>•</span>
            <span>{timestamp}</span>
            {isAnswered && <span className="text-green-500 font-semibold">✓ Answered</span>}
          </div>
        </div>
        {localStorage.getItem("speaker") && <>
          {!aswered && !isAnswered &&
            <Button onClick={()=>{handleSubmitAnswer()}} > <Check /> Close</Button>
          }
        </>}
      </div>
    </div>
  );
};

export default QuestionItem;
