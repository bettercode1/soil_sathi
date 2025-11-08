import express from "express";
import type { Response } from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { GoogleGenAI, Part, Schema, Type } from "@google/genai";
import { env } from "./config";

const app = express();
const port = env.port;

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

const recommendationsRequestSchema = z.object({
  language: languageSchema.optional(),
  soilType: structuredOptionSchema,
  region: structuredOptionSchema,
  crop: structuredOptionSchema,
  growthStage: structuredOptionSchema,
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

type StructuredOption = {
  id: string;
  label: string;
};

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

const buildRecommendationsPrompt = (
  language: string,
  soilType: StructuredOption,
  region: StructuredOption,
  crop: StructuredOption,
  growthStage: StructuredOption
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
        bullet("Soil type", soilType),
        bullet("Region", region),
        bullet("Crop", crop),
        bullet("Growth stage", growthStage),
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
        "- Never refer to this as AI output; speak as an expert advisor.",
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

  const { language = "en", soilType, region, crop, growthStage } = parsed.data;

  try {
    const parts = buildRecommendationsPrompt(
      language,
      soilType,
      region,
      crop,
      growthStage
    );

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

app.listen(port, () => {
  console.log(`[SoilSathi] Analysis server running on http://localhost:${port}`);
});

