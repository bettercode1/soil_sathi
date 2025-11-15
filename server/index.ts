// Ensure environment variables are loaded first
console.log("[SoilSathi] Loading environment variables...");
import { config as loadEnv } from "dotenv";
loadEnv();
console.log("[SoilSathi] Environment variables loaded");

console.log("[SoilSathi] Importing dependencies...");
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import type { Response } from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { GoogleGenAI, Part, Schema, Type } from "@google/genai";
console.log("[SoilSathi] Core dependencies imported");

console.log("[SoilSathi] Importing RAG services...");
import {
  buildContextText,
  detectLanguageFromText,
  retrieveKnowledgeContext,
  type RetrievedKnowledge,
} from "./rag/service.js";
console.log("[SoilSathi] RAG services imported");

console.log("[SoilSathi] Importing config...");
import { env } from "./config.js";
console.log("[SoilSathi] Config imported");

console.log("[SoilSathi] Initializing Express app...");
const app = express();
const port = env.port;
console.log("[SoilSathi] Express app initialized, port:", port);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuildDir = path.resolve(__dirname, "../client");
const clientIndexHtml = path.join(clientBuildDir, "index.html");

app.disable("x-powered-by");

const corsOptions: CorsOptions = {
  origin: env.allowedOrigins.length ? env.allowedOrigins : undefined,
};

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: false, limit: "20mb" }));

const apiRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiRateLimiter);

const MODEL_NAME = env.geminiModel;
const API_KEY = env.geminiApiKey;

// Initialize Gemini client - automatically reads GEMINI_API_KEY from environment
// Per official docs: https://ai.google.dev/gemini-api/docs/quickstart
// The client gets the API key from the environment variable GEMINI_API_KEY
// Allow backend to start even without API key (will show error on API calls)
let genAI: GoogleGenAI | null = null;
if (API_KEY && API_KEY !== "your_gemini_api_key_here" && API_KEY.length > 20) {
  try {
    genAI = new GoogleGenAI({ apiKey: API_KEY });
    console.log("[SoilSathi] ✅ Gemini client initialized successfully");
  } catch (error) {
    console.error("[SoilSathi] ❌ Failed to initialize Gemini client:", error);
    genAI = null;
  }
} else {
  console.warn("[SoilSathi] ⚠️ GEMINI_API_KEY not configured or invalid");
  console.warn("[SoilSathi] Backend will start but API endpoints will return errors");
}

const MAX_REPORT_TEXT_LENGTH = 10_000;
const MAX_IMAGE_CHAR_LENGTH = 8_000_000; // ~6 MB base64
const MAX_MANUAL_ENTRIES = 50;
const MAX_MANUAL_KEY_LENGTH = 50;
const MAX_MANUAL_VALUE_LENGTH = 120;
const MAX_CONTEXT_NOTES_LENGTH = 500;
const MAX_CONTEXT_CHALLENGES = 5;
const MAX_ASSIST_HISTORY = 6;
const MAX_ASSIST_MESSAGE_LENGTH = 800;
const BASE64_REGEX = /^[a-zA-Z0-9+/=\s]+$/;

const languageSchema = z
  .string()
  .trim()
  .regex(/^[a-z-]{2,10}$/i, "Language code must contain 2-10 alphabetic characters or hyphen.")
  .transform((value) => value.toLowerCase());

const analyzeRequestSchema = z.object({
  language: languageSchema.optional(),
  manualValues: z.record(z.union([z.string(), z.number()])).optional(),
  reportImage: z
    .object({
      data: z.string().min(1).max(MAX_IMAGE_CHAR_LENGTH),
      mimeType: z
        .string()
        .regex(/^image\/[a-zA-Z0-9.+-]+$/, "Invalid MIME type for report image.")
        .optional(),
    })
    .optional(),
  reportText: z.string().trim().max(MAX_REPORT_TEXT_LENGTH).optional(),
});

const structuredOptionSchema = z.object({
  id: z.string().min(1, "Option id is required."),
  label: z.string().min(1, "Option label is required.").max(100),
});

const farmSizeSchema = z.object({
  value: z
    .number({ coerce: true })
    .positive("Farm size must be greater than zero.")
    .max(5_000, "Farm size seems too large. Please use a value under 5,000."),
  unit: z.enum(["acre", "hectare"]),
});

const structuredOptionArraySchema = z
  .array(structuredOptionSchema)
  .max(MAX_CONTEXT_CHALLENGES, `Please limit to ${MAX_CONTEXT_CHALLENGES} challenges.`);

const recommendationsRequestSchema = z.object({
  language: languageSchema.optional(),
  soilType: structuredOptionSchema,
  region: structuredOptionSchema,
  crop: structuredOptionSchema,
  growthStage: structuredOptionSchema,
  farmSize: farmSizeSchema.optional(),
  irrigation: structuredOptionSchema.optional(),
  farmingGoal: structuredOptionSchema.optional(),
  challenges: structuredOptionArraySchema.optional(),
  notes: z
    .string()
    .trim()
    .max(MAX_CONTEXT_NOTES_LENGTH, "Notes must be under 500 characters.")
    .optional(),
});

const sanitizeManualValues = (manualValues: Record<string, string | number>) => {
  return Object.fromEntries(
    Object.entries(manualValues)
      .slice(0, MAX_MANUAL_ENTRIES)
      .map(([key, value]) => {
        const sanitizedKey = key.trim().slice(0, MAX_MANUAL_KEY_LENGTH) || "unknown";
        const rawValue = typeof value === "number" ? value.toString() : value.trim();
        const sanitizedValue =
          rawValue.length > 0 ? rawValue.slice(0, MAX_MANUAL_VALUE_LENGTH) : "not provided";
        return [sanitizedKey, sanitizedValue];
      })
  );
};

