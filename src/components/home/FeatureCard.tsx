
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
        "feature-card flex h-full flex-col rounded-xl border border-border bg-card/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 flex-grow">{description}</p>
      <Button asChild className="mt-auto w-full" variant="outline">
        <Link to={linkTo}>{buttonLabel}</Link>
      </Button>
    </div>
  );
};

export default FeatureCard;
