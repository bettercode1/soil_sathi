import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Radio, Wifi, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import type { IntegrationStep } from "@/types/sensor-integration";
import { INTEGRATION_STEP_ORDER, STEP_LABEL_KEYS, stepIndex } from "./integrationSteps";

gsap.registerPlugin(useGSAP);

interface IntegrationPlatformHeaderProps {
  currentStep: IntegrationStep;
}

export const IntegrationPlatformHeader = ({ currentStep }: IntegrationPlatformHeaderProps) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const currentIdx = stepIndex(currentStep);
  const progressPct = (currentIdx / (INTEGRATION_STEP_ORDER.length - 1)) * 100;

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".si-hero-icon", { scale: 0, rotation: -120, duration: 0.55 })
        .from(".si-hero-title", { y: 24, opacity: 0, duration: 0.5 }, "-=0.25")
        .from(".si-hero-sub", { y: 16, opacity: 0, duration: 0.45 }, "-=0.3")
        .from(".si-hero-badge", { x: 20, opacity: 0, duration: 0.4 }, "-=0.25")
        .from(".si-step-node", { y: 20, opacity: 0, stagger: 0.06, duration: 0.4 }, "-=0.15");
    },
    { scope: containerRef },
  );

  useEffect(() => {
    if (!progressRef.current) return;
    gsap.to(progressRef.current, {
      width: `${progressPct}%`,
      duration: 0.65,
      ease: "power2.inOut",
    });
  }, [progressPct]);

  useEffect(() => {
    const activeNode = containerRef.current?.querySelector(`[data-step-index="${currentIdx}"]`);
    if (activeNode) {
      gsap.fromTo(
        activeNode.querySelector(".si-step-circle"),
        { scale: 0.85 },
        { scale: 1.12, duration: 0.35, yoyo: true, repeat: 1, ease: "power2.out" },
      );
    }
  }, [currentIdx]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 shadow-lg shadow-emerald-100/50"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="si-hero-glow absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <div className="relative p-5 md:p-7 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="si-hero-icon relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
              <Wifi className="h-7 w-7 text-white" />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md">
                <Sparkles className="h-3 w-3 text-emerald-600" />
              </span>
            </div>
            <div>
              <h1 className="si-hero-title text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                {t(si.platformTitle)}
              </h1>
              <p className="si-hero-sub mt-1 max-w-xl text-sm text-slate-600">{t(si.platformSubtitle)}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="si-hero-badge w-fit border-emerald-300 bg-emerald-50/90 px-4 py-1.5 text-emerald-800 shadow-sm"
          >
            <Radio className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
            {t(si.demoMode)}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div
              ref={progressRef}
              className="absolute left-0 top-0 h-full w-0 rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="w-full overflow-x-auto scrollbar-none pb-1">
            <div className="flex min-w-max items-start justify-between gap-0 px-0.5">
              {INTEGRATION_STEP_ORDER.map((stepKey, idx) => {
                const isComplete = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const labelKey = STEP_LABEL_KEYS[stepKey];

                return (
                  <div
                    key={stepKey}
                    data-step-index={idx}
                    className="si-step-node flex flex-1 flex-col items-center gap-2 min-w-[64px] md:min-w-[88px] max-w-[120px]"
                  >
                    <div
                      className={`si-step-circle flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                        isComplete
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/40"
                          : isCurrent
                            ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white ring-4 ring-emerald-200/80 shadow-lg shadow-emerald-500/30"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {isComplete ? (
                        <span className="text-sm">✓</span>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-center text-[10px] md:text-xs font-semibold leading-tight px-0.5 ${
                        isCurrent
                          ? "text-emerald-800"
                          : isComplete
                            ? "text-emerald-600"
                            : "text-slate-400"
                      }`}
                    >
                      {t(si[labelKey])}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