const validateImageData = (data: string) => {
  const [, encodedPayload = data] = data.split(",");
  if (!BASE64_REGEX.test(encodedPayload)) {
    throw new Error("reportImage.data must be base64 encoded.");
  }
  return encodedPayload;
};

const buildGenerationConfig = (schema: Schema) =>
  ({
    temperature: 0.3, // Lower temperature for faster, more deterministic responses
    topP: 0.7, // Reduced from 0.8 for faster generation
    topK: 20, // Reduced from 40 for faster generation
    // Note: maxOutputTokens removed - may not be supported in all Gemini API versions
    responseMimeType: "application/json",
    responseSchema: schema,
  }) satisfies Record<string, unknown>;

// Timeout wrapper for API calls
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
};

const generateJsonResponse = async <T>({
  model,
  parts,
  schema,
  timeoutMs = 60000, // Default 60 seconds (longer for image analysis)
}: {
  model: string;
  parts: Part[];
  schema: Schema;
  timeoutMs?: number;
}): Promise<T> => {
  const isDev = env.nodeEnv === "development";
  if (isDev) {
    console.log("[Gemini] generateJsonResponse called");
    console.log("[Gemini] Model:", model);
    console.log("[Gemini] Parts count:", parts.length);
    console.log("[Gemini] Timeout:", timeoutMs, "ms");
  }
  
  if (!genAI) {
    console.error("[Gemini] ❌ Gemini client is not configured!");
    throw new Error("Gemini client is not configured.");
  }

  try {
    const config = buildGenerationConfig(schema);
    if (isDev) {
      console.log("[Gemini] Calling genAI.models.generateContent...");
    }
    
    // Add configurable timeout to prevent hanging requests
    const apiCall = genAI.models.generateContent({
      model,
      contents: [{ role: "user" as const, parts }],
      config,
    });
    
    const result = await withTimeout(
      apiCall,
      timeoutMs,
      `Gemini API request timed out after ${timeoutMs / 1000} seconds`
    );
    
    if (isDev) {
      console.log("[Gemini] ✅ Response received from Gemini");
    }

    const rawText = result.text as unknown;
    
    const textValue =
      typeof rawText === "function"
        ? (rawText as () => string)()
        : (rawText as string | undefined);

    if (!textValue) {
      console.error("[Gemini] ❌ Empty response from Gemini");
      throw new Error("Empty response from Gemini");
    }

    try {
      const parsed = JSON.parse(textValue) as T;
      if (isDev) {
        console.log("[Gemini] ✅ JSON parsed successfully");
      }
      return parsed;
    } catch (parseError) {
      console.error("[Gemini] ❌ JSON parsing failed!");
      console.error("[Gemini] Parse error:", parseError);
      if (isDev) {
        console.error("[Gemini] Text that failed to parse:", textValue);
      }
      throw new Error(`Received invalid JSON from Gemini: ${parseError instanceof Error ? parseError.message : "Unknown parse error"}`);
    }
  } catch (error: unknown) {
    console.error("\n========== [Gemini] API ERROR ==========");
    console.error("[Gemini] Error caught in generateJsonResponse");
    console.error("[Gemini] Error type:", typeof error);
    console.error("[Gemini] Error:", error);
    
    // Handle Gemini API errors - check multiple possible error formats
    if (error && typeof error === "object") {
      console.error("[Gemini] Error is an object, checking formats...");
      // Format 1: { error: { code, message, status } }
      if ("error" in error) {
        const apiError = error as { error?: { code?: number; message?: string; status?: string } };
        const errorCode = apiError.error?.code;
        const errorMessage = apiError.error?.message || "Unknown error from Gemini API";
        const errorStatus = apiError.error?.status;

        const customError = new Error(errorMessage) as Error & { statusCode?: number; apiError?: unknown };
        customError.statusCode = errorCode || 500;
        customError.apiError = apiError.error;
        throw customError;
      }

      // Format 2: Direct error object with code/message/status
      if ("code" in error || "status" in error || "message" in error) {
        const apiError = error as { code?: number; message?: string; status?: string };
        const errorCode = apiError.code;
        const errorMessage = apiError.message || "Unknown error from Gemini API";
        const errorStatus = apiError.status;

        const customError = new Error(errorMessage) as Error & { statusCode?: number; apiError?: unknown };
        customError.statusCode = errorCode || 500;
        customError.apiError = { code: errorCode, message: errorMessage, status: errorStatus };
        throw customError;
      }

      // Format 3: Error with cause property (nested error)
      if ("cause" in error && error.cause && typeof error.cause === "object") {
        const cause = error.cause as { code?: number; message?: string; status?: string; error?: unknown };
        if ("code" in cause || "status" in cause) {
          const errorCode = cause.code;
          const errorMessage = cause.message || (error as Error).message || "Unknown error from Gemini API";
          const errorStatus = cause.status;

          const customError = new Error(errorMessage) as Error & { statusCode?: number; apiError?: unknown };
          customError.statusCode = errorCode || 500;
          customError.apiError = { code: errorCode, message: errorMessage, status: errorStatus };
          throw customError;
        }
      }
    }

    // If it's a standard Error, check if message contains error info
    if (error instanceof Error) {
      try {
        // Try to parse JSON from error message
        const parsed = JSON.parse(error.message);
        if (parsed && typeof parsed === "object" && ("error" in parsed || "code" in parsed)) {
          const apiError = parsed.error || parsed;
          const errorCode = apiError.code;
          const errorMessage = apiError.message || error.message;
          const errorStatus = apiError.status;

          const customError = new Error(errorMessage) as Error & { statusCode?: number; apiError?: unknown };
          customError.statusCode = errorCode || 500;
          customError.apiError = apiError;
          throw customError;
        }
      } catch {
        // Not JSON, continue with original error
      }
    }

    // Re-throw other errors as-is
    throw error;
  }
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  required: [
    "language",
    "overview",
    "soilQuality",
    "nutrientAnalysis",
    "fertilizerRecommendations",
    "improvementPlan",
    "warnings",
    "nextSteps",
    "sectionTitles",
    "analysisTimestamp",
  ],
  properties: {
    language: { type: Type.STRING },
    overview: { type: Type.STRING },
    soilQuality: {
      type: Type.OBJECT,
      required: ["rating", "score", "description"],
      properties: {
        rating: { type: Type.STRING },
        score: { type: Type.NUMBER },
        description: { type: Type.STRING },
      },
    },
    sectionTitles: {
      type: Type.OBJECT,
      required: [
        "overview",
        "soilQuality",
        "nutrientAnalysis",
        "chemicalPlan",
        "organicPlan",
        "improvementPlan",
        "warnings",
        "nextSteps",
      ],
      properties: {
        overview: { type: Type.STRING },
        soilQuality: { type: Type.STRING },
        nutrientAnalysis: { type: Type.STRING },
        chemicalPlan: { type: Type.STRING },
        organicPlan: { type: Type.STRING },
        improvementPlan: { type: Type.STRING },
        warnings: { type: Type.STRING },
        nextSteps: { type: Type.STRING },
      },
    },
    nutrientAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["parameter", "value", "status", "impact", "recommendation"],
        properties: {
          parameter: { type: Type.STRING },
          value: { type: Type.STRING },
          status: { type: Type.STRING },
          impact: { type: Type.STRING },
          recommendation: { type: Type.STRING },
        },
      },
    },
    fertilizerRecommendations: {
      type: Type.OBJECT,
      required: ["chemical", "organic"],
      properties: {
        chemical: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["name", "quantity", "timing", "application", "notes"],
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.STRING },
              timing: { type: Type.STRING },
              application: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
          },
        },
        organic: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["name", "quantity", "timing", "application", "notes"],
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.STRING },
              timing: { type: Type.STRING },
              application: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
          },
        },
      },
    },
    improvementPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["action", "benefit", "priority"],
        properties: {
          action: { type: Type.STRING },
          benefit: { type: Type.STRING },
          priority: { type: Type.STRING },
        },
      },
    },
    warnings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    nextSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    analysisTimestamp: { type: Type.STRING },
  },
};

