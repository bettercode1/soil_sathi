import type { SensorCompany, CompanySensor } from "@/types/sensor-integration";
import type { SensorType } from "@/types/sensor-data";
import { SENSOR_SPECS } from "./sensorCompanies";

const createSensor = (
  companyId: string,
  prefix: string,
  type: SensorType,
  index: number,
  online: boolean,
  customLabel?: string,
): CompanySensor => {
  const spec = SENSOR_SPECS[type];
  const label = customLabel ?? spec.typeLabel;
  return {
    id: `${companyId}-${type}-${index}`,
    companyId,
    name: `${prefix} ${label}`,
    type,
    typeLabel: label,
    measurementRange: spec.range,
    unit: spec.unit,
    accuracy: spec.accuracy,
    status: online ? "online" : "offline",
    imageIcon: spec.icon,
    firmwareVersion: `v2.${index}.${Math.floor(Math.random() * 9)}`,
  };
};

const aauSensors: CompanySensor[] = [
  createSensor("aau", "AAU", "pH", 1, true),
  createSensor("aau", "AAU", "moisture", 2, true),
  createSensor("aau", "AAU", "temperature", 3, true),
  createSensor("aau", "AAU", "humidity", 4, true),
  createSensor("aau", "AAU", "nitrogen", 5, true, "NPK Sensor"),
];

const iitgSensors: CompanySensor[] = [
  createSensor("iitg", "IIT-G", "pH", 1, true, "IoT Soil Sensor"),
  createSensor("iitg", "IIT-G", "moisture", 2, true, "Smart Irrigation Sensor"),
  createSensor("iitg", "IIT-G", "temperature", 3, true, "Weather Sensor"),
  createSensor("iitg", "IIT-G", "ec", 4, true),
];

const meghalayaSensors: CompanySensor[] = [
  createSensor("meghalayaAgri", "MAIH", "moisture", 1, true),
  createSensor("meghalayaAgri", "MAIH", "organic_matter", 2, true),
  createSensor("meghalayaAgri", "MAIH", "pH", 3, true),
  createSensor("meghalayaAgri", "MAIH", "humidity", 4, true),
];

const manipurSensors: CompanySensor[] = [
  createSensor("manipurAgri", "MAC", "nitrogen", 1, true, "NPK Sensor"),
  createSensor("manipurAgri", "MAC", "moisture", 2, true),
  createSensor("manipurAgri", "MAC", "salinity", 3, true),
  createSensor("manipurAgri", "MAC", "temperature", 4, true),
];

const mizoramSensors: CompanySensor[] = [
  createSensor("mizoramSmart", "MSFI", "moisture", 1, true),
  createSensor("mizoramSmart", "MSFI", "humidity", 2, true),
  createSensor("mizoramSmart", "MSFI", "pH", 3, true),
];

const nagalandSensors: CompanySensor[] = [
  createSensor("nagalandPrecision", "NPAC", "organic_matter", 1, true, "Soil Health Sensor"),
  createSensor("nagalandPrecision", "NPAC", "organic_matter", 2, true),
  createSensor("nagalandPrecision", "NPAC", "moisture", 3, true),
  createSensor("nagalandPrecision", "NPAC", "temperature", 4, true),
];

const tripuraSensors: CompanySensor[] = [
  createSensor("tripuraSmart", "TSAM", "nitrogen", 1, true, "NPK Sensor"),
  createSensor("tripuraSmart", "TSAM", "pH", 2, true),
  createSensor("tripuraSmart", "TSAM", "moisture", 3, true),
  createSensor("tripuraSmart", "TSAM", "ec", 4, true),
];

const arunachalSensors: CompanySensor[] = [
  createSensor("arunachalAgri", "AARC", "moisture", 1, true),
  createSensor("arunachalAgri", "AARC", "temperature", 2, true),
  createSensor("arunachalAgri", "AARC", "humidity", 3, true),
  createSensor("arunachalAgri", "AARC", "organic_matter", 4, true),
];

const sikkimSensors: CompanySensor[] = [
  createSensor("sikkimOrganic", "SOFTC", "organic_matter", 1, true),
  createSensor("sikkimOrganic", "SOFTC", "pH", 2, true),
  createSensor("sikkimOrganic", "SOFTC", "moisture", 3, true),
  createSensor("sikkimOrganic", "SOFTC", "temperature", 4, true),
];

