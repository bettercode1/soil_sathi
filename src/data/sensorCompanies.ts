import type { SensorCompany, CompanySensor } from "@/types/sensor-integration";
import type { SensorType } from "@/types/sensor-data";

const SENSOR_SPECS: Record<
  SensorType,
  { typeLabel: string; range: string; unit: string; accuracy: string; icon: string }
> = {
  pH: { typeLabel: "pH Sensor", range: "4.0 – 9.0", unit: "pH", accuracy: "±0.1 pH", icon: "Activity" },
  moisture: { typeLabel: "Moisture Sensor", range: "0 – 100%", unit: "%", accuracy: "±2%", icon: "Droplets" },
  temperature: { typeLabel: "Temperature Sensor", range: "-10 – 60°C", unit: "°C", accuracy: "±0.5°C", icon: "Thermometer" },
  nitrogen: { typeLabel: "Nitrogen Sensor", range: "0 – 500 kg/ha", unit: "kg/ha", accuracy: "±5%", icon: "Leaf" },
  phosphorus: { typeLabel: "Phosphorus Sensor", range: "0 – 100 kg/ha", unit: "kg/ha", accuracy: "±5%", icon: "FlaskConical" },
  potassium: { typeLabel: "Potassium Sensor", range: "0 – 400 kg/ha", unit: "kg/ha", accuracy: "±5%", icon: "Zap" },
  organic_matter: { typeLabel: "Organic Matter Sensor", range: "0 – 10%", unit: "%", accuracy: "±0.3%", icon: "TreePine" },
  ec: { typeLabel: "EC Sensor", range: "0 – 5 dS/m", unit: "dS/m", accuracy: "±0.05 dS/m", icon: "Gauge" },
  salinity: { typeLabel: "Salinity Sensor", range: "0 – 5 dS/m", unit: "dS/m", accuracy: "±0.05 dS/m", icon: "Waves" },
  humidity: { typeLabel: "Humidity Sensor", range: "0 – 100%", unit: "%", accuracy: "±3%", icon: "CloudRain" },
};

const createSensor = (
  companyId: string,
  prefix: string,
  type: SensorType,
  index: number,
  online: boolean
): CompanySensor => {
  const spec = SENSOR_SPECS[type];
  return {
    id: `${companyId}-${type}-${index}`,
    companyId,
    name: `${prefix} ${spec.typeLabel} Pro`,
    type,
    typeLabel: spec.typeLabel,
    measurementRange: spec.range,
    unit: spec.unit,
    accuracy: spec.accuracy,
    status: online ? "online" : "offline",
    imageIcon: spec.icon,
    firmwareVersion: `v2.${index}.${Math.floor(Math.random() * 9)}`,
  };
};

const olatusSensors: CompanySensor[] = [
  createSensor("olatus", "Olatus", "pH", 1, true),
  createSensor("olatus", "Olatus", "moisture", 2, true),
  createSensor("olatus", "Olatus", "temperature", 3, true),
  createSensor("olatus", "Olatus", "nitrogen", 4, true),
  createSensor("olatus", "Olatus", "phosphorus", 5, true),
  createSensor("olatus", "Olatus", "potassium", 6, true),
  createSensor("olatus", "Olatus", "organic_matter", 7, true),
  createSensor("olatus", "Olatus", "ec", 8, false),
];

const yantrabotSensors: CompanySensor[] = [
  createSensor("yantrabot", "YBot", "pH", 1, true),
  createSensor("yantrabot", "YBot", "moisture", 2, true),
  createSensor("yantrabot", "YBot", "temperature", 3, true),
  createSensor("yantrabot", "YBot", "nitrogen", 4, true),
  createSensor("yantrabot", "YBot", "ec", 5, true),
  createSensor("yantrabot", "YBot", "salinity", 6, true),
  createSensor("yantrabot", "YBot", "humidity", 7, true),
];