const recommendationEntrySchema: Schema = {
  type: Type.OBJECT,
  required: ["name", "quantity", "frequency", "details"],
  properties: {
    name: { type: Type.STRING },
    quantity: { type: Type.STRING },
    frequency: { type: Type.STRING },
    details: { type: Type.STRING },
    notes: { type: Type.STRING },
  },
};

const recommendationsSchema: Schema = {
  type: Type.OBJECT,
  required: ["language", "summary", "chemical", "organic", "tips"],
  properties: {
    language: { type: Type.STRING },
    summary: { type: Type.STRING },
    chemical: {
      type: Type.OBJECT,
      required: ["primary", "secondary"],
      properties: {
        primary: { type: Type.ARRAY, items: recommendationEntrySchema },
        secondary: { type: Type.ARRAY, items: recommendationEntrySchema },
      },
    },
    organic: {
      type: Type.OBJECT,
      required: ["primary", "secondary"],
      properties: {
        primary: { type: Type.ARRAY, items: recommendationEntrySchema },
        secondary: { type: Type.ARRAY, items: recommendationEntrySchema },
      },
    },
    tips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
};

type StructuredOption = z.infer<typeof structuredOptionSchema>;

type FarmSize = z.infer<typeof farmSizeSchema>;

const buildPrompt = (
  language: string,
  manualValues?: Record<string, string>,
  reportText?: string
): Part[] => {
  const formattedManual =
    manualValues && Object.keys(manualValues).length > 0
      ? Object.entries(manualValues)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")
      : "No manual values provided.";

  const reportSection = reportText?.trim()
    ? `Lab report transcription:\n${reportText.trim()}`
    : "No lab report text provided.";

  return [
    {
      text: [
        "You are SoilSathi AI, an agronomy expert that helps Indian farmers improve soil health.",
        `Respond in ${language.toUpperCase()} (the user's selected language).`,
        "Use the provided soil metrics and lab report information (if any) to craft a detailed, actionable analysis.",
        "Deliver the response strictly as JSON that conforms to the provided schema.",
        "",
        "Guidelines:",
        "- Be practical and concise, but offer enough context for farmers with low technical literacy.",
        "- Reference nutrient levels, deficiencies, and risks.",
        "- Recommend both chemical and organic fertilizer strategies.",
        "- Include actionable improvement steps and warnings when necessary.",
        "- Provide localized section titles inside the sectionTitles object.",
        "- Populate every array with at least one item; if data is missing, infer from typical agronomy knowledge but note assumptions.",
        "",
        "Manual soil metrics:",
        formattedManual,
        "",
        reportSection,
      ].join("\n"),
    },
  ];
};

const formatFarmSize = (farmSize?: FarmSize) => {
  if (!farmSize) {
    return "Not specified";
  }
  const roundedValue = Number(farmSize.value.toFixed(2));
  const unitLabel = farmSize.unit === "acre" ? "acre" : "hectare";
  const pluralized =
    roundedValue === 1
      ? `${roundedValue} ${unitLabel}`
      : `${roundedValue} ${unitLabel}${unitLabel.endsWith("e") ? "s" : "s"}`;
  return pluralized;
};

const formatOptionalOption = (title: string, option?: StructuredOption) =>
  `${title}: ${option ? `${option.label} (id: ${option.id})` : "Not specified"}`;

const formatChallenges = (challenges?: StructuredOption[]) => {
  if (!challenges || challenges.length === 0) {
    return "None reported.";
  }
  return challenges
    .map((challenge) => `- ${challenge.label} (id: ${challenge.id})`)
    .join("\n");
};

const buildRecommendationsPrompt = (
  language: string,
  context: {
    soilType: StructuredOption;
    region: StructuredOption;
    crop: StructuredOption;
    growthStage: StructuredOption;
    farmSize?: FarmSize;
    irrigation?: StructuredOption;
    farmingGoal?: StructuredOption;
    challenges?: StructuredOption[];
    notes?: string;
  }
): Part[] => {
  const bullet = (title: string, value: StructuredOption) => `${title}: ${value.label} (id: ${value.id})`;

  return [
    {
      text: [
        "You are SoilSathi AI, an agronomy assistant for Indian farmers.",
        `Respond in ${language.toUpperCase()} (the farmer's selected language).`,
        "Use the provided context to craft actionable fertilizer recommendations that balance chemical and organic approaches.",
        "Output strictly as JSON that matches the provided schema.",
        "",
        "Context:",
        bullet("Soil type", context.soilType),
        bullet("Region", context.region),
        bullet("Crop", context.crop),
        bullet("Growth stage", context.growthStage),
        `Farm size: ${formatFarmSize(context.farmSize)}`,
        formatOptionalOption("Irrigation method", context.irrigation),
        formatOptionalOption("Primary farming goal", context.farmingGoal),
        "Key challenges:",
        formatChallenges(context.challenges),
        `Additional farmer notes: ${context.notes?.trim() || "None provided."}`,
        "",
        "Guidelines:",
        "- Consider typical nutrient needs for the crop and stage under the given soil and regional conditions.",
        "- Highlight both primary and secondary nutrient management for chemical fertilizers.",
        "- Suggest practical organic alternatives or supplements.",
        "- Include realistic quantities/rates with units farmers understand (per acre or per hectare).",
        "- Keep frequency instructions concise (e.g., split doses with timings).",
        "- Use the notes field for warnings, compatibility advice, or safety precautions when relevant.",
        "- Populate the language field with the ISO code you respond in (e.g., \"en\", \"hi\").",
        "- Provide at least two entries in each primary list when information allows; never leave an array empty.",
        "- Provide 2-3 short actionable tips tailored to the scenario.",
        "- Reference any provided challenges or notes with practical mitigation steps.",
        "- Never refer to this as AI output; speak as an expert advisor.",
      ].join("\n"),
    },
  ];
};

const farmerAssistMessageSchema = z.object({
  role: z.enum(["farmer", "assistant"]),
  content: z
    .string()
    .trim()
    .min(1, "Messages must contain text.")
    .max(MAX_ASSIST_MESSAGE_LENGTH, "Message is too long."),
});

const farmerAssistRequestSchema = z.object({
  language: languageSchema.optional(),
  question: z
    .string()
    .trim()
    .min(5, "Please ask a more specific question.")
    .max(MAX_ASSIST_MESSAGE_LENGTH, "Question is too long."),
  soilType: structuredOptionSchema.optional(),
  region: structuredOptionSchema.optional(),
  crop: structuredOptionSchema.optional(),
  growthStage: structuredOptionSchema.optional(),
  farmSize: farmSizeSchema.optional(),
  irrigation: structuredOptionSchema.optional(),
  farmingGoal: structuredOptionSchema.optional(),
  challenges: structuredOptionArraySchema.optional(),
  notes: z
    .string()
    .trim()
    .max(MAX_CONTEXT_NOTES_LENGTH, "Notes must be under 500 characters.")
    .optional(),
  history: z
    .array(farmerAssistMessageSchema)
    .max(MAX_ASSIST_HISTORY, `Please limit history to ${MAX_ASSIST_HISTORY} messages.`)
    .optional(),
});

const farmerAssistSourceSchema: Schema = {
  type: Type.OBJECT,
  required: ["title", "summary", "confidence"],
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    url: { type: Type.STRING },
    confidence: { type: Type.STRING },
    source: { type: Type.STRING },
    lastVerified: { type: Type.STRING },
    note: { type: Type.STRING },
  },
};