export const NORTHEAST_SENSOR_COMPANIES: SensorCompany[] = [
  {
    id: "aau",
    name: "Assam Agricultural University (AAU)",
    headquarters: "Jorhat, Assam",
    state: "Assam",
    partnerType: "Agricultural Research Institution",
    description: "Research-based soil monitoring systems for precision agriculture and farmer advisory services.",
    logoColor: "#1b5e20",
    logoInitials: "AA",
    supportedSensorCount: aauSensors.length,
    sensors: aauSensors,
    region: "northeast",
  },
  {
    id: "iitg",
    name: "IIT Guwahati AgriTech Lab",
    headquarters: "Guwahati, Assam",
    state: "Assam",
    partnerType: "Research & Innovation Partner",
    description: "Advanced sensor integration and AI-driven agriculture monitoring systems.",
    logoColor: "#0d47a1",
    logoInitials: "IG",
    supportedSensorCount: iitgSensors.length,
    sensors: iitgSensors,
    region: "northeast",
  },
  {
    id: "meghalayaAgri",
    name: "Meghalaya Agri Innovation Hub",
    headquarters: "Shillong, Meghalaya",
    state: "Meghalaya",
    partnerType: "AgriTech Partner",
    description: "Supporting sustainable farming and smart agriculture initiatives.",
    logoColor: "#00695c",
    logoInitials: "MI",
    supportedSensorCount: meghalayaSensors.length,
    sensors: meghalayaSensors,
    region: "northeast",
  },
  {
    id: "manipurAgri",
    name: "Manipur AgriTech Centre",
    headquarters: "Imphal, Manipur",
    state: "Manipur",
    partnerType: "Agriculture Technology Partner",
    description: "Focused on precision farming and digital agriculture solutions.",
    logoColor: "#6a1b9a",
    logoInitials: "MA",
    supportedSensorCount: manipurSensors.length,
    sensors: manipurSensors,
    region: "northeast",
  },
  {
    id: "mizoramSmart",
    name: "Mizoram Smart Farming Initiative",
    headquarters: "Aizawl, Mizoram",
    state: "Mizoram",
    partnerType: "Government Agriculture Program",
    description: "Promoting sensor-based farming and crop monitoring.",
    logoColor: "#e65100",
    logoInitials: "MZ",
    supportedSensorCount: mizoramSensors.length,
    sensors: mizoramSensors,
    region: "northeast",
  },
  {
    id: "nagalandPrecision",
    name: "Nagaland Precision Agriculture Centre",
    headquarters: "Kohima, Nagaland",
    state: "Nagaland",
    partnerType: "Agriculture Research Partner",
    description: "Precision agriculture and soil health monitoring solutions.",
    logoColor: "#4527a0",
    logoInitials: "NP",
    supportedSensorCount: nagalandSensors.length,
    sensors: nagalandSensors,
    region: "northeast",
  },
  {
    id: "tripuraSmart",
    name: "Tripura Smart Agriculture Mission",
    headquarters: "Agartala, Tripura",
    state: "Tripura",
    partnerType: "Agriculture Innovation Partner",
    description: "Digital agriculture and soil analytics initiatives.",
    logoColor: "#c62828",
    logoInitials: "TR",
    supportedSensorCount: tripuraSensors.length,
    sensors: tripuraSensors,
    region: "northeast",
  },
  {
    id: "arunachalAgri",
    name: "Arunachal AgriTech Research Centre",
    headquarters: "Itanagar, Arunachal Pradesh",
    state: "Arunachal Pradesh",
    partnerType: "Research Partner",
    description: "Agriculture technology and environmental monitoring systems.",
    logoColor: "#0277bd",
    logoInitials: "AR",
    supportedSensorCount: arunachalSensors.length,
    sensors: arunachalSensors,
    region: "northeast",
  },
  {
    id: "sikkimOrganic",
    name: "Sikkim Organic Farming Technology Centre",
    headquarters: "Gangtok, Sikkim",
    state: "Sikkim",
    partnerType: "Organic Farming Technology Partner",
    description: "Organic farming and sustainable soil management solutions.",
    logoColor: "#2e7d32",
    logoInitials: "SK",
    supportedSensorCount: sikkimSensors.length,
    sensors: sikkimSensors,
    region: "northeast",
  },
];

export const NE_STATES = [
  "Assam",
  "Meghalaya",
  "Manipur",
  "Mizoram",
  "Nagaland",
  "Tripura",
  "Arunachal Pradesh",
  "Sikkim",
] as const;

export const getNortheastDashboardStats = () => {
  const allSensors = NORTHEAST_SENSOR_COMPANIES.flatMap((c) => c.sensors);
  const activeDevices = allSensors.filter((s) => s.status === "online").length;
  return {
    totalPartners: NORTHEAST_SENSOR_COMPANIES.length,
    connectedSensors: allSensors.length,
    activeDevices,
    soilReportsGenerated: 1247,
    statesCovered: NE_STATES.length,
    farmersSupported: 8500,
  };
};

export const getPartnersByState = () => {
  const map = new Map<string, number>();
  NE_STATES.forEach((s) => map.set(s, 0));
  NORTHEAST_SENSOR_COMPANIES.forEach((c) => {
    if (c.state) map.set(c.state, (map.get(c.state) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([state, count]) => ({ state, count }));
};
