import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { JudgingCriteria } from "@/types/api";

interface ScoringFormProps {
  criteria: JudgingCriteria[];
  existingScores?: Record<number, { score: number; comment: string }>;
  onSubmit: (scores: { criteria: number; score: number; comment: string }[]) => void;
  isSubmitting?: boolean;
}

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

  const handleSubmit = () => {
    const payload = criteria.map((c) => ({
      criteria: c.id,
      score: scores[c.id] ?? 0,
      comment: comments[c.id] ?? "",
    }));
    onSubmit(payload);
  };

  return (
    <div className="space-y-6">
      {criteria.map((c) => (
        <div key={c.id} className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-start justify-between">
            <div>
              <Label className="text-sm font-semibold">{c.name}</Label>
              {c.description && (
                <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
              )}
            </div>
            <span className="text-lg font-mono font-bold text-primary">
              {scores[c.id] ?? 0}
              <span className="text-xs text-muted-foreground font-normal">
                /{c.max_score}
              </span>
            </span>
          </div>

          <Slider
            value={[scores[c.id] ?? 0]}
            max={c.max_score}
            step={0.5}
            onValueChange={([val]) =>
              setScores((prev) => ({ ...prev, [c.id]: val }))
            }
            className="w-full"
          />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Weight: {c.weight}x</span>
            <span>•</span>
            <span>
              Weighted: {((scores[c.id] ?? 0) * c.weight).toFixed(1)}
            </span>
          </div>

          <Textarea
            placeholder="Optional comment..."
            value={comments[c.id] ?? ""}
            onChange={(e) =>
              setComments((prev) => ({ ...prev, [c.id]: e.target.value }))
            }
            className="text-sm min-h-[60px]"
          />
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          Total weighted:{" "}
          <span className="font-mono font-bold text-foreground">
            {criteria
              .reduce((sum, c) => sum + (scores[c.id] ?? 0) * c.weight, 0)
              .toFixed(1)}
          </span>
        </p>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Submit Scores"}
        </Button>
      </div>
    </div>
  );
};
