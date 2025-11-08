import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI, Part, Schema, Type } from "@google/genai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn(
    "[SoilSathi] GEMINI_API_KEY not found. Add it to your environment before starting the analysis server."
  );
}

const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

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

type AnalyzeRequestBody = {
  language?: string;
  manualValues?: Record<string, string | number>;
  reportImage?: { data: string; mimeType?: string };
  reportText?: string;
};

type StructuredOption = {
  id: string;
  label: string;
};

type RecommendationsRequestBody = {
  language?: string;
  soilType?: StructuredOption;
  region?: StructuredOption;
  crop?: StructuredOption;
  growthStage?: StructuredOption;
};

const buildPrompt = ({
  language,
  manualValues,
  reportText,
}: {
  language: string;
  manualValues?: Record<string, string | number>;
  reportText?: string;
}): Part[] => {
  const formattedManual = manualValues
    ? Object.entries(manualValues)
        .map(([key, value]) => `${key}: ${value || "not provided"}`)
        .join("\n")
    : "No manual values provided.";

  const reportSection = reportText
    ? `Lab report transcription:\n${reportText}`
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

const buildRecommendationsPrompt = ({
  language,
  soilType,
  region,
  crop,
  growthStage,
}: {
  language: string;
  soilType: StructuredOption;
  region: StructuredOption;
  crop: StructuredOption;
  growthStage: StructuredOption;
}): Part[] => {
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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", model: MODEL_NAME, hasKey: Boolean(API_KEY) });
});

app.post("/api/analyze-soil", async (req, res) => {
  if (!genAI) {
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const body = req.body as AnalyzeRequestBody;
  const language = (body.language || "en").toLowerCase();
  const manualValues = body.manualValues || {};
  const reportText = body.reportText;
  const reportImage = body.reportImage;

  try {
    const parts = buildPrompt({ language, manualValues, reportText });

    if (reportImage?.data) {
      const base64Data = reportImage.data.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
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

    const generationConfig = {
      temperature: 0.5,
      topP: 0.8,
      topK: 40,
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    } satisfies Record<string, unknown>;

    const result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user" as const, parts }],
      config: generationConfig,
    });

    const rawText = result.text as unknown;
    const textValue =
      typeof rawText === "function" ? (rawText as () => string)() : (rawText as string | undefined);
    if (!textValue) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(textValue);

    res.json(parsed);
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

  const body = req.body as RecommendationsRequestBody;
  const language = (body.language || "en").toLowerCase();
  const { soilType, region, crop, growthStage } = body;

  if (!soilType || !region || !crop || !growthStage) {
    res.status(400).json({
      error: "Missing selections. Soil type, region, crop, and growth stage are required.",
    });
    return;
  }

  try {
    const parts = buildRecommendationsPrompt({
      language,
      soilType,
      region,
      crop,
      growthStage,
    });

    const generationConfig = {
      temperature: 0.5,
      topP: 0.8,
      topK: 40,
      responseMimeType: "application/json",
      responseSchema: recommendationsSchema,
    } satisfies Record<string, unknown>;

    const result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user" as const, parts }],
      config: generationConfig,
    });

    const rawText = result.text as unknown;
    const textValue =
      typeof rawText === "function" ? (rawText as () => string)() : (rawText as string | undefined);
    if (!textValue) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(textValue);

    res.json(parsed);
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