const farmerAssistSchema: Schema = {
  type: Type.OBJECT,
  required: ["language", "answer", "followUps", "sources"],
  properties: {
    language: { type: Type.STRING },
    answer: { type: Type.STRING },
    followUps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    clarifyingQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    sources: {
      type: Type.ARRAY,
      items: farmerAssistSourceSchema,
    },
    safetyMessage: { type: Type.STRING },
  },
};

const buildFarmerAssistPrompt = (
  language: string,
  payload: {
    question: string;
    soilType?: StructuredOption;
    region?: StructuredOption;
    crop?: StructuredOption;
    growthStage?: StructuredOption;
    farmSize?: FarmSize;
    irrigation?: StructuredOption;
    farmingGoal?: StructuredOption;
    challenges?: StructuredOption[];
    notes?: string;
    history?: z.infer<typeof farmerAssistMessageSchema>[];
  },
  knowledgeContext: string
): Part[] => {
  // Ensure language is valid
  const normalizedLanguage = language?.toLowerCase()?.trim();
  const validLanguage = (normalizedLanguage && ["mr", "hi", "en"].includes(normalizedLanguage) ? normalizedLanguage : "en") as "mr" | "hi" | "en";
  const historyText = payload.history?.length
    ? payload.history
        .map((message, index) => `${index + 1}. ${message.role === "farmer" ? "Farmer" : "Advisor"}: ${message.content}`)
        .join("\n")
    : "No prior conversation.";

  const hasPriorAssistantExchange = payload.history?.some((message) => message.role === "assistant") ?? false;

  const optionalContext = [
    formatOptionalOption("Soil type", payload.soilType),
    formatOptionalOption("Region", payload.region),
    formatOptionalOption("Crop", payload.crop),
    formatOptionalOption("Growth stage", payload.growthStage),
    `Farm size: ${formatFarmSize(payload.farmSize)}`,
    formatOptionalOption("Irrigation method", payload.irrigation),
    formatOptionalOption("Primary farming goal", payload.farmingGoal),
    "Key challenges:",
    formatChallenges(payload.challenges),
    `Farmer notes: ${payload.notes?.trim() || "None provided."}`,
  ].join("\n");

  return [
    {
      text: [
        "You are Smart Shetkari Mitra (Smart Farmer Friend), a dedicated and compassionate live agricultural voice assistant for farmers in Maharashtra, India. Provide real-time, trustworthy guidance on farming practices, government schemes (Yojana), subsidies, loans, weather and crop care.",
        "",
        "CRITICAL INSTRUCTIONS FOR LIVE/VOICE CONVERSATION:",
        "1. Response pacing: Keep the primary answer extremely concise—no more than 2–3 short sentences delivered in priority order so they play back quickly over voice.",
        "2. Conversational flow: Briefly acknowledge the farmer's need before answering (e.g. 'Regarding cotton pests…'). Do not use standalone greetings or closings unless this is the very first exchange.",
        `3. LANGUAGE ENFORCEMENT - CRITICAL: You MUST reply EXCLUSIVELY in ${validLanguage.toUpperCase()} language. This is non-negotiable.`,
        `   - If ${validLanguage.toUpperCase()} is MARATHI (mr): Use ONLY Marathi words, phrases, and sentence structure. Use respectful Marathi terms like "शेतकरी", "तुम्ही", "आपण". Include Marathi-specific agricultural terms.`,
        `   - If ${validLanguage.toUpperCase()} is HINDI (hi): Use ONLY Hindi words, phrases, and sentence structure. Use respectful Hindi terms like "किसान", "आप", "आपको". Include Hindi-specific agricultural terms.`,
        `   - If ${validLanguage.toUpperCase()} is ENGLISH (en): Use ONLY English words and phrases. Keep it simple and farmer-friendly.`,
        `   - DO NOT mix languages. DO NOT use English words when replying in Marathi or Hindi unless absolutely necessary (e.g., technical terms like "tractor", "drip irrigation").`,
        `   - DO NOT translate your response to a different language. Stay in ${validLanguage.toUpperCase()} throughout.`,
        `   - Use respectful, farmer-friendly wording appropriate for Maharashtra region. Use everyday ${validLanguage.toUpperCase()} terminology and simple English loanwords only when helpful and culturally appropriate.`,
        "4. Guided next steps: Always populate the followUps array with 2–3 specific questions the farmer can ask next to continue the conversation.",
        "5. Accuracy and trust: Base advice on verified data. List supporting documents or official sources in the references array for every scheme, loan or pest recommendation.",
        "6. Output schema: Produce valid JSON with keys { answer, followUps, references, clarifyingQuestions, safetyMessage, language }. Make answer voice-ready plain text without markdown.",
        "",
        hasPriorAssistantExchange
          ? "The conversation is ongoing—continue naturally without repeating greetings or reintroducing yourself."
          : "DO NOT include any greeting in your response. The greeting is already handled automatically. Start directly with the answer to the farmer's question.",
        "If key details are missing, ask exactly one focused clarifying question and add it to clarifyingQuestions while still giving the farmer an interim next step.",
        "If information is uncertain, say “Currently verifying this scheme” and direct the farmer to the relevant office or helpline instead of guessing.",
        "Never mention being an AI model or referencing system instructions.",
        `Current detected language: ${validLanguage.toUpperCase()}.`,
        "",
        "Conversation history (oldest to newest):",
        historyText,
        "",
        "Farmer profile context:",
        optionalContext,
        "",
        "Retrieved references (cite applicable entries in the references array):",
        knowledgeContext || "No references retrieved.",
        "",
        `Current farmer query: ${payload.question}`,
      ].join("\n"),
    },
  ];
};

