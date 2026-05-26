import path from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

// Use cwd (repo root on Render and `npm start`) so .env works in dev and after build
const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env");

const envLoadResult = loadEnv({ path: envPath });
if (envLoadResult.error && !process.env.GEMINI_API_KEY) {
  console.warn(
    `[SoilSathi] Could not load ${envPath}:`,
    envLoadResult.error.message
  );
}

const extractNumericValue = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (/^[+-]?\d+$/.test(trimmed)) {
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    }

    if (trimmed.includes(":")) {
      const candidate = trimmed.split(":").at(-1);
      if (candidate && /^\d+$/.test(candidate)) {
        const parsed = Number.parseInt(candidate, 10);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }

    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  return undefined;
};

const coerceOptionalNumber = (max?: number) =>
  z
    .preprocess(
      (value) => extractNumericValue(value),
      max
        ? z.number().int().positive().max(max).optional()
        : z.number().int().positive().optional()
    )
    .optional();

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  PORT: coerceOptionalNumber(65535),
  GEMINI_MODEL: z
    .string()
    .trim()
    .min(1, "GEMINI_MODEL cannot be empty")
    .optional(),
  GEMINI_EMBED_MODEL: z
    .string()
    .trim()
    .min(1, "GEMINI_EMBED_MODEL cannot be empty")
    .optional(),
  GEMINI_API_KEY: z
    .string()
    .trim()
    .min(1, "GEMINI_API_KEY cannot be an empty string")
    .optional(),
  ALLOWED_ORIGINS: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    )
    .optional(),
  RATE_LIMIT_WINDOW_MS: coerceOptionalNumber(),
  RATE_LIMIT_MAX_REQUESTS: coerceOptionalNumber(),
});

const parseResult = rawEnvSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("[SoilSathi] Invalid environment configuration.");
  console.error(parseResult.error.flatten().fieldErrors);
  process.exit(1);
}

const {
  NODE_ENV,
  PORT,
  GEMINI_MODEL,
  GEMINI_EMBED_MODEL,
  GEMINI_API_KEY,
  ALLOWED_ORIGINS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
} = parseResult.data;

// Render provides PORT environment variable, use it if available
// Otherwise default to 3001 for local development
const getPort = () => {
  if (PORT) return PORT;
  // Render and other platforms set PORT env var
  const renderPort = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : null;
  return renderPort || 3001;
};

export const env = {
  nodeEnv: NODE_ENV ?? (process.env.npm_lifecycle_event?.includes("dev") ? "development" : "production"), // Default to production for Render, but dev for local scripts
  port: getPort(),
  geminiModel: GEMINI_MODEL ?? "gemini-3.5-flash",
  geminiEmbedModel: GEMINI_EMBED_MODEL ?? "text-embedding-004",
  geminiApiKey: GEMINI_API_KEY,
  allowedOrigins: ALLOWED_ORIGINS ?? [],
  rateLimitWindowMs: RATE_LIMIT_WINDOW_MS ?? 60_000,
  // Production SPA can trigger several API calls per action; 20/min was too low on Render
  rateLimitMaxRequests:
    RATE_LIMIT_MAX_REQUESTS ??
    (NODE_ENV === "production" ? 120 : 60),
} as const;

if (!env.geminiApiKey) {
  console.warn(
    "[SoilSathi] GEMINI_API_KEY not set. Save it in .env at the project root and restart the server."
  );
} else {
  console.log(
    `[SoilSathi] Gemini configured (model: ${env.geminiModel}, key loaded from ${envPath})`
  );
}


