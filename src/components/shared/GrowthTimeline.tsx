import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, TrendingUp, Leaf } from "lucide-react";

interface GrowthStage {
  stage: string;
  confidence?: number;
  healthScore?: number;
}

interface GrowthTimelineEntry {
  id: string;
  date: Date | string;
  imageUrl: string;
  growthStage: GrowthStage;
  observations?: string[];
  aiAnalysis?: string;
}

interface GrowthTimelineProps {
  entries: GrowthTimelineEntry[];
  className?: string;
}

export const GrowthTimeline: React.FC<GrowthTimelineProps> = ({
  entries,
  className = "",
}) => {
  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  const getHealthColor = (score?: number) => {
    if (!score) return "bg-slate-500";
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getHealthLabel = (score?: number) => {
    if (!score) return "Unknown";
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Attention";
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {sortedEntries.map((entry, index) => {
        const date = entry.date instanceof Date ? entry.date : new Date(entry.date);
        const isLast = index === sortedEntries.length - 1;

        return (
          <div key={entry.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border" />
            )}

            {/* Timeline dot */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-background ${getHealthColor(entry.growthStage.healthScore)}`}
              >
                <Leaf className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Content */}
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {format(date, "MMM dd, yyyy")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="secondary">
                        {entry.growthStage.stage}
                      </Badge>
                      {entry.growthStage.confidence && (
                        <Badge variant="outline">
                          {entry.growthStage.confidence.toFixed(0)}% confidence
                        </Badge>
                      )}
                      {entry.growthStage.healthScore !== undefined && (
                        <Badge
                          className={getHealthColor(entry.growthStage.healthScore)}
                        >
                          {getHealthLabel(entry.growthStage.healthScore)} (
                          {entry.growthStage.healthScore})
                        </Badge>
                      )}
                    </div>

                    {entry.observations && entry.observations.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Observations:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {entry.observations.map((obs, idx) => (
                            <li key={idx}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.aiAnalysis && (
                      <p className="text-sm text-muted-foreground">
                        {entry.aiAnalysis}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <img
                      src={entry.imageUrl}
                      alt={`Growth stage on ${format(date, "MMM dd, yyyy")}`}
                      className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}

      {sortedEntries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No growth monitoring entries yet</p>
          <p className="text-sm">Upload photos to track crop growth</p>
        </div>
      )}
    </div>
  );
};