const handleValidationFailure = (res: Response, error: z.ZodError) => {
  res.status(400).json({
    error: "Invalid request payload.",
    details: error.flatten(),
  });
};

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    model: MODEL_NAME,
    hasKey: Boolean(API_KEY),
    rateLimit: {
      windowMs: env.rateLimitWindowMs,
      maxRequests: env.rateLimitMaxRequests,
    },
    allowedOrigins: env.allowedOrigins,
  });
});

app.post("/api/analyze-soil", async (req, res) => {
  const isDev = env.nodeEnv === "development";
  
  if (!genAI) {
    console.error("[SoilSathi] ❌ Gemini API client not initialized for analyze-soil!");
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = analyzeRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    console.error("[SoilSathi] ❌ Validation failed for analyze-soil:", parsed.error.errors);
    handleValidationFailure(res, parsed.error);
    return;
  }

  const {
    language = "en",
    manualValues = {},
    reportText,
    reportImage,
  } = parsed.data;

  try {
    if (isDev) {
      console.log("[SoilSathi] Analyze-soil request received", {
        language,
        hasManualValues: Object.keys(manualValues).length > 0,
        hasReportText: !!reportText,
        hasReportImage: !!reportImage,
      });
    }
    
    const sanitizedManualValues = sanitizeManualValues(manualValues);
    const trimmedReportText = reportText?.trim() || undefined;
    const parts = buildPrompt(language, sanitizedManualValues, trimmedReportText);

    if (reportImage?.data) {
      let base64Data: string;
      try {
        base64Data = validateImageData(reportImage.data);
      } catch (validationError) {
        res.status(400).json({
          error:
            validationError instanceof Error
              ? validationError.message
              : "Invalid report image data.",
        });
        return;
      }
      const mimeType =
        reportImage.mimeType ||
        (reportImage.data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)?.[1] ?? "image/png");

      const imagePart: Part = {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      };

      parts.push(imagePart);
    }

    if (isDev) {
      console.log("[SoilSathi] Calling Gemini API for soil analysis...");
    }
    
    // Use longer timeout for image analysis (90 seconds)
    const payload = await generateJsonResponse<Record<string, unknown>>({
      model: MODEL_NAME,
      parts,
      schema: analysisSchema,
      timeoutMs: 90000, // 90 seconds for image analysis
    });

    if (isDev) {
      console.log("[SoilSathi] ✅ Soil analysis completed successfully");
    }
    
    res.json(payload);
  } catch (error) {
    console.error("\n========== [SoilSathi] ANALYZE-SOIL ERROR ==========");
    console.error("[SoilSathi] Analysis failed:", error);
    console.error("[SoilSathi] Error type:", typeof error);
    if (error instanceof Error) {
      console.error("[SoilSathi] Error message:", error.message);
      console.error("[SoilSathi] Error stack:", error.stack);
    }
    
    // Check if it's a Gemini API error with status code
    const statusCode = (error as Error & { statusCode?: number })?.statusCode;
    const apiError = (error as Error & { apiError?: { code?: number; message?: string; status?: string } })?.apiError;
    
    if (statusCode === 503 || apiError?.status === "UNAVAILABLE") {
      res.status(503).json({
        error: "The model is overloaded. Please try again later.",
        details: apiError?.message || "The Gemini API is currently unavailable. Please wait a moment and try again.",
        code: apiError?.code || 503,
        status: apiError?.status || "UNAVAILABLE",
      });
      return;
    }

    const httpStatus = (statusCode && statusCode >= 400 && statusCode < 600) ? statusCode : 500;
    res.status(httpStatus).json({
      error: "Failed to generate soil analysis. Please try again later.",
      details:
        error instanceof Error
          ? error.message
          : "Unknown error occurred while contacting Gemini API.",
      ...(apiError && { apiError }),
    });
  }
});

