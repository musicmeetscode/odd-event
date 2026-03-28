import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CheckCircle2, MessageSquare, Star } from "lucide-react";
import type { JudgingCriteria } from "@/types/api";

interface ScoringFormProps {
  criteria: JudgingCriteria[];
  existingScores?: Record<number, { score: number; comment: string }>;
  onSubmit: (scores: { criteria: number; score: number; comment: string }[]) => void;
  isSubmitting?: boolean;
}

const ScoreSelector = ({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (val: number) => void;
}) => {
  // For small ranges (<= 10), use discrete clickable buttons
  if (max <= 10) {
    // Generate array [1, 2, ..., max]
    const options = Array.from({ length: max }, (_, i) => i + 1);
    
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {options.map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`
                h-10 w-10 sm:h-12 sm:w-12 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center
                ${isSelected 
                  ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2 scale-110" 
                  : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                }
              `}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  // Fallback to slider for larger ranges
  return (
    <div className="mt-4 px-2">
      <Slider
        value={[value]}
        max={max}
        step={1}
        onValueChange={([val]) => onChange(val)}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-2 font-mono">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export const ScoringForm = ({
  criteria,
  existingScores,
  onSubmit,
  isSubmitting,
}: ScoringFormProps) => {
  const [scores, setScores] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    criteria.forEach((c) => {
      initial[c.id] = existingScores?.[c.id]?.score ?? 0;
    });
    return initial;
  });

  const [comments, setComments] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    criteria.forEach((c) => {
      initial[c.id] = existingScores?.[c.id]?.comment ?? "";
    });
    return initial;
  });

  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});

  const handleSubmit = () => {
    const payload = criteria.map((c) => ({
      criteria: c.id,
      score: scores[c.id] ?? 0,
      comment: comments[c.id] ?? "",
    }));
    onSubmit(payload);
  };

  const totalWeighted = criteria.reduce((sum, c) => sum + (scores[c.id] ?? 0) * c.weight, 0);
  const maxPossible = criteria.reduce((sum, c) => sum + c.max_score * c.weight, 0);
  const isFullyScored = criteria.every(c => (scores[c.id] ?? 0) > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {criteria.map((c) => {
          const currentScore = scores[c.id] ?? 0;
          const isScored = currentScore > 0;
          const comment = comments[c.id] ?? "";
          const isCommenting = expandedComments[c.id] || comment.length > 0;

          return (
            <div 
              key={c.id} 
              className={`
                relative overflow-hidden transition-all duration-300 rounded-2xl border p-5 sm:p-6
                ${isScored ? "bg-white border-primary/20 shadow-sm" : "bg-muted/30 border-border"}
              `}
            >
              {/* Status indicator line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isScored ? "bg-primary" : "bg-muted"}`} />

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Label className="text-base font-semibold">{c.name}</Label>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600">
                      Weight: {c.weight}x
                    </span>
                  </div>
                  {c.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-3xl font-black text-primary tracking-tighter">
                    {currentScore}
                    <span className="text-sm font-medium text-muted-foreground ml-1">
                      / {c.max_score}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    {(currentScore * c.weight).toFixed(1)} pts
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <ScoreSelector 
                  value={currentScore} 
                  max={c.max_score} 
                  onChange={(val) => setScores((prev) => ({ ...prev, [c.id]: val }))} 
                />
              </div>

              <div className="mt-5 pt-4 border-t flex flex-col gap-3">
                {!isCommenting && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="self-start text-muted-foreground hover:text-foreground h-8 px-2"
                    onClick={() => setExpandedComments(prev => ({ ...prev, [c.id]: true }))}
                  >
                    <MessageSquare className="w-4 h-4 mr-1.5" />
                    Add feedback
                  </Button>
                )}
                
                {isCommenting && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Feedback to contestant</Label>
                    <Textarea
                      placeholder={`What did they do well in ${c.name}? How could they improve?`}
                      value={comment}
                      onChange={(e) => setComments((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      className="text-sm min-h-[80px] bg-background resize-none focus-visible:ring-primary/50"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer sticky bar */}
      <div className="sticky bottom-4 z-10 bg-background/95 backdrop-blur-md border rounded-2xl p-4 shadow-xl mt-8 animate-in slide-in-from-bottom-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Star className="h-6 w-6 text-primary fill-primary/20" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-0.5">Total Weighted Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-foreground tracking-tighter">
                  {totalWeighted.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  out of {maxPossible.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
          <Button 
            size="lg"
            className="w-full sm:w-auto font-semibold rounded-xl"
            onClick={handleSubmit} 
            disabled={isSubmitting || !isFullyScored}
          >
            {isSubmitting ? "Submitting..." : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Submit Final Score
              </>
            )}
          </Button>
        </div>
        {!isFullyScored && (
          <p className="text-center sm:text-right text-xs text-destructive mt-3 font-medium">
            Please score all criteria before submitting.
          </p>
        )}
      </div>
    </div>
  );
};
