import {
  Activity,
  CloudRain,
  Droplets,
  FlaskConical,
  Gauge,
  Leaf,
  Thermometer,
  TreePine,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  Droplets,
  Thermometer,
  Leaf,
  FlaskConical,
  Zap,
  TreePine,
  Gauge,
  Waves,
  CloudRain,
};

export const getSensorIcon = (iconName: string): LucideIcon =>
  ICON_MAP[iconName] ?? Activity;

export { INTEGRATION_STEP_ORDER, STEP_LABEL_KEYS, stepIndex } from "./integrationSteps";

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};
