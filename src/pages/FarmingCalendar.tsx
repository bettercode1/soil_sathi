import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { farmingCalendarTranslations, commonTranslations } from "@/constants/allTranslations";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";
import { saveFarmingCalendarTask, getFarmingCalendarTasks, updateFarmingCalendarTask } from "@/services/firebase/reportService";
import { Calendar as CalendarIcon, CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { PageHero } from "@/components/shared/PageHero";

type CalendarTask = {
  taskType: string;
  title: string;
  description: string;
  scheduledDate: string;
  priority: "low" | "medium" | "high" | "critical";
};

type FarmingCalendarResponse = {
  language: string;
  tasks: CalendarTask[];
};

const FarmingCalendar = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const [cropName, setCropName] = useState("");
  const [cropType, setCropType] = useState("");
  const [region, setRegion] = useState("");
  const [duration, setDuration] = useState("180");
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const handleGenerateCalendar = async () => {
    if (!cropName.trim() || !region.trim()) {
      toast({
        title: t(commonTranslations.missingInformation),
        description: t(commonTranslations.provideCropNameAndRegion),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTasks([]);

    try {
      const response = await fetch(buildApiUrl("/api/farming-calendar"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          cropName: cropName.trim(),
          cropType: cropType.trim() || undefined,
          region: region.trim(),
          duration: parseInt(duration),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await parseJsonResponse<FarmingCalendarResponse>(response);
      setTasks(result.tasks);

      // Save tasks to Firebase
      for (const task of result.tasks) {
        try {
          await saveFarmingCalendarTask({
            language: result.language as any,
            cropName: cropName.trim(),
            cropType: cropType.trim() || "Unknown",
            region: region.trim(),
            taskType: task.taskType as any,
            title: task.title,
            description: task.description,
            scheduledDate: new Date(task.scheduledDate),
            priority: task.priority,
            status: "pending",
            aiGenerated: true,
          });
        } catch (err) {
          console.error("Failed to save task:", err);
        }
      }

      toast({
        title: t(commonTranslations.calendarGenerated),
        description: `${result.tasks.length} ${t(commonTranslations.tasksCreated)}`,
      });
    } catch (error) {
      toast({
        title: t(commonTranslations.errorGeneratingCalendar),
        description: error instanceof Error ? error.message : t(commonTranslations.errorGeneratingCalendar),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskComplete = async (taskIndex: number) => {
    const task = tasks[taskIndex];
    const taskId = `task-${taskIndex}`;
    
    setCompletedTasks(new Set([...completedTasks, taskId]));

    toast({
      title: t(commonTranslations.taskCompleted),
      description: task.title,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-amber-500";
      case "low":
        return "bg-emerald-500";
      default:
        return "bg-slate-500";
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = new Date(a.scheduledDate);
    const dateB = new Date(b.scheduledDate);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <Layout>
      <PageHero
        title={t(farmingCalendarTranslations.title)}
        subtitle={t(farmingCalendarTranslations.subtitle)}
        icon={CalendarIcon}
      />

      <section className="py-12">
        <div className="container mx-auto px-2">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>{t(commonTranslations.generateFarmingCalendar)}</CardTitle>
                <CardDescription>
                  {t(farmingCalendarTranslations.subtitle)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.cropName)} *</label>
                    <Input
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      placeholder={t(commonTranslations.cropNamePlaceholder)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.cropType)}</label>
                    <Input
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      placeholder={t(commonTranslations.cropTypePlaceholder)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.region)} *</label>
                    <Input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder={t(commonTranslations.regionPlaceholder)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t(commonTranslations.durationDays)}</label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90 {t(commonTranslations.days)}</SelectItem>
                        <SelectItem value="180">180 {t(commonTranslations.days)}</SelectItem>
                        <SelectItem value="365">365 {t(commonTranslations.days)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateCalendar}
                  disabled={isLoading || !cropName.trim() || !region.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t(commonTranslations.generating)}
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {t(farmingCalendarTranslations.generateCalendar)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {tasks.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{t(farmingCalendarTranslations.tasks)}</h2>
                {sortedTasks.map((task, idx) => {
                  const taskId = `task-${idx}`;
                  const isCompleted = completedTasks.has(taskId);
                  const taskDate = new Date(task.scheduledDate);
                  const isPast = taskDate < new Date();

                  return (
                    <Card key={idx} className={isCompleted ? "opacity-60" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <Badge variant="outline">{task.taskType.replace("_", " ")}</Badge>
                              {isPast && !isCompleted && (
                                <Badge variant="destructive">{t(commonTranslations.overdue)}</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{format(taskDate, "MMM dd, yyyy")}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => handleTaskComplete(idx)}
                            />
                            {isCompleted && (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FarmingCalendar;

