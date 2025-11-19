import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  className?: string;
}

export const PageHero: React.FC<PageHeroProps> = ({
  title,
  subtitle,
  icon: Icon,
  className,
}) => {
  return (
    <section className={cn("relative overflow-hidden bg-neutral-950 text-white", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-neutral-950/85 to-emerald-950/60" />
      <div className="pointer-events-none absolute -left-16 top-1/3 h-64 w-64 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 right-6 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl" />
      
      <div className="relative z-10 container mx-auto px-2 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto text-center">
          {Icon && (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-emerald-400/15 ring-1 ring-inset ring-emerald-400/30 mb-6">
              <Icon className="h-7 w-7 text-emerald-400" />
            </div>
          )}
          <h1 className="mb-4 text-2xl font-bold leading-tight sm:text-3xl md:text-3xl">
            {title}
          </h1>
          <p className="mx-auto max-w-2xl text-base text-slate-200/80 sm:text-[17px]">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
};