app.post("/api/recommendations", async (req, res) => {
  if (!genAI) {
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = recommendationsRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    handleValidationFailure(res, parsed.error);
    return;
  }

  const {
    language = "en",
    soilType,
    region,
    crop,
    growthStage,
    farmSize,
    irrigation,
    farmingGoal,
    challenges,
    notes,
  } = parsed.data;

  try {
    const parts = buildRecommendationsPrompt(language, {
      soilType,
      region,
      crop,
      growthStage,
      farmSize,
      irrigation,
      farmingGoal,
      challenges,
      notes,
    });

    const payload = await generateJsonResponse<Record<string, unknown>>({
      model: MODEL_NAME,
      parts,
      schema: recommendationsSchema,
    });

    res.json(payload);
  } catch (error) {
    console.error("[SoilSathi] Recommendations failed:", error);
    
    // Check if it's a Gemini API error with status code
    const statusCode = (error as Error & { statusCode?: number })?.statusCode;
    const apiError = (error as Error & { apiError?: { code?: number; message?: string; status?: string } })?.apiError;
    
    if (statusCode === 503 || apiError?.status === "UNAVAILABLE") {
      res.status(503).json({
        error: "The model is overloaded. Please try again later.",
        details: apiError?.message || "The Gemini API is currently unavailable. Please wait a moment and try again.",
        code: apiError?.code || 503,
        status: apiError?.status || "UNAVAILABLE",
      });
      return;
    }

    const httpStatus = statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    res.status(httpStatus).json({
      error: "Failed to generate fertilizer recommendations. Please try again later.",
      details:
        error instanceof Error
          ? error.message
          : "Unknown error occurred while contacting Gemini API.",
      ...(apiError && { apiError }),
    });
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: !!genAI,
    model: MODEL_NAME,
  });
});

