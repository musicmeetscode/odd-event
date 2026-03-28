import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { Submission } from "@/types/api";

interface SubmissionCardProps {
  submission: Submission;
  rank?: number;
  onClick?: () => void;
}

export const SubmissionCard = ({ submission, rank, onClick }: SubmissionCardProps) => {
  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md border-border/50 ${onClick ? "cursor-pointer hover:border-primary/30" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {rank !== undefined && (
              <span className={`text-2xl font-bold ${rank <= 3 ? "text-yellow-500" : "text-muted-foreground"}`}>
                #{rank}
              </span>
            )}
            <div>
              <CardTitle className="text-base">{submission.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                by {submission.submitted_by_name}
              </p>
            </div>
          </div>
          {submission.total_weighted_score !== undefined && (
            <Badge variant="secondary" className="text-sm font-mono">
              {submission.total_weighted_score.toFixed(1)} pts
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {submission.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {submission.description}
          </p>
        )}

        <div className="flex gap-3">
          {submission.repo_url && (
            <a
              href={submission.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" /> Repo
            </a>
          )}
          {submission.demo_url && (
            <a
              href={submission.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" /> Demo
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
