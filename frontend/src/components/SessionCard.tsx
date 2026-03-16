import { ArrowRight, Presentation } from "lucide-react";

interface SessionCardProps {
  id: number;
  title: string;
  description: string;
  color: "primary" | "secondary" | "accent" | "destructive";
  onClick: () => void;
}

const colorClasses = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
};

const SessionCard = ({ title, description, color, onClick }: SessionCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group w-full bg-card rounded-xl p-6 shadow-material-md hover:shadow-material-lg transition-all duration-300 border-2 border-transparent hover:border-primary text-left"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center ${colorClasses[color]} transition-colors`}>
          <Presentation className="w-7 h-7" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {description}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </button>
  );
};

export default SessionCard;
