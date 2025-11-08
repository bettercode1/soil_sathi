import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const coerceOptionalNumber = (max?: number) =>
  z
    .preprocess(
      (value) => {
        if (typeof value === "number") {
          return Number.isNaN(value) ? undefined : value;
        }
        if (typeof value === "string") {
          const trimmed = value.trim();
          return trimmed ? Number(trimmed) : undefined;
        }
        return undefined;
      },
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
  GEMINI_API_KEY,
  ALLOWED_ORIGINS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
} = parseResult.data;

export const env = {
  nodeEnv: NODE_ENV ?? "development",
  port: PORT ?? 3001,
  geminiModel: GEMINI_MODEL ?? "gemini-2.5-flash",
  geminiApiKey: GEMINI_API_KEY,
  allowedOrigins: ALLOWED_ORIGINS ?? [],
  rateLimitWindowMs: RATE_LIMIT_WINDOW_MS ?? 60_000,
  rateLimitMaxRequests: RATE_LIMIT_MAX_REQUESTS ?? 20,
} as const;

if (!env.geminiApiKey) {
  console.warn(
    "[SoilSathi] GEMINI_API_KEY not set. Gemini-backed endpoints will respond with an error until it is provided."
  );
}