app.post("/api/farmer-assist", async (req, res) => {
  const isDev = env.nodeEnv === "development";
  const startTime = Date.now();
  
  if (isDev) {
    console.log("\n========== [SoilSathi] FARMER ASSIST REQUEST ==========");
    console.log("[SoilSathi] Request received at:", new Date().toISOString());
  }
  
  if (!genAI) {
    console.error("[SoilSathi] ❌ Gemini API client not initialized!");
    console.error("[SoilSathi] GEMINI_API_KEY is missing or invalid");
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = farmerAssistRequestSchema.safeParse(req.body);
  
  if (!parsed.success) {
    console.error("[SoilSathi] ❌ Validation failed!");
    if (isDev) {
      console.error("[SoilSathi] Validation errors:", JSON.stringify(parsed.error.errors, null, 2));
    }
    handleValidationFailure(res, parsed.error);
    return;
  }

  const {
    language,
    question,
    soilType,
    region,
    crop,
    growthStage,
    farmSize,
    irrigation,
    farmingGoal,
    challenges,
    notes,
    history,
  } = parsed.data;

  // Validate question
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    res.status(400).json({
      error: "Question is required and must not be empty.",
    });
    return;
  }

  try {
    if (isDev) {
      console.log("[SoilSathi] Farmer assist request received", {
        questionLength: question?.length,
        questionPreview: question?.substring(0, 50),
        language,
        hasHistory: !!history?.length,
      });
    }

    // Enhanced language detection with preferred language fallback
    let detectedLanguage: "mr" | "hi" | "en";
    try {
      const languageCode = language?.trim()?.toLowerCase();
      detectedLanguage = (languageCode || detectLanguageFromText(question, languageCode as "mr" | "hi" | "en" | undefined)) as "mr" | "hi" | "en";
      
      // Validate detected language
      if (!["mr", "hi", "en"].includes(detectedLanguage)) {
        console.error("[SoilSathi] Invalid detected language:", detectedLanguage);
        detectedLanguage = "en"; // Fallback to English
      }
      if (isDev) {
        console.log("[SoilSathi] Detected language:", detectedLanguage);
      }
    } catch (langError) {
      console.error("[SoilSathi] Language detection failed:", langError);
      detectedLanguage = "en"; // Fallback to English
    }

    // Retrieve knowledge context with error handling (reduced limit for faster processing)
    let knowledgeMatches: RetrievedKnowledge[] = [];
    try {
      knowledgeMatches = retrieveKnowledgeContext(question, {
        limit: 2, // Reduced from 4 to 2 for faster processing
        regionHint: region?.label ?? "Maharashtra",
        preferredLanguages: [detectedLanguage, language ?? "", "mr", "hi", "en"].filter(Boolean),
        tags: [
          crop?.label,
          region?.label,
          soilType?.label,
          farmingGoal?.label,
          ...(challenges?.map((item) => item.label) ?? []),
        ]
          .filter((token): token is string => Boolean(token))
          .map((token) => token.toLowerCase()),
      });
      if (isDev) {
        console.log("[SoilSathi] Retrieved knowledge matches:", knowledgeMatches.length);
      }
    } catch (knowledgeError) {
      console.error("[SoilSathi] Knowledge retrieval failed:", knowledgeError);
      // Continue with empty knowledge matches
      knowledgeMatches = [];
    }

    // Build context text with error handling
    let knowledgeContext = "";
    try {
      knowledgeContext = buildContextText(knowledgeMatches);
      if (isDev) {
        console.log("[SoilSathi] Knowledge context length:", knowledgeContext.length);
      }
    } catch (contextError) {
      console.error("[SoilSathi] Context building failed:", contextError);
      knowledgeContext = "";
    }

    // Build prompt with error handling
    let parts: Part[];
    try {
      parts = buildFarmerAssistPrompt(detectedLanguage, {
        question,
        soilType,
        region,
        crop,
        growthStage,
        farmSize,
        irrigation,
        farmingGoal,
        challenges,
        notes,
        history,
      }, knowledgeContext);
      if (isDev) {
        console.log("[SoilSathi] Prompt built successfully, parts:", parts.length);
      }
    } catch (promptError) {
      console.error("[SoilSathi] Prompt building failed:", promptError);
      throw new Error(`Failed to build prompt: ${promptError instanceof Error ? promptError.message : "Unknown error"}`);
    }

    // Generate response from Gemini
    let payload: Record<string, unknown>;
    try {
      if (isDev) {
        console.log("[SoilSathi] Calling Gemini API...");
      }
      payload = await generateJsonResponse<Record<string, unknown>>({
        model: MODEL_NAME,
        parts,
        schema: farmerAssistSchema,
      });
      const duration = Date.now() - startTime;
      if (isDev) {
        console.log(`[SoilSathi] Gemini API response received in ${duration}ms`);
      }
    } catch (geminiError) {
      console.error("[SoilSathi] Gemini API call failed:", geminiError);
      throw geminiError; // Re-throw to be handled by outer catch
    }

    const response = {
      ...payload,
      detectedLanguage,
      references: knowledgeMatches.map((entry) => ({
        id: entry.id,
        title: entry.title,
        summary: entry.summary,
        url: entry.url,
        updated: entry.updated,
        source: entry.source,
        score: entry.score,
      })),
    };
    
    console.log("[SoilSathi] ✅ Success! Sending response");
    console.log("[SoilSathi] Response preview:", {
      hasAnswer: !!payload.answer,
      answerLength: typeof payload.answer === "string" ? payload.answer.length : 0,
      detectedLanguage,
      referencesCount: response.references.length,
    });
    console.log("==================================================\n");
    
    res.json(response);
  } catch (error) {
    // Comprehensive error logging
    console.error("\n========== [SoilSathi] FARMER ASSIST ERROR ==========");
    console.error("[SoilSathi] Timestamp:", new Date().toISOString());
    console.error("[SoilSathi] Request details:", {
      question: question?.substring(0, 100),
      questionLength: question?.length,
      language,
      hasHistory: !!history?.length,
      historyLength: history?.length,
    });
    
    // Log full error object
    console.error("[SoilSathi] Error object:", error);
    console.error("[SoilSathi] Error type:", typeof error);
    console.error("[SoilSathi] Error constructor:", error?.constructor?.name);
    
    if (error instanceof Error) {
      console.error("[SoilSathi] Error name:", error.name);
      console.error("[SoilSathi] Error message:", error.message);
      console.error("[SoilSathi] Error stack:", error.stack);
      
      // Log all error properties
      const errorKeys = Object.keys(error);
      console.error("[SoilSathi] Error properties:", errorKeys);
      errorKeys.forEach((key) => {
        try {
          const value = (error as unknown as Record<string, unknown>)[key];
          console.error(`[SoilSathi] Error.${key}:`, value);
        } catch (e) {
          console.error(`[SoilSathi] Error.${key}: [Cannot access]`);
        }
      });
      
      // Check for statusCode
      if ("statusCode" in error) {
        const statusCode = (error as Error & { statusCode?: number }).statusCode;
        console.error("[SoilSathi] Error statusCode:", statusCode);
      }
      
      // Check for apiError
      if ("apiError" in error) {
        const apiError = (error as Error & { apiError?: unknown }).apiError;
        console.error("[SoilSathi] Error apiError:", JSON.stringify(apiError, null, 2));
      }
      
      // Check for cause
      if ("cause" in error) {
        console.error("[SoilSathi] Error cause:", error.cause);
      }
    } else {
      // Non-Error object
      console.error("[SoilSathi] Non-Error object details:", JSON.stringify(error, null, 2));
      try {
        console.error("[SoilSathi] Stringified error:", String(error));
      } catch (e) {
        console.error("[SoilSathi] Cannot stringify error");
      }
    }
    
    console.error("==================================================\n");
    
    // Check if it's a Gemini API error with status code
    const statusCode = (error as Error & { statusCode?: number })?.statusCode;
    const apiError = (error as Error & { apiError?: { code?: number; message?: string; status?: string } })?.apiError;
    
    if (statusCode === 503 || apiError?.status === "UNAVAILABLE") {
      console.error("[SoilSathi] Returning 503 Service Unavailable response");
      res.status(503).json({
        error: "The model is overloaded. Please try again later.",
        details: apiError?.message || "The Gemini API is currently unavailable. Please wait a moment and try again.",
        code: apiError?.code || 503,
        status: apiError?.status || "UNAVAILABLE",
      });
      return;
    }

    const httpStatus = (statusCode && statusCode >= 400 && statusCode < 600) ? statusCode : 500;
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred while contacting Gemini API.";
    
    console.error("[SoilSathi] Returning", httpStatus, "response with message:", errorMessage);
    
    res.status(httpStatus).json({
      error: "Failed to answer the farmer's question. Please try again later.",
      details: errorMessage,
      ...(apiError && { apiError }),
    });
  }
});

