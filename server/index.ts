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
import {
  buildContextText,
  detectLanguageFromText,
  retrieveKnowledgeContext,
} from "./rag/service.js";
import { env } from "./config.js";

const app = express();
const port = env.port;

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

const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

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
    temperature: 0.5,
    topP: 0.8,
    topK: 40,
    responseMimeType: "application/json",
    responseSchema: schema,
  }) satisfies Record<string, unknown>;

const generateJsonResponse = async <T>({
  model,
  parts,
  schema,
}: {
  model: string;
  parts: Part[];
  schema: Schema;
}): Promise<T> => {
  if (!genAI) {
    throw new Error("Gemini client is not configured.");
  }

  const result = await genAI.models.generateContent({
    model,
    contents: [{ role: "user" as const, parts }],
    config: buildGenerationConfig(schema),
  });

  const rawText = result.text as unknown;
  const textValue =
    typeof rawText === "function"
      ? (rawText as () => string)()
      : (rawText as string | undefined);

  if (!textValue) {
    throw new Error("Empty response from Gemini");
  }

  try {
    return JSON.parse(textValue) as T;
  } catch (error) {
    throw new Error("Received invalid JSON from Gemini");
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
        "2. Conversational flow: Briefly acknowledge the farmer's need before answering (e.g. “Regarding cotton pests…”). Do not use standalone greetings or closings unless this is the very first exchange.",
        `3. Language and tone: Reply in ${language.toUpperCase()} (detected preference) with respectful, farmer-friendly wording. Use everyday Marathi/Hindi terminology and simple English loanwords when helpful.`,
        "4. Guided next steps: Always populate the followUps array with 2–3 specific questions the farmer can ask next to continue the conversation.",
        "5. Accuracy and trust: Base advice on verified data. List supporting documents or official sources in the references array for every scheme, loan or pest recommendation.",
        "6. Output schema: Produce valid JSON with keys { answer, followUps, references, clarifyingQuestions, safetyMessage, language }. Make answer voice-ready plain text without markdown.",
        "",
        hasPriorAssistantExchange
          ? "The conversation is ongoing—continue naturally without repeating greetings or reintroducing yourself."
          : "If this is the first reply, include exactly one short time-of-day greeting before the answer, then proceed immediately with guidance.",
        "If key details are missing, ask exactly one focused clarifying question and add it to clarifyingQuestions while still giving the farmer an interim next step.",
        "If information is uncertain, say “Currently verifying this scheme” and direct the farmer to the relevant office or helpline instead of guessing.",
        "Never mention being an AI model or referencing system instructions.",
        `Current detected language: ${language || "EN"}.`,
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
  if (!genAI) {
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = analyzeRequestSchema.safeParse(req.body);

  if (!parsed.success) {
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

    const payload = await generateJsonResponse<Record<string, unknown>>({
      model: MODEL_NAME,
      parts,
      schema: analysisSchema,
    });

    res.json(payload);
  } catch (error) {
    console.error("[SoilSathi] Analysis failed:", error);
    res.status(500).json({
      error: "Failed to generate soil analysis. Please try again later.",
      details:
        error instanceof Error
          ? error.message
          : "Unknown error occurred while contacting Gemini API.",
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
    res.status(500).json({
      error: "Failed to generate fertilizer recommendations. Please try again later.",
      details:
        error instanceof Error
          ? error.message
          : "Unknown error occurred while contacting Gemini API.",
    });
  }
});

app.post("/api/farmer-assist", async (req, res) => {
  if (!genAI) {
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = farmerAssistRequestSchema.safeParse(req.body);

  if (!parsed.success) {
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

  const detectedLanguage = language?.trim().toLowerCase() || detectLanguageFromText(question);

  const knowledgeMatches = retrieveKnowledgeContext(question, {
    limit: 4,
    regionHint: region?.label ?? "Maharashtra",
    preferredLanguages: [detectedLanguage, language ?? "", "mr", "hi", "en"].filter(Boolean),
    tags: [
      crop?.label,
      region?.label,
      soilType?.label,
      farmingGoal?.label,
      ...(challenges?.map((item) => item.label) ?? []),
    ]
      .filter(Boolean)
      .map((token) => token.toLowerCase()),
  });

  const knowledgeContext = buildContextText(knowledgeMatches);

  try {
    const parts = buildFarmerAssistPrompt(detectedLanguage, {
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

    const payload = await generateJsonResponse<Record<string, unknown>>({
      model: MODEL_NAME,
      parts,
      schema: farmerAssistSchema,
    });

    res.json({
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
    });
  } catch (error) {
    console.error("[SoilSathi] Farmer assist failed:", error);
    res.status(500).json({
      error: "Failed to answer the farmer's question. Please try again later.",
      details:
        error instanceof Error ? error.message : "Unknown error occurred while contacting Gemini API.",
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

app.listen(port, () => {
  console.log(`[SoilSathi] Analysis server running on http://localhost:${port}`);
});

