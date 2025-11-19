
import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  linkTo: string;
  buttonLabel: string;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: Icon,
  linkTo,
  buttonLabel,
  className,
}) => {
  return (
    <div
      className={cn(
        "feature-card flex h-full flex-col rounded-2xl border border-border/50 glass-card p-6 card-hover",
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
        <Icon className="h-7 w-7 text-primary icon-modern" strokeWidth={2.5} />
      </div>
      <h3 className="mb-3 text-xl font-bold text-foreground leading-tight">{title}</h3>
      <p className="text-muted-foreground mb-6 flex-grow text-base leading-relaxed">{description}</p>
      <Button 
        asChild 
        className="mt-auto w-full btn-modern" 
        variant="outline"
      >
        <Link to={linkTo} className="flex items-center justify-center gap-2">
          {buttonLabel}
        </Link>
      </Button>
    </div>
  );
};

export default FeatureCard;
