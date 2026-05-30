import { motion } from "framer-motion";
import { Building2, MapPin, Radio, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import { getCompanyDescription, getPartnerTypeLabel, getStateLabel } from "@/utils/useLocalizedSensorIntegration";
import type { SensorCompany } from "@/types/sensor-integration";
import { pageVariants } from "./shared";
import { NortheastRegionDashboard } from "./NortheastRegionDashboard";

interface CompanySelectionProps {
  nationalCompanies: SensorCompany[];
  northeastCompanies: SensorCompany[];
  onSelect: (company: SensorCompany) => void;
}

const PartnerCard = ({
  company,
  idx,
  onSelect,
  t,
  accentClass = "from-emerald-500 to-green-400",
}: {
  company: SensorCompany;
  idx: number;
  onSelect: (c: SensorCompany) => void;
  t: (key: (typeof si)[keyof typeof si]) => string;
  accentClass?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.06 }}
    whileHover={{ scale: 1.02, y: -4 }}
  >
    <Card className="group h-full border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-shadow overflow-hidden bg-white">
      <div className={`h-1.5 bg-gradient-to-r ${accentClass}`} />
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-start gap-4 mb-3">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0"
            style={{ backgroundColor: company.logoColor }}
          >
            {company.logoInitials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-emerald-700 transition-colors">
              {company.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {company.state ? getStateLabel(company.state, t) : company.headquarters}
              </span>
            </div>
          </div>
        </div>

        {company.partnerType && (
          <Badge variant="outline" className="mb-3 w-fit text-[10px] bg-slate-50 text-slate-600 border-slate-200">
            {getPartnerTypeLabel(company.partnerType, t)}
          </Badge>
        )}

        <p className="text-sm text-slate-600 flex-1 mb-4 line-clamp-3">
          {getCompanyDescription(company.id, t) || company.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-sm">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">{company.supportedSensorCount}</span>
            <span className="text-slate-500">{t(si.sensorsLabel)}</span>
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onSelect(company)}>
            {t(si.viewSensors)}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  </motion.div>
);

export const CompanySelection = ({
  nationalCompanies,
  northeastCompanies,
  onSelect,
}: CompanySelectionProps) => {
  const { t } = useLanguage();

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-10">
      <div className="text-center max-w-3xl mx-auto">
        <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
          <Radio className="h-3 w-3 mr-1" />
          {t(si.sensorIntegrationDemo)}
        </Badge>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">{t(si.selectPartnerTitle)}</h2>
        <p className="text-slate-600 text-sm md:text-base">{t(si.selectPartnerDesc)}</p>
      </div>

      <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/40 via-white to-emerald-50/30 p-5 md:p-8 space-y-6">
        <NortheastRegionDashboard />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {northeastCompanies.map((company, idx) => (
            <PartnerCard
              key={company.id}
              company={company}
              idx={idx}
              onSelect={onSelect}
              t={t}
              accentClass="from-teal-600 to-emerald-500"
            />
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">
          {t(si.nationalPartnersTitle)}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {nationalCompanies.map((company, idx) => (
            <PartnerCard key={company.id} company={company} idx={idx} onSelect={onSelect} t={t} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
