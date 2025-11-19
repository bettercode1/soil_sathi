import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, AlertCircle, CheckCircle2, X } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { commonTranslations } from "@/constants/allTranslations";

type AlertSeverity = "info" | "warning" | "critical" | "success";

interface AlertCardProps {
  title: string;
  message: string;
  severity?: AlertSeverity;
  recommendations?: string[];
  date?: Date | string;
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

const severityConfig: Record<
  AlertSeverity,
  { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }
> = {
  info: {
    icon: <Info className="h-5 w-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  critical: {
    icon: <AlertCircle className="h-5 w-5" />,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
};

export const AlertCard: React.FC<AlertCardProps> = ({
  title,
  message,
  severity = "info",
  recommendations,
  date,
  onDismiss,
  onAction,
  actionLabel,
  className = "",
}) => {
  const { language, t } = useLanguage();
  const config = severityConfig[severity];
  
  const severityLabels = {
    en: { info: "Info", warning: "Warning", critical: "Critical", success: "Success" },
    hi: { info: "जानकारी", warning: "चेतावनी", critical: "गंभीर", success: "सफल" },
    pa: { info: "ਜਾਣਕਾਰੀ", warning: "ਚੇਤਾਵਨੀ", critical: "ਗੰਭੀਰ", success: "ਸਫਲ" },
    ta: { info: "தகவல்", warning: "எச்சரிக்கை", critical: "முக்கியமான", success: "வெற்றி" },
    te: { info: "సమాచారం", warning: "హెచ్చరిక", critical: "క్లిష్టమైన", success: "విజయం" },
    bn: { info: "তথ্য", warning: "সতর্কতা", critical: "সমালোচনামূলক", success: "সাফল্য" },
    mr: { info: "माहिती", warning: "चेतावनी", critical: "गंभीर", success: "यश" },
  };

  return (
    <Card
      className={`${config.bgColor} ${config.borderColor} border-2 ${className}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={config.color}>{config.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{title}</CardTitle>
                <Badge variant="outline" className={config.color}>
                  {severityLabels[language]?.[severity] || severityLabels.en[severity]}
                </Badge>
              </div>
              {date && (
                <CardDescription className="text-xs mt-1">
                  {format(
                    date instanceof Date ? date : new Date(date),
                    "MMM dd, yyyy 'at' HH:mm"
                  )}
                </CardDescription>
              )}
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm mb-4">{message}</p>

        {recommendations && recommendations.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">
              {t(commonTranslations.recommendations)}
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              {recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {onAction && (
          <Button
            onClick={onAction}
            variant={severity === "critical" ? "destructive" : "default"}
            size="sm"
          >
            {actionLabel || t(commonTranslations.takeAction)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

