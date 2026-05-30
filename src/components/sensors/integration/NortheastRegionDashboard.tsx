import { motion } from "framer-motion";
import { Building2, Cpu, FileText, MapPin, Radio, Users, Wifi } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { sensorIntegrationTranslations as si } from "@/constants/sensorIntegrationTranslations";
import {
  getNortheastDashboardStats,
  getPartnersByState,
  NE_STATES,
} from "@/data/northeastSensorCompanies";
import { getStateLabel } from "@/utils/useLocalizedSensorIntegration";

const STATE_COLORS = ["#2e7d32", "#1565c0", "#6a1b9a", "#e65100", "#4527a0", "#c62828", "#0277bd", "#00695c"];

export const NortheastRegionDashboard = () => {
  const { t } = useLanguage();
  const stats = getNortheastDashboardStats();
  const stateData = getPartnersByState().map((d) => ({
    ...d,
    label: getStateLabel(d.state, t),
  }));

  const mapUrl =
    "https://www.openstreetmap.org/export/embed.html?bbox=89.5%2C22.0%2C97.5%2C29.5&layer=mapnik&marker=26.2%2C92.5";

  const statCards = [
    { label: t(si.neTotalPartners), value: stats.totalPartners, icon: Building2 },
    { label: t(si.neConnectedSensors), value: stats.connectedSensors, icon: Cpu },
    { label: t(si.neActiveDevices), value: stats.activeDevices, icon: Wifi },
    { label: t(si.neSoilReports), value: stats.soilReportsGenerated.toLocaleString(), icon: FileText },
    { label: t(si.neStatesCovered), value: stats.statesCovered, icon: MapPin },
    { label: t(si.neFarmersSupported), value: stats.farmersSupported.toLocaleString(), icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center max-w-3xl mx-auto">
        <Badge className="mb-3 bg-teal-100 text-teal-800 hover:bg-teal-100 border-teal-200">
          <Radio className="h-3 w-3 mr-1" />
          {t(si.neRegionBadge)}
        </Badge>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">{t(si.neSectionTitle)}</h2>
        <p className="text-sm text-slate-600 mt-2">{t(si.neSectionDesc)}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/30">
              <CardContent className="p-4">
                <stat.icon className="h-5 w-5 text-teal-600 mb-2" />
                <p className="text-xl md:text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-[10px] md:text-xs text-slate-500 leading-tight mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-slate-200 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal-600" />
              {t(si.neMapTitle)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-56 md:h-64">
              <iframe title={t(si.neMapTitle)} src={mapUrl} className="w-full h-full border-0" loading="lazy" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-white text-sm font-medium">{t(si.neMapCaption)}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {NE_STATES.map((state) => (
                    <Badge key={state} variant="secondary" className="text-[10px] bg-white/20 text-white border-0">
                      {getStateLabel(state, t)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t(si.nePartnerDistribution)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stateData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 9 }} width={72} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stateData.map((_, i) => (
                    <Cell key={i} fill={STATE_COLORS[i % STATE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