if (env.nodeEnv === "production") {
  if (fs.existsSync(clientBuildDir)) {
    app.use(express.static(clientBuildDir));
  } else {
    console.warn("[SoilSathi] Client build directory not found at", clientBuildDir);
  }

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }

    if (fs.existsSync(clientIndexHtml)) {
      res.sendFile(clientIndexHtml);
      return;
    }

    res.status(404).send("Client application not found. Please run the build step.");
  });
}

// Global error handler for unhandled errors
process.on("uncaughtException", (error) => {
  console.error("\n========== [SoilSathi] UNCAUGHT EXCEPTION ==========");
  console.error("[SoilSathi] Error:", error);
  console.error("[SoilSathi] Stack:", error.stack);
  console.error("==================================================\n");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("\n========== [SoilSathi] UNHANDLED REJECTION ==========");
  console.error("[SoilSathi] Reason:", reason);
  console.error("[SoilSathi] Promise:", promise);
  console.error("==================================================\n");
});

// Log server startup info
console.log("\n========== [SoilSathi] SERVER STARTUP ==========");
console.log("[SoilSathi] Environment:", env.nodeEnv);
console.log("[SoilSathi] Port:", port);
console.log("[SoilSathi] Model:", MODEL_NAME);
console.log("[SoilSathi] Gemini API Key configured:", !!API_KEY);
// Removed API key length and preview logging for security
console.log("[SoilSathi] Allowed origins:", env.allowedOrigins.length > 0 ? env.allowedOrigins : "All origins allowed");
console.log("[SoilSathi] Starting server on port", port, "...");
console.log("==================================================\n");

// Start server with error handling
// Render requires binding to 0.0.0.0, not just localhost
try {
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`\n[SoilSathi] ✅✅✅ BACKEND SERVER STARTED SUCCESSFULLY ✅✅✅`);
    console.log(`[SoilSathi] Server running on port ${port}`);
    console.log(`[SoilSathi] Environment: ${env.nodeEnv}`);
    console.log(`[SoilSathi] Server listening on 0.0.0.0:${port}`);
    console.log(`[SoilSathi] Health check: http://0.0.0.0:${port}/api/health`);
    console.log(`[SoilSathi] Ready to accept requests!\n`);
    
    // Verify server is actually listening
    if (server.listening) {
      console.log(`[SoilSathi] ✅ Server is listening and ready!\n`);
    } else {
      console.error(`[SoilSathi] ⚠️ Warning: Server may not be listening properly\n`);
    }
  }).on("error", (error: NodeJS.ErrnoException) => {
    console.error("\n========== [SoilSathi] SERVER STARTUP ERROR ==========");
    console.error("[SoilSathi] Failed to start server on port", port);
    console.error("[SoilSathi] Error code:", error.code);
    console.error("[SoilSathi] Error message:", error.message);
    
    if (error.code === "EADDRINUSE") {
      console.error("[SoilSathi] ❌ Port", port, "is already in use!");
      console.error("[SoilSathi] Solution: Stop the process using port", port, "or change PORT in .env");
    } else {
      console.error("[SoilSathi] Unexpected error:", error);
    }
    console.error("==================================================\n");
    process.exit(1);
  });
} catch (error) {
  console.error("\n========== [SoilSathi] FATAL STARTUP ERROR ==========");
  console.error("[SoilSathi] Failed to initialize server:", error);
  console.error("==================================================\n");
  process.exit(1);
}

