
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
    <div className={cn("feature-card flex flex-col", className)}>
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
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