const autobotixSensors: CompanySensor[] = [
  createSensor("autobotix", "AutoBotix", "pH", 1, true),
  createSensor("autobotix", "AutoBotix", "moisture", 2, true),
  createSensor("autobotix", "AutoBotix", "temperature", 3, false),
  createSensor("autobotix", "AutoBotix", "nitrogen", 4, true),
  createSensor("autobotix", "AutoBotix", "phosphorus", 5, true),
  createSensor("autobotix", "AutoBotix", "potassium", 6, true),
  createSensor("autobotix", "AutoBotix", "organic_matter", 7, true),
  createSensor("autobotix", "AutoBotix", "ec", 8, true),
  createSensor("autobotix", "AutoBotix", "salinity", 9, true),
];

const ssMicroSensors: CompanySensor[] = [
  createSensor("ssmicro", "SS Micro", "pH", 1, true),
  createSensor("ssmicro", "SS Micro", "moisture", 2, true),
  createSensor("ssmicro", "SS Micro", "temperature", 3, true),
  createSensor("ssmicro", "SS Micro", "nitrogen", 4, true),
  createSensor("ssmicro", "SS Micro", "phosphorus", 5, false),
  createSensor("ssmicro", "SS Micro", "potassium", 6, true),
  createSensor("ssmicro", "SS Micro", "humidity", 7, true),
];

const nexgenSensors: CompanySensor[] = [
  createSensor("nexgen", "NexGen", "pH", 1, true),
  createSensor("nexgen", "NexGen", "moisture", 2, true),
  createSensor("nexgen", "NexGen", "temperature", 3, true),
  createSensor("nexgen", "NexGen", "nitrogen", 4, true),
  createSensor("nexgen", "NexGen", "phosphorus", 5, true),
  createSensor("nexgen", "NexGen", "potassium", 6, true),
  createSensor("nexgen", "NexGen", "organic_matter", 7, true),
  createSensor("nexgen", "NexGen", "ec", 8, true),
  createSensor("nexgen", "NexGen", "salinity", 9, true),
  createSensor("nexgen", "NexGen", "humidity", 10, true),
];

export const SENSOR_COMPANIES: SensorCompany[] = [
  {
    id: "olatus",
    name: "Olatus Systems",
    headquarters: "Pune, Maharashtra",
    description: "Precision IoT soil monitoring solutions for smart agriculture across India.",
    logoColor: "#2e7d32",
    logoInitials: "OS",
    supportedSensorCount: olatusSensors.length,
    sensors: olatusSensors,
  },
  {
    id: "yantrabot",
    name: "Yantrabot Technologies",
    headquarters: "Bangalore, Karnataka",
    description: "Robotics-driven field sensors with AI-ready data pipelines for crop intelligence.",
    logoColor: "#1565c0",
    logoInitials: "YT",
    supportedSensorCount: yantrabotSensors.length,
    sensors: yantrabotSensors,
  },
  {
    id: "autobotix",
    name: "Auto Botix",
    headquarters: "Hyderabad, Telangana",
    description: "Automated multi-parameter soil probes designed for large-scale farm deployments.",
    logoColor: "#6a1b9a",
    logoInitials: "AB",
    supportedSensorCount: autobotixSensors.length,
    sensors: autobotixSensors,
  },
  {
    id: "ssmicro",
    name: "S S Micro Electronics",
    headquarters: "Chennai, Tamil Nadu",
    description: "Cost-effective micro-sensor modules for smallholder and cooperative farming.",
    logoColor: "#e65100",
    logoInitials: "SS",
    supportedSensorCount: ssMicroSensors.length,
    sensors: ssMicroSensors,
  },
  {
    id: "nexgen",
    name: "NexGen Roorkee Industries",
    headquarters: "Roorkee, Uttarakhand",
    description: "Enterprise-grade soil analytics hardware with full NPK and salinity monitoring suite.",
    logoColor: "#00695c",
    logoInitials: "NG",
    supportedSensorCount: nexgenSensors.length,
    sensors: nexgenSensors,
  },
];

export const getCompanyById = (id: string): SensorCompany | undefined =>
  SENSOR_COMPANIES.find((c) => c.id === id);

export { SENSOR_SPECS };
