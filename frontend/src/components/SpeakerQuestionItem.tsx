import { Button } from "@/components/ui/button";
import { Check, MessageCircle, CheckCircle2 } from "lucide-react";

interface SpeakerQuestionItemProps {
  id: number;
  question: string;
  askedBy: string;
  timestamp: string;
  isAnswered?: boolean;
  answerText?: string;
  onAnswerQuestion: (id: number) => void;
}

const SpeakerQuestionItem = ({
  id,
  question,
  askedBy,
  timestamp,
  isAnswered = false,
  answerText = "",
  onAnswerQuestion,
}: SpeakerQuestionItemProps) => {
  return (
    <div
      className={`bg-card rounded-lg p-5 shadow-material-sm border-2 transition-all ${
        isAnswered
          ? "border-secondary/30 bg-secondary/5"
          : "border-border hover:border-primary/30"
      }`}
    >
      {/* Question Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isAnswered ? "bg-secondary/20" : "bg-primary/10"
          }`}
        >
          {isAnswered ? (
            <Check className="w-5 h-5 text-secondary" />
          ) : (
            <MessageCircle className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base text-foreground font-medium mb-2 leading-relaxed">
            {question}
          </p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Asked by: <span className="font-medium">{askedBy}</span></span>
            <span>•</span>
            <span>{timestamp}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isAnswered && (
        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <Button
            onClick={() => onAnswerQuestion(id)}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Answer Question
          </Button>
        </div>
      )}

      {isAnswered && (
        <div className="pt-3 border-t border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">Answered</span>
          </div>
          {answerText && (
            <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-2 border-green-500">
              <p className="text-sm text-foreground">{answerText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeakerQuestionItem;
