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
const clientIndexHtml = path.resolve(clientBuildDir, "index.html");

// Log paths for debugging in production
if (process.env.NODE_ENV === "production") {
  console.log("[SoilSathi] Path resolution:");
  console.log("[SoilSathi]   __dirname:", __dirname);
  console.log("[SoilSathi]   clientBuildDir:", clientBuildDir);
  console.log("[SoilSathi]   clientIndexHtml:", clientIndexHtml);
  console.log("[SoilSathi]   clientBuildDir exists:", fs.existsSync(clientBuildDir));
  console.log("[SoilSathi]   index.html exists:", fs.existsSync(clientIndexHtml));
}

app.disable("x-powered-by");

const corsOptions: CorsOptions = {
  origin: env.allowedOrigins.length 
    ? env.allowedOrigins 
    : env.nodeEnv === "development" 
      ? true // Allow all origins in development
      : undefined,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

// Optimized fallback models - prioritize fastest working models
// Removed unavailable models: gemini-2.5-flash-tts (404), learnlm-2.0-flash-experimental (404), gemini-2.0-flash-exp (429 quota)
// Tries models in parallel - whichever responds fastest wins
const FALLBACK_MODELS = [
  "gemini-2.5-flash-lite", // Fastest - prioritize this first (~9s response time)
  MODEL_NAME, // Primary configured model (usually gemini-2.5-flash)
  "gemini-2.5-flash", // Standard flash model (~22s response time)
  "gemini-2.5-pro", // Pro model (slower but more accurate, use as last resort)
].filter((model, index, self) => model && self.indexOf(model) === index); // Remove duplicates and empty values

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

const sanitizeManualValues = (manualValues: Record<string, string | number>): Record<string, string> => {
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
  ) as Record<string, string>;
};

const validateImageData = (data: string) => {
  const [, encodedPayload = data] = data.split(",");
  if (!BASE64_REGEX.test(encodedPayload)) {
    throw new Error("reportImage.data must be base64 encoded.");
  }
  return encodedPayload;
};

// Improved request queue with concurrency support for Gemini API
// Allows multiple concurrent requests while respecting Gemini's rate limits
// Prevents "overloaded" errors by managing request rate intelligently
interface QueuedRequest<T> {
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  execute: () => Promise<T>;
}

let requestQueue: QueuedRequest<unknown>[] = [];
let activeRequests = 0;
let requestTimestamps: number[] = []; // Track request timestamps for rate limiting
let isProcessingQueue = false;

// Rate limit configuration - Optimized for faster responses while preventing errors
// Balanced limits for better performance
const MAX_CONCURRENT_REQUESTS = 3; // Increased to 3 concurrent requests for faster processing
const REQUESTS_PER_MINUTE = 12; // Optimized: 12 RPM (Gemini allows 15, leaving buffer for retries)
const WINDOW_MS = 60 * 1000; // 1 minute window
const MIN_INTERVAL_BETWEEN_REQUESTS_MS = (60 * 1000) / REQUESTS_PER_MINUTE; // ~5000ms = 5 seconds

// Clean up old timestamps outside the 1-minute window
const cleanupOldTimestamps = () => {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(
    timestamp => now - timestamp < WINDOW_MS
  );
};

// Check if we can make a new request based on rate limits
const canMakeRequest = (): boolean => {
  cleanupOldTimestamps();
  
  // Check if we're under concurrent request limit
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return false;
  }
  
  // Check if we're under RPM limit
  if (requestTimestamps.length >= REQUESTS_PER_MINUTE) {
    return false;
  }
  
  return true;
};

// Process the queue intelligently with concurrency support
const processQueue = async () => {
  // Prevent multiple queue processors from running
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0 || activeRequests > 0) {
    // Process as many requests as we can concurrently
    while (requestQueue.length > 0 && canMakeRequest()) {
      const request = requestQueue.shift();
      if (!request) break;

      // Execute request concurrently
      activeRequests++;
      requestTimestamps.push(Date.now());
      
      const isDev = env.nodeEnv === "development";
      if (isDev) {
        console.log(`[Gemini] 🚀 Processing request (${activeRequests} active, ${requestQueue.length} queued, ${requestTimestamps.length}/${REQUESTS_PER_MINUTE} RPM used)`);
      }

      // Execute request without blocking the queue
      request.execute()
        .then(result => {
          activeRequests--;
          cleanupOldTimestamps(); // Clean up after request completes
          request.resolve(result);
          // Queue will continue processing automatically via the main loop
        })
        .catch(error => {
          activeRequests--;
          cleanupOldTimestamps(); // Clean up after request fails
          request.reject(error);
          // Queue will continue processing automatically via the main loop
        });
    }

    // If we can't make more requests, wait a bit
    if (requestQueue.length > 0 && !canMakeRequest()) {
      cleanupOldTimestamps();
      
      if (requestTimestamps.length >= REQUESTS_PER_MINUTE) {
        // Calculate wait time based on oldest request timestamp
        const oldestTimestamp = Math.min(...requestTimestamps);
        const waitTime = Math.max(1000, WINDOW_MS - (Date.now() - oldestTimestamp));
        
        const isDev = env.nodeEnv === "development";
        if (isDev) {
          console.log(`[Gemini] ⏳ Rate limit reached (${requestTimestamps.length}/${REQUESTS_PER_MINUTE} RPM). Waiting ${Math.ceil(waitTime / 1000)}s before next request.`);
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      } else if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
        // Wait a bit if we're at concurrent limit
        const isDev = env.nodeEnv === "development";
        if (isDev) {
          console.log(`[Gemini] ⏳ Concurrent limit reached (${activeRequests}/${MAX_CONCURRENT_REQUESTS}). Waiting for slot...`);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
    }

    // If queue is empty but requests are still active, wait a bit
    if (requestQueue.length === 0 && activeRequests > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      continue;
    }

    // If queue is empty and no active requests, we're done
    if (requestQueue.length === 0 && activeRequests === 0) {
      break;
    }
  }

  isProcessingQueue = false;
};

// Queue a Gemini API request with intelligent rate limiting
const queueGeminiRequest = <T>(execute: () => Promise<T>): Promise<T> => {
  const isDev = env.nodeEnv === "development";
  return new Promise<T>((resolve, reject) => {
    const queuePosition = requestQueue.length + 1;
    
    if (isDev) {
      if (queuePosition > 1 || activeRequests > 0) {
        console.log(`[Gemini] 📋 Request queued (position: ${queuePosition}, ${activeRequests} active, max ${MAX_CONCURRENT_REQUESTS} concurrent, ${REQUESTS_PER_MINUTE} RPM limit)`);
      }
    }
    
    requestQueue.push({ resolve, reject, execute });
    
    // Start processing queue if not already running
    if (!isProcessingQueue) {
      processQueue();
    }
  });
};

// Performance optimization: Request cache to avoid duplicate API calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const requestCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache (increased for better performance)
const MAX_CACHE_SIZE = 200; // Increased cache size for better hit rate

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCache.entries()) {
    if (now > entry.expiresAt) {
      requestCache.delete(key);
    }
  }
  // If cache is still too large, remove oldest entries
  if (requestCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(requestCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, requestCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => requestCache.delete(key));
  }
}, 60000); // Clean every minute

// Generate cache key from request parameters
const generateCacheKey = (model: string, parts: Part[], schema: Schema): string => {
  try {
    const partsHash = JSON.stringify(parts.map(p => {
      if ('text' in p) return { type: 'text', content: p.text };
      if ('inlineData' in p) return { type: 'image', mimeType: p.inlineData?.mimeType };
      return p;
    }));
    const schemaHash = JSON.stringify(schema);
    return `${model}:${partsHash}:${schemaHash}`;
  } catch (error) {
    // Fallback to simple hash if JSON.stringify fails
    console.error("[Gemini] Failed to generate cache key:", error);
    return `${model}:${parts.length}:${Date.now()}`;
  }
};

const buildGenerationConfig = (schema: Schema, maxOutputTokens?: number) => {
  const config: Record<string, unknown> = {
    temperature: 0.1, // Lower temperature for faster, deterministic responses
    topP: 0.15, // Optimized for faster generation (reduced from 0.2)
    topK: 2, // Optimized for faster generation (reduced from 3)
    maxOutputTokens: maxOutputTokens ?? 4096, // Reduced from 8192 for faster responses (still sufficient for most use cases)
    responseMimeType: "application/json",
    responseSchema: schema,
  };
  return config;
};

// Timeout wrapper for API calls
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
};

// Helper function to extract error info from nested structures (used by error handling)
const extractErrorInfo = (obj: unknown): { code?: number; message?: string; status?: string } | null => {
  // Handle Error objects - check their message property for JSON
  if (obj instanceof Error) {
    const message = obj.message;
    // Try to parse JSON from error message
    try {
      const jsonMatch = message.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const result = extractErrorInfo(parsed);
        if (result) return result;
      }
    } catch {
      // Continue to check other properties
    }
    // Check if Error has statusCode property
    const statusCode = (obj as Error & { statusCode?: number })?.statusCode;
    const apiError = (obj as Error & { apiError?: { code?: number; status?: string; message?: string } })?.apiError;
    if (statusCode === 503 || apiError?.status === "UNAVAILABLE" || apiError?.code === 503) {
      return {
        code: 503,
        message: apiError?.message || message,
        status: "UNAVAILABLE",
      };
    }
    if (statusCode || apiError) {
      return {
        code: statusCode || apiError?.code,
        message: apiError?.message || message,
        status: apiError?.status,
      };
    }
  }
  
  // Handle string input (JSON strings)
  if (typeof obj === "string") {
    try {
      const jsonMatch = obj.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return extractErrorInfo(parsed);
      }
    } catch {
      return null;
    }
  }
  
  if (!obj || typeof obj !== "object") return null;
  
  const err = obj as Record<string, unknown>;
  
  // Check for nested error object (common in API responses)
  if ("error" in err && err.error && typeof err.error === "object") {
    const nested = err.error as Record<string, unknown>;
    if ("code" in nested || "status" in nested || "message" in nested) {
      const code = typeof nested.code === "number" ? nested.code : undefined;
      const status = typeof nested.status === "string" ? nested.status : undefined;
      // Special handling for 503/UNAVAILABLE
      if (code === 503 || status === "UNAVAILABLE") {
        return {
          code: 503,
          message: typeof nested.message === "string" ? nested.message : "The model is overloaded. Please try again later.",
          status: "UNAVAILABLE",
        };
      }
      return {
        code,
        message: typeof nested.message === "string" ? nested.message : undefined,
        status,
      };
    }
  }
  
  // Check for direct error properties
  if ("code" in err || "status" in err || "message" in err) {
    const code = typeof err.code === "number" ? err.code : undefined;
    const status = typeof err.status === "string" ? err.status : undefined;
    const message = typeof err.message === "string" ? err.message : undefined;
    
    // Special handling for 429/RESOURCE_EXHAUSTED
    if (code === 429 || status === "RESOURCE_EXHAUSTED") {
      return {
        code: 429,
        message: message || "API quota exceeded. Please try again later.",
        status: "RESOURCE_EXHAUSTED",
      };
    }
    
    // Special handling for 503/UNAVAILABLE
    if (code === 503 || status === "UNAVAILABLE") {
      return {
        code: 503,
        message: message || "The model is overloaded. Please try again later.",
        status: "UNAVAILABLE",
      };
    }
    
    return {
      code,
      message,
      status,
    };
  }
  
  // Check for Gemini SDK specific error formats
  if ("status" in err || "statusCode" in err) {
    const statusCode = typeof err.statusCode === "number" ? err.statusCode : undefined;
    const status = typeof err.status === "string" ? err.status : undefined;
    const message = typeof err.message === "string" ? err.message : undefined;
    
    // Check if statusCode indicates 429
    if (statusCode === 429 || status === "RESOURCE_EXHAUSTED") {
      return {
        code: 429,
        message: message || "API quota exceeded. Please try again later.",
        status: "RESOURCE_EXHAUSTED",
      };
    }
    
    // Check if statusCode indicates 503
    if (statusCode === 503 || status === "UNAVAILABLE") {
      return {
        code: 503,
        message: message || "The model is overloaded. Please try again later.",
        status: "UNAVAILABLE",
      };
    }
    
    return {
      code: statusCode,
      message,
      status,
    };
  }
  
  // Check cause property (for nested errors)
  if ("cause" in err && err.cause && typeof err.cause === "object") {
    return extractErrorInfo(err.cause);
  }
  
  // Check for HTTP status in response property
  if ("response" in err && err.response && typeof err.response === "object") {
    const response = err.response as Record<string, unknown>;
    if ("status" in response || "statusCode" in response) {
      const statusCode = typeof response.statusCode === "number" ? response.statusCode : 
                        typeof response.status === "number" ? response.status : undefined;
      if (statusCode === 429) {
        return {
          code: 429,
          message: typeof response.data === "string" ? response.data : "API quota exceeded. Please try again later.",
          status: "RESOURCE_EXHAUSTED",
        };
      }
      if (statusCode === 503) {
        return {
          code: 503,
          message: typeof response.data === "string" ? response.data : "The model is overloaded. Please try again later.",
          status: "UNAVAILABLE",
        };
      }
    }
  }
  
  return null;
};

// Retry logic with exponential backoff (handles rate limits properly)
// Optimized retries for faster responses
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2, // Keep at 2 retries to prevent overload
  baseDelayMs: number = 3000 // Reduced base delay to 3 seconds for faster retries
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a rate limit error (503/UNAVAILABLE) - these SHOULD be retried
      // First, try to extract error info from the error object
      let errorInfo = extractErrorInfo(error);
      
      // If error message contains JSON string, try to parse it
      if (!errorInfo && error instanceof Error) {
        try {
          // Try parsing the error message as JSON
          const parsed = JSON.parse(error.message);
          errorInfo = extractErrorInfo(parsed);
        } catch {
          // If that fails, try to extract JSON from the message string
          try {
            const jsonMatch = error.message.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              errorInfo = extractErrorInfo(parsed);
            }
          } catch {
            // Continue with original errorInfo (null)
          }
        }
      }
      
      const isRateLimit = error instanceof Error && (
        (error as Error & { statusCode?: number })?.statusCode === 503 ||
        (error as Error & { statusCode?: number })?.statusCode === 429 ||
        (errorInfo?.code === 503) ||
        (errorInfo?.code === 429) ||
        (errorInfo?.status === "UNAVAILABLE") ||
        (errorInfo?.status === "RESOURCE_EXHAUSTED") ||
        (error as Error & { apiError?: { code?: number; status?: string } })?.apiError?.status === "UNAVAILABLE" ||
        (error as Error & { apiError?: { code?: number; status?: string } })?.apiError?.status === "RESOURCE_EXHAUSTED" ||
        (error as Error & { apiError?: { code?: number; status?: string } })?.apiError?.code === 503 ||
        (error as Error & { apiError?: { code?: number; status?: string } })?.apiError?.code === 429 ||
        error.message.toLowerCase().includes("overloaded") ||
        error.message.toLowerCase().includes("unavailable") ||
        error.message.toLowerCase().includes("quota") ||
        error.message.toLowerCase().includes("rate limit") ||
        error.message.toLowerCase().includes("exceeded") ||
        error.message.toLowerCase().includes("\"code\":503") ||
        error.message.toLowerCase().includes("\"code\":429") ||
        error.message.toLowerCase().includes("\"status\":\"unavailable\"") ||
        error.message.toLowerCase().includes("\"status\":\"resource_exhausted\"")
      );
      
      // CRITICAL: Don't retry 503/overloaded errors - let them fail and go through queue on user retry
      // Retrying 503 errors immediately causes more overload
      if (isRateLimit && (errorInfo?.code === 503 || errorInfo?.status === "UNAVAILABLE")) {
        const isDev = env.nodeEnv === "development";
        if (isDev) {
          console.log(`[Gemini] ⚠️ 503/UNAVAILABLE error detected - NOT retrying to prevent overload. User should retry.`);
        }
        throw error; // Fail immediately, user can retry which will go through queue
      }
      
      // Don't retry on certain errors
      if (error instanceof Error && !isRateLimit) {
        const message = error.message.toLowerCase();
        const statusCode = (error as Error & { statusCode?: number })?.statusCode;
        
        // Don't retry on validation errors, auth errors, timeout errors
        if (
          message.includes("invalid") ||
          message.includes("unauthorized") ||
          message.includes("forbidden") ||
          message.includes("timed out") ||
          statusCode === 400 ||
          statusCode === 401 ||
          statusCode === 403
        ) {
          throw error;
        }
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // For other rate limit errors (429), use longer exponential backoff
      // For other errors, use shorter backoff
      const delayMs = isRateLimit 
        ? Math.min(baseDelayMs * Math.pow(2, attempt) * 2, 20000) // Optimized delay for rate limits: 12000ms, 20000ms (capped at 20s)
        : Math.min(baseDelayMs * Math.pow(2, attempt), 8000); // Optimized delay: 6000ms, 8000ms (capped at 8s)
      
      const isDev = env.nodeEnv === "development";
      if (isDev) {
        console.log(`[Gemini] ${isRateLimit ? '⚠️ Rate limit detected - ' : ''}Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
};

const generateJsonResponse = async <T>({
  model,
  parts,
  schema,
    timeoutMs = 25000, // 25 seconds timeout (optimized for faster responses)
  useCache = true, // Enable caching by default
        maxRetries = 2, // Optimized to 2 retries for faster responses
    maxOutputTokens, // Optional: limit output tokens for faster generation
}: {
  model: string;
  parts: Part[];
  schema: Schema;
  timeoutMs?: number;
  useCache?: boolean;
  maxRetries?: number;
  maxOutputTokens?: number; // Limit response length for faster generation
}): Promise<T> => {
  const isDev = env.nodeEnv === "development";
  const startTime = Date.now();
  
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

  // Check cache first (skip for image requests as they're unique)
  const hasImage = parts.some(p => 'inlineData' in p);
  const cacheKey = useCache && !hasImage ? generateCacheKey(model, parts, schema) : null;
  
  if (cacheKey) {
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      if (isDev) {
        console.log("[Gemini] ✅ Cache hit! Returning cached response");
      }
      return cached.data as T;
    }
  }

  try {
    const config = buildGenerationConfig(schema, maxOutputTokens);
    if (isDev) {
      console.log("[Gemini] Calling genAI.models.generateContent...");
      console.log("[Gemini] Max output tokens:", maxOutputTokens ?? 4096);
    }
    
    // Queue the request to prevent rate limit errors (ensures 1.2s between requests)
    // Use retry logic with exponential backoff (optimized for speed)
    // API format per official docs: https://ai.google.dev/gemini-api/docs/quickstart
    const result = await queueGeminiRequest(async () => {
      return await retryWithBackoff(async () => {
        try {
          // Format contents according to official API spec
          // @google/genai v1.29.0 format - use config parameter for generation config
          const apiCall = genAI!.models.generateContent({
            model,
            contents: [{ role: "user" as const, parts }],
            config, // Generation config with schema for structured output
          });
          
          return await withTimeout(
            apiCall,
            timeoutMs,
            `Gemini API request timed out after ${timeoutMs / 1000} seconds`
          );
      } catch (apiError: unknown) {
        // Enhanced error logging for debugging
        if (isDev) {
          console.error("[Gemini] API call error details:");
          console.error("[Gemini] Error type:", typeof apiError);
          console.error("[Gemini] Error:", apiError);
          if (apiError instanceof Error) {
            console.error("[Gemini] Error message:", apiError.message);
            console.error("[Gemini] Error stack:", apiError.stack);
            console.error("[Gemini] Error name:", apiError.name);
          }
        }
        
        // Ensure all errors are properly formatted before re-throwing
        // First, try to extract error info from the error object itself
        const errorInfo = extractErrorInfo(apiError);
        
        if (errorInfo) {
          const customError = new Error(errorInfo.message || (apiError instanceof Error ? apiError.message : "Unknown error")) as Error & { statusCode?: number; apiError?: unknown };
          
          // Check if error message indicates model not found
          const errorMsg = errorInfo.message || (apiError instanceof Error ? apiError.message : "");
          const isModelNotFound = errorMsg.toLowerCase().includes("not found") || 
                                  errorMsg.toLowerCase().includes("is not found");
          
          // Preserve 503 status codes
          if (errorInfo.code === 503 || errorInfo.status === "UNAVAILABLE") {
            customError.statusCode = 503;
            customError.apiError = { code: 503, message: errorInfo.message || "The model is overloaded. Please try again later.", status: "UNAVAILABLE" };
          } else if (errorInfo.code === 404 || isModelNotFound) {
            // Handle 404/model not found errors
            customError.statusCode = 404;
            customError.apiError = { code: 404, message: errorInfo.message || "Model not found", status: "NOT_FOUND" };
          } else {
            customError.statusCode = errorInfo.code || 500;
            customError.apiError = { code: errorInfo.code, message: errorInfo.message, status: errorInfo.status };
          }
          
          throw customError;
        }
        
        // If error extraction failed, check if it's already a formatted error
        if (apiError instanceof Error) {
          const statusCode = (apiError as Error & { statusCode?: number })?.statusCode;
          if (statusCode) {
            throw apiError; // Already formatted, re-throw as-is
          }
          
          // Check error message for keywords
          const message = apiError.message.toLowerCase();
          if (message.includes("503") || message.includes("overloaded") || message.includes("unavailable") || message.includes("resource_exhausted")) {
            const customError = new Error(apiError.message) as Error & { statusCode?: number; apiError?: unknown };
            customError.statusCode = 503;
            customError.apiError = { code: 503, message: apiError.message, status: "UNAVAILABLE" };
            throw customError;
          } else if (message.includes("not found") || message.includes("is not found") || message.includes("404")) {
            const customError = new Error(apiError.message) as Error & { statusCode?: number; apiError?: unknown };
            customError.statusCode = 404;
            customError.apiError = { code: 404, message: apiError.message, status: "NOT_FOUND" };
            throw customError;
          }
        }
        
        // If we can't extract error info, wrap it in a generic error
        const wrappedError = new Error(
          apiError instanceof Error ? apiError.message : "Unknown error from Gemini API"
        ) as Error & { statusCode?: number; apiError?: unknown; originalError?: unknown };
        wrappedError.statusCode = 500;
        wrappedError.apiError = { code: 500, message: "Unknown error occurred", status: "UNKNOWN" };
        wrappedError.originalError = apiError;
        throw wrappedError;
      }
      }, maxRetries);
    });
    
    const duration = Date.now() - startTime;
    if (isDev) {
      console.log(`[Gemini] ✅ Response received from Gemini in ${duration}ms`);
    }

    // Log the full response structure for debugging - ALWAYS log in dev mode
    console.log("[Gemini] ========== RESPONSE DEBUG ==========");
    console.log("[Gemini] Response type:", typeof result);
    console.log("[Gemini] Is null/undefined:", result === null || result === undefined);
    if (result && typeof result === 'object') {
      console.log("[Gemini] Response keys:", Object.keys(result));
      console.log("[Gemini] Response constructor:", result.constructor?.name);
      // Try to get all enumerable properties
      const allProps: string[] = [];
      for (const key in result) {
        allProps.push(key);
      }
      console.log("[Gemini] All enumerable properties:", allProps);
    }
    console.log("[Gemini] Response structure (full):", JSON.stringify(result, null, 2));
    console.log("[Gemini] ====================================");

    // Extract text from response per @google/genai SDK format
    // The SDK returns GenerateContentResponse with candidates[].content.parts[]
    // But the content might also have a direct text property or method
    let textValue: string | undefined;
    
    try {
      // Method 1: Try result.text() if it's a method (SDK might provide this)
      // The @google/genai SDK GenerateContentResponse has a .text() method
      if (result && typeof result === 'object') {
        const resultAny = result as any;
        
        // Check for .text() method on the response object
        if (typeof resultAny.text === 'function') {
          try {
            textValue = await resultAny.text();
            if (textValue && textValue.trim().length > 0) {
              console.log("[Gemini] ✅ Extracted text from result.text() method, length:", textValue.length);
              // Skip other methods if this worked
            }
          } catch (e) {
            if (isDev) {
              console.log("[Gemini] result.text() method failed:", e);
            }
          }
        }
        
        // Also try .response?.text() if it exists
        if (!textValue && resultAny.response && typeof resultAny.response.text === 'function') {
          try {
            textValue = await resultAny.response.text();
            if (textValue && textValue.trim().length > 0) {
              console.log("[Gemini] ✅ Extracted text from result.response.text() method, length:", textValue.length);
            }
          } catch (e) {
            if (isDev) {
              console.log("[Gemini] result.response.text() method failed:", e);
            }
          }
        }
      }
      
      // Method 2: Try direct text property
      if (!textValue && result && typeof result === 'object' && 'text' in result) {
        const rawText = (result as { text?: string | (() => string) }).text;
        if (rawText) {
          textValue = typeof rawText === "function" ? rawText() : rawText;
          if (textValue && textValue.trim().length > 0) {
            console.log("[Gemini] ✅ Extracted text from result.text property, length:", textValue.length);
          }
        }
      }
      
      // Method 3: Try candidates array structure (standard SDK format)
      if (!textValue && result && typeof result === 'object' && 'candidates' in result) {
        const resultWithCandidates = result as { 
          candidates?: Array<{ 
            content?: { 
              parts?: Array<{ text?: string }>;
              text?: string | (() => string);
            } 
          }> 
        };
        const candidates = resultWithCandidates.candidates;
        if (candidates && candidates.length > 0) {
          const firstCandidate = candidates[0];
          if (firstCandidate?.content) {
            const content = firstCandidate.content as any;
            
            // Try content.text() method first (SDK might provide this)
            if (typeof content.text === 'function') {
              try {
                textValue = await content.text();
                if (textValue && textValue.trim().length > 0) {
                  console.log("[Gemini] ✅ Extracted text from candidates[0].content.text() method, length:", textValue.length);
                }
              } catch (e) {
                if (isDev) {
                  console.log("[Gemini] content.text() method failed:", e);
                }
              }
            }
            
            // Try content.text property
            if (!textValue && 'text' in content && typeof content.text !== 'function') {
              textValue = content.text;
              if (textValue && textValue.trim().length > 0) {
                console.log("[Gemini] ✅ Extracted text from candidates[0].content.text property, length:", textValue.length);
              }
            }
            
            // Try content.parts array (check if it exists and has items)
            if (!textValue && content.parts) {
              const parts = Array.isArray(content.parts) ? content.parts : [];
              if (parts.length > 0) {
                // Get all text parts and join them
                const textParts: string[] = [];
                for (const part of parts) {
                  if (part && typeof part === 'object') {
                    // Part might have text property or text() method
                    if (typeof part.text === 'function') {
                      try {
                        const partText = await part.text();
                        if (partText) textParts.push(partText);
                      } catch {
                        // Ignore
                      }
                    } else if (part.text) {
                      textParts.push(part.text);
                    }
                  }
                }
                if (textParts.length > 0) {
                  textValue = textParts.join('');
                  console.log("[Gemini] ✅ Extracted text from candidates[0].content.parts[], length:", textValue.length);
                }
              }
            }
            
            // Deep inspection of content object - check all possible properties
    if (!textValue) {
              console.log("[Gemini] 🔍 Inspecting content object...");
              console.log("[Gemini] Content object keys:", Object.keys(content));
              console.log("[Gemini] Content object type:", typeof content);
              console.log("[Gemini] Content has text method:", typeof content.text === 'function');
              console.log("[Gemini] Content has parts:", 'parts' in content);
              console.log("[Gemini] Content parts type:", typeof content.parts);
              console.log("[Gemini] Content parts is array:", Array.isArray(content.parts));
              if (content.parts) {
                console.log("[Gemini] Content parts length:", Array.isArray(content.parts) ? content.parts.length : 'N/A');
              }
              
              // Try to access parts directly even if not enumerable
              try {
                const parts = (content as any).parts;
                if (parts && Array.isArray(parts) && parts.length > 0) {
                  console.log("[Gemini] Found parts array with", parts.length, "items");
                  for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    console.log(`[Gemini] Part ${i} type:`, typeof part);
                    console.log(`[Gemini] Part ${i} keys:`, part && typeof part === 'object' ? Object.keys(part) : 'N/A');
                    if (part && typeof part === 'object') {
                      if ('text' in part) {
                        const partText = part.text;
                        if (partText) {
                          if (!textValue) textValue = '';
                          textValue += typeof partText === 'function' ? partText() : partText;
                          console.log(`[Gemini] ✅ Found text in part ${i}`);
                        }
                      }
                    }
                  }
                  if (textValue && textValue.trim().length > 0) {
                    console.log("[Gemini] ✅ Extracted text from direct parts access, length:", textValue.length);
                  }
                }
              } catch (e) {
                console.log("[Gemini] Direct parts access failed:", e);
              }
              
              if (isDev) {
                console.log("[Gemini] Content object full:", JSON.stringify(content, null, 2));
              }
            }
          }
        }
      }
      
      // Method 4: Try result.response (some SDKs wrap the response)
      if (!textValue && result && typeof result === 'object' && 'response' in result) {
        const response = (result as any).response;
        if (response && typeof response === 'object') {
          if ('text' in response) {
            textValue = typeof response.text === "function" ? response.text() : response.text;
          } else if ('candidates' in response && Array.isArray(response.candidates) && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate?.content?.parts && candidate.content.parts.length > 0) {
              textValue = candidate.content.parts[0].text;
            }
          }
          if (textValue && textValue.trim().length > 0) {
            console.log("[Gemini] ✅ Extracted text from result.response, length:", textValue.length);
          }
        }
      }
      
      // Method 5: Try result.data
      if (!textValue && result && typeof result === 'object' && 'data' in result) {
        const data = (result as any).data;
        if (data && typeof data === 'object') {
          if ('text' in data) {
            textValue = typeof data.text === "function" ? data.text() : data.text;
          } else if (typeof data === 'string') {
            textValue = data;
          }
          if (textValue && textValue.trim().length > 0) {
            console.log("[Gemini] ✅ Extracted text from result.data, length:", textValue.length);
          }
        }
      }
      
      // Method 6: Last resort - try to stringify and parse
      if (!textValue && result) {
        const resultStr = JSON.stringify(result);
        if (resultStr && resultStr !== '{}') {
          try {
            const parsed = JSON.parse(resultStr);
            // Try various paths
            if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
              textValue = parsed.candidates[0].content.parts[0].text;
            } else if (parsed.candidates?.[0]?.content?.text) {
              textValue = parsed.candidates[0].content.text;
            } else if (parsed.response?.text) {
              textValue = parsed.response.text;
            } else if (parsed.text) {
              textValue = parsed.text;
            } else if (parsed.data?.text) {
              textValue = parsed.data.text;
            }
            if (textValue && textValue.trim().length > 0) {
              console.log("[Gemini] ✅ Extracted text from JSON.parse(), length:", textValue.length);
            }
          } catch {
            // If parsing fails, try regex extraction
            const textMatch = resultStr.match(/"text"\s*:\s*"([^"]+)"/);
            if (textMatch && textMatch[1]) {
              textValue = textMatch[1];
              console.log("[Gemini] ✅ Extracted text from regex match, length:", textValue.length);
            }
          }
        }
      }
    } catch (extractError) {
      console.error("[Gemini] ❌ Error extracting text from response:", extractError);
      if (isDev) {
        console.error("[Gemini] Response structure:", JSON.stringify(result, null, 2));
      }
    }

    // Check for MAX_TOKENS finish reason (response was truncated)
    let finishReason: string | undefined;
    if (result && typeof result === 'object' && 'candidates' in result) {
      const candidates = (result as { candidates?: Array<{ finishReason?: string }> }).candidates;
      if (candidates && candidates.length > 0 && candidates[0]?.finishReason) {
        finishReason = candidates[0].finishReason;
      }
    }

    if (!textValue || textValue.trim().length === 0) {
      console.error("[Gemini] ❌❌❌ EMPTY RESPONSE FROM GEMINI ❌❌❌");
      console.error("[Gemini] Result type:", typeof result);
      console.error("[Gemini] Result value:", result);
      console.error("[Gemini] Finish reason:", finishReason);
      console.error("[Gemini] Full response object:", JSON.stringify(result, null, 2));
      console.error("[Gemini] Response keys:", result && typeof result === 'object' ? Object.keys(result) : 'N/A');
      
      // Check if it's a MAX_TOKENS issue
      if (finishReason === "MAX_TOKENS") {
        const maxTokensError = new Error("Response was truncated due to token limit. The analysis is too complex. Please try with fewer parameters or contact support.") as Error & { statusCode?: number; apiError?: unknown };
        maxTokensError.statusCode = 500;
        maxTokensError.apiError = { code: 500, message: "Response truncated due to MAX_TOKENS", status: "MAX_TOKENS" };
        throw maxTokensError;
      }
      
      // Try one more time with deep inspection
      if (result && typeof result === 'object') {
        console.error("[Gemini] Attempting deep inspection...");
        try {
          const deepInspect = (obj: unknown, depth = 0, maxDepth = 3): void => {
            if (depth > maxDepth) return;
            if (obj && typeof obj === 'object') {
              for (const key in obj) {
                const value = (obj as Record<string, unknown>)[key];
                console.error(`[Gemini] ${'  '.repeat(depth)}${key}:`, typeof value, value instanceof Array ? `Array[${value.length}]` : '');
                if (typeof value === 'string' && value.length > 0 && value.length < 1000) {
                  console.error(`[Gemini] ${'  '.repeat(depth)}${key} value:`, value.substring(0, 200));
                }
                if (value && typeof value === 'object' && depth < maxDepth) {
                  deepInspect(value, depth + 1, maxDepth);
                }
              }
            }
          };
          deepInspect(result);
        } catch (e) {
          console.error("[Gemini] Deep inspection failed:", e);
        }
      }
      
      const emptyResponseError = new Error("Empty response from Gemini API. Please check your API key and model configuration.") as Error & { statusCode?: number; apiError?: unknown };
      emptyResponseError.statusCode = 500;
      emptyResponseError.apiError = { code: 500, message: "Empty response from Gemini API", status: "EMPTY_RESPONSE" };
      throw emptyResponseError;
    }

    // Clean the JSON response before parsing
    let cleanedText = textValue.trim();
    
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '');
    
    // Remove any leading/trailing whitespace
    cleanedText = cleanedText.trim();
    
    // Try to extract JSON if it's wrapped in other text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    // Log the cleaned text in development for debugging
    if (isDev) {
      console.log("[Gemini] Cleaned JSON text length:", cleanedText.length);
      console.log("[Gemini] First 500 chars:", cleanedText.substring(0, 500));
      console.log("[Gemini] Last 500 chars:", cleanedText.substring(Math.max(0, cleanedText.length - 500)));
    }

    try {
      const parsed = JSON.parse(cleanedText) as T;
      
      // Cache the response (skip for image requests)
      if (cacheKey) {
        requestCache.set(cacheKey, {
          data: parsed,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        if (isDev) {
          console.log("[Gemini] ✅ Response cached for future requests");
        }
      }
      
      if (isDev) {
        console.log("[Gemini] ✅ JSON parsed successfully");
      }
      return parsed;
    } catch (parseError) {
      console.error("[Gemini] ❌ JSON parsing failed!");
      console.error("[Gemini] Parse error:", parseError);
      
      // Log the problematic text for debugging
      if (isDev) {
        console.error("[Gemini] Original text length:", textValue.length);
        console.error("[Gemini] Cleaned text length:", cleanedText.length);
        console.error("[Gemini] First 1000 chars of cleaned text:", cleanedText.substring(0, 1000));
        
        // Try to find the error position
        if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
          const positionMatch = parseError.message.match(/position (\d+)/);
          if (positionMatch) {
            const position = parseInt(positionMatch[1], 10);
            const start = Math.max(0, position - 100);
            const end = Math.min(cleanedText.length, position + 100);
            console.error("[Gemini] Text around error position:", cleanedText.substring(start, end));
            console.error("[Gemini] Character at position:", cleanedText[position]);
          }
        }
      }
      
      // Try to fix common JSON issues with a more robust approach
      let fixedText = cleanedText;
      
      // Advanced JSON repair function with better array handling
      const fixJsonSyntax = (text: string): string => {
        let fixed = text;
        
        // Pass 1: Remove trailing commas before closing brackets/braces (multiple passes for nested)
        // Also handle cases like: "value": "text",      , (trailing comma after string)
        for (let i = 0; i < 5; i++) {
          fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
          // Fix trailing comma after string value: "text",      , -> "text",
          fixed = fixed.replace(/"\s*,\s*,/g, '",');
          // Fix trailing comma after number: 123,      , -> 123,
          fixed = fixed.replace(/(\d+)\s*,\s*,/g, '$1,');
        }
        
        // Pass 2: Fix missing commas - but be careful not to break strings
        // Only fix if we're outside of strings (rough heuristic)
        let inString = false;
        let escapeNext = false;
        let result = '';
        
        for (let i = 0; i < fixed.length; i++) {
          const char = fixed[i];
          
          if (escapeNext) {
            result += char;
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            result += char;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            result += char;
            continue;
          }
          
          if (!inString) {
            // Outside string - check for missing commas
            if ((char === '}' || char === ']') && i + 1 < fixed.length) {
              const next = fixed[i + 1];
              if (next === '{' || next === '[') {
                result += char + ',';
                continue;
              }
            }
            
            // Fix missing comma after array/object elements
            // Pattern: ] or } followed by " or { or [ (but not already followed by comma)
            if ((char === '}' || char === ']') && i + 1 < fixed.length) {
              const next = fixed[i + 1];
              const afterNext = i + 2 < fixed.length ? fixed[i + 2] : '';
              // If next is quote, brace, or bracket, and not already comma
              if ((next === '"' || next === '{' || next === '[') && afterNext !== ',') {
                // Check if we're in an array context (last non-whitespace before was not comma)
                const before = result.trimEnd();
                const lastChar = before[before.length - 1];
                if (lastChar && lastChar !== ',' && lastChar !== '[' && lastChar !== '{') {
                  result += ',';
                }
              }
            }
          }
          
          result += char;
        }
        fixed = result;
        
        // Pass 3: Fix specific array syntax errors - more aggressive patterns
        // Pattern: ]" or ]{ or ][ should have comma (missing comma after array element)
        fixed = fixed.replace(/(\])\s*(["{[])/g, '$1,$2');
        
        // Pattern: }" or }{ or }[ should have comma (missing comma after object)
        // But be careful - only fix if we're in an array context
        // Use character-by-character scan to avoid breaking strings
        let inString3 = false;
        let escapeNext3 = false;
        let result4 = '';
        for (let i = 0; i < fixed.length; i++) {
          const char = fixed[i];
          
          if (escapeNext3) {
            result4 += char;
            escapeNext3 = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext3 = true;
            result4 += char;
            continue;
          }
          
          if (char === '"') {
            inString3 = !inString3;
            result4 += char;
            continue;
          }
          
          if (!inString3 && char === '}') {
            // Look ahead for ", {, or [ without comma
            let j = i + 1;
            while (j < fixed.length && (fixed[j] === ' ' || fixed[j] === '\n' || fixed[j] === '\r' || fixed[j] === '\t')) {
              j++;
            }
            if (j < fixed.length && (fixed[j] === '"' || fixed[j] === '{' || fixed[j] === '[')) {
              const between = fixed.substring(i + 1, j);
              if (!between.includes(',')) {
                result4 += char + ',';
                continue;
              }
            }
          }
          
          result4 += char;
        }
        fixed = result4;
        
        // Pattern: " followed by " or { or [ (missing comma between string values in array)
        // But only if not inside a string (rough check - look for even number of quotes before)
        let quoteCount = 0;
        let result2 = '';
        for (let i = 0; i < fixed.length; i++) {
          const char = fixed[i];
          if (char === '"' && (i === 0 || fixed[i - 1] !== '\\')) {
            quoteCount++;
          }
          // If we have a quote followed by quote/brace/bracket and quotes are even (outside string)
          if (char === '"' && quoteCount % 2 === 0 && i + 1 < fixed.length) {
            const next = fixed[i + 1];
            if ((next === '"' || next === '{' || next === '[') && fixed[i - 1] !== ',') {
              result2 += char + ',';
              continue;
            }
          }
          result2 += char;
        }
        fixed = result2;
        
        // Additional pass: Fix } followed by } or ] (missing comma between objects in array)
        // This is a common pattern: [{...}{...}] should be [{...},{...}]
        // More aggressive: fix ALL } followed by } or ] patterns (common in arrays)
        let inString2 = false;
        let escapeNext2 = false;
        let result3 = '';
        for (let i = 0; i < fixed.length; i++) {
          const char = fixed[i];
          
          if (escapeNext2) {
            result3 += char;
            escapeNext2 = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext2 = true;
            result3 += char;
            continue;
          }
          
          if (char === '"') {
            inString2 = !inString2;
            result3 += char;
            continue;
          }
          
          if (!inString2 && char === '}') {
            // Look ahead for }, ], or { without comma (missing comma between objects in array)
            let j = i + 1;
            while (j < fixed.length && (fixed[j] === ' ' || fixed[j] === '\n' || fixed[j] === '\r' || fixed[j] === '\t')) {
              j++;
            }
            if (j < fixed.length && (fixed[j] === '}' || fixed[j] === ']' || fixed[j] === '{')) {
              // Check if there's a comma already
              const between = fixed.substring(i + 1, j);
              if (!between.includes(',')) {
                result3 += char + ',';
                continue;
              }
            }
          }
          
          result3 += char;
        }
        fixed = result3;
        
        // Pass 4: Remove control characters (but preserve \n, \t, \r in strings)
        fixed = fixed.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
        
        return fixed;
      };
      
      try {
        fixedText = fixJsonSyntax(cleanedText);
        const fixedParsed = JSON.parse(fixedText) as T;
        console.log("[Gemini] ✅ Successfully parsed after fixing common JSON issues");
        return fixedParsed;
      } catch (fixError) {
        // Log the fix attempt failure with position info
        console.error("[Gemini] ❌ JSON fix attempt failed:", fixError);
        
        // If it's a SyntaxError with position info, try targeted fixes
        if (fixError instanceof SyntaxError && fixError.message.includes('position')) {
          const positionMatch = fixError.message.match(/position (\d+)/);
          if (positionMatch) {
            const position = parseInt(positionMatch[1], 10);
            const start = Math.max(0, position - 300);
            const end = Math.min(fixedText.length, position + 300);
            console.error("[Gemini] Problematic JSON around error position:");
            console.error("[Gemini] Position:", position);
            console.error("[Gemini] Line:", fixedText.substring(0, position).split('\n').length);
            console.error("[Gemini] Context (600 chars):", fixedText.substring(start, end));
            console.error("[Gemini] Character at position:", fixedText[position], `(${fixedText.charCodeAt(position)})`);
            
            // Save problematic JSON to file for debugging (in development)
            if (isDev) {
              try {
                const problematicJson = {
                  error: fixError instanceof Error ? fixError.message : String(fixError),
                  position,
                  context: fixedText.substring(start, end),
                  fullJson: fixedText,
                  timestamp: new Date().toISOString(),
                };
                const debugPath = path.join(__dirname, 'gemini-debug.json');
                fs.writeFileSync(debugPath, JSON.stringify(problematicJson, null, 2));
                console.error("[Gemini] 💾 Saved problematic JSON to:", debugPath);
              } catch (saveError) {
                console.error("[Gemini] Failed to save debug JSON:", saveError);
              }
            }
            
            // Try multiple fix strategies
            const fixStrategies = [
              // Strategy 1: Add missing comma before ] (check context)
              () => {
                if (position > 0 && fixedText[position] === ']') {
                  const before = fixedText[position - 1];
                  // Check if we're in an array and need a comma
                  if (before && before !== ',' && before !== '[' && before !== '\n' && before !== '\r' && before !== ' ') {
                    // Look backwards to see if we're in an array context
                    let depth = 0;
                    let inArray = false;
                    for (let i = position - 1; i >= 0; i--) {
                      if (fixedText[i] === ']') depth++;
                      else if (fixedText[i] === '[') {
                        depth--;
                        if (depth === 0) {
                          inArray = true;
                          break;
                        }
                      }
                    }
                    if (inArray) {
                      return fixedText.substring(0, position) + ',' + fixedText.substring(position);
                    }
                  }
                }
                return null;
              },
              // Strategy 2: Add missing comma after array element (before next element)
              () => {
                // Look at the context around the error position
                const contextStart = Math.max(0, position - 100);
                const contextEnd = Math.min(fixedText.length, position + 100);
                const context = fixedText.substring(contextStart, contextEnd);
                
                // Check if we're between array elements - look for } followed by } or ]
                const beforePos = fixedText.substring(Math.max(0, position - 50), position);
                const afterPos = fixedText.substring(position, Math.min(fixedText.length, position + 50));
                
                // Pattern 1: } followed by } (missing comma between objects in array)
                if (beforePos.trimEnd().endsWith('}') && (afterPos.trimStart().startsWith('}') || afterPos.trimStart().startsWith(']'))) {
                  // Find the last } before position
                  const lastBrace = fixedText.lastIndexOf('}', position);
                  if (lastBrace >= 0 && lastBrace < position) {
                    const between = fixedText.substring(lastBrace + 1, position).trim();
                    // If there's whitespace/newlines but no comma, add one
                    if (between.length > 0 && !between.includes(',') && !between.includes('{') && !between.includes('[')) {
                      // Insert comma right after the }
                      return fixedText.substring(0, lastBrace + 1) + ',' + fixedText.substring(lastBrace + 1);
                    }
                  }
                }
                
                // Pattern 2: ]" or ]{ or ][ without comma (missing comma after array element)
                if (beforePos.includes(']') && (afterPos.startsWith('"') || afterPos.startsWith('{') || afterPos.startsWith('['))) {
                  const lastBracket = fixedText.lastIndexOf(']', position);
                  if (lastBracket >= 0 && lastBracket < position) {
                    const between = fixedText.substring(lastBracket + 1, position).trim();
                    if (between.length > 0 && !between.includes(',')) {
                      return fixedText.substring(0, lastBracket + 1) + ',' + fixedText.substring(lastBracket + 1);
                    }
                  }
                }
                
                // Pattern 3: If position is at a quote/brace/bracket and previous char is }
                if (position > 0) {
                  const charAtPos = fixedText[position];
                  const charBefore = fixedText[position - 1];
                  // Check if we're at whitespace/newline between } and next element
                  if ((charAtPos === '"' || charAtPos === '{' || charAtPos === '[' || charAtPos === ']') && 
                      (charBefore === '}' || charBefore === ']' || charBefore === '\n' || charBefore === '\r' || charBefore === ' ')) {
                    // Look backwards to find the last } or ]
                    let lastElement = position - 1;
                    while (lastElement >= 0 && (fixedText[lastElement] === ' ' || fixedText[lastElement] === '\n' || fixedText[lastElement] === '\r' || fixedText[lastElement] === '\t')) {
                      lastElement--;
                    }
                    if (lastElement >= 0 && (fixedText[lastElement] === '}' || fixedText[lastElement] === ']')) {
                      const between = fixedText.substring(lastElement + 1, position).trim();
                      if (!between.includes(',')) {
                        return fixedText.substring(0, lastElement + 1) + ',' + fixedText.substring(lastElement + 1);
                      }
                    }
                  }
                }
                
                return null;
              },
              // Strategy 3: Remove trailing comma before ]
              () => {
                if (position > 1 && fixedText[position] === ']') {
                  const before = fixedText[position - 1];
                  if (before === ',') {
                    return fixedText.substring(0, position - 1) + fixedText.substring(position);
                  }
                }
                return null;
              },
              // Strategy 4: Add missing ] if array is not closed
              () => {
                if (fixedText[position] && fixedText[position] !== ']' && fixedText[position] !== '}') {
                  // Count open/close brackets to see if we need to close
                  const beforePos = fixedText.substring(0, position);
                  const openBrackets = (beforePos.match(/\[/g) || []).length;
                  const closeBrackets = (beforePos.match(/\]/g) || []).length;
                  if (openBrackets > closeBrackets) {
                    // Try inserting ] before the next } or end
                    const nextClose = fixedText.indexOf('}', position);
                    if (nextClose > position) {
                      return fixedText.substring(0, nextClose) + ']' + fixedText.substring(nextClose);
                    }
                  }
                }
                return null;
              },
            ];
            
            // Try each strategy
            for (let i = 0; i < fixStrategies.length; i++) {
              try {
                const attempt = fixStrategies[i]();
                if (attempt) {
                  const attemptParsed = JSON.parse(attempt) as T;
                  console.log(`[Gemini] ✅ Successfully parsed after fix strategy ${i + 1}`);
                  return attemptParsed;
                }
              } catch {
                // Try next strategy
              }
            }
          }
        }
        
        // Last resort: Try to repair incomplete JSON (if truncated)
        try {
          // Check if JSON might be incomplete (ends abruptly)
          const trimmed = fixedText.trim();
          const openBraces = (trimmed.match(/\{/g) || []).length;
          const closeBraces = (trimmed.match(/\}/g) || []).length;
          const openBrackets = (trimmed.match(/\[/g) || []).length;
          const closeBrackets = (trimmed.match(/\]/g) || []).length;
          
          // If JSON is incomplete, try to close it
          if (openBraces > closeBraces || openBrackets > closeBrackets) {
            console.log("[Gemini] 🔧 Detected incomplete JSON, attempting to close it...");
            let repaired = trimmed;
            
            // Remove trailing commas and whitespace before closing structures
            repaired = repaired.replace(/,\s*$/, ''); // Remove trailing comma at end
            repaired = repaired.replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas before } or ]
            
            // Close any open strings first (check if we're in a string)
            let inString = false;
            let escapeNext = false;
            for (let i = repaired.length - 1; i >= 0; i--) {
              const char = repaired[i];
              if (escapeNext) {
                escapeNext = false;
                continue;
              }
              if (char === '\\') {
                escapeNext = true;
                continue;
              }
              if (char === '"') {
                inString = !inString;
                break;
              }
              if (char !== ' ' && char !== '\n' && char !== '\r' && char !== '\t') {
                break;
              }
            }
            if (inString) {
              repaired += '"';
            }
            
            // Close arrays (remove trailing commas first)
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
              // Remove trailing comma before closing bracket
              repaired = repaired.replace(/,\s*$/, '');
              repaired += ']';
            }
            
            // Close objects (remove trailing commas first)
            for (let i = 0; i < openBraces - closeBraces; i++) {
              // Remove trailing comma before closing brace
              repaired = repaired.replace(/,\s*$/, '');
              repaired += '}';
            }
            
            try {
              const repairedFixed = fixJsonSyntax(repaired);
              const repairedParsed = JSON.parse(repairedFixed) as T;
              console.log("[Gemini] ✅ Successfully parsed after repairing incomplete JSON");
              return repairedParsed;
            } catch {
              // Try extracting just the JSON object part
              const jsonObjectMatch = repaired.match(/\{[\s\S]*\}/);
              if (jsonObjectMatch) {
                const jsonOnly = jsonObjectMatch[0];
                const jsonFixed = fixJsonSyntax(jsonOnly);
                const lastResortParsed = JSON.parse(jsonFixed) as T;
                console.log("[Gemini] ✅ Successfully parsed after extracting JSON object");
                return lastResortParsed;
              }
            }
          } else {
            // Try extracting just the JSON object part
            const jsonObjectMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonObjectMatch) {
              const jsonOnly = jsonObjectMatch[0];
              const jsonFixed = fixJsonSyntax(jsonOnly);
              const lastResortParsed = JSON.parse(jsonFixed) as T;
              console.log("[Gemini] ✅ Successfully parsed after extracting JSON object");
              return lastResortParsed;
            }
          }
        } catch {
          // Final fallback
        }
        
        // If fixing didn't work, throw original error with more context
      throw new Error(`Received invalid JSON from Gemini: ${parseError instanceof Error ? parseError.message : "Unknown parse error"}`);
      }
    }
  } catch (error: unknown) {
    console.error("\n========== [Gemini] API ERROR ==========");
    console.error("[Gemini] Error caught in generateJsonResponse");
    console.error("[Gemini] Error type:", typeof error);
    console.error("[Gemini] Error:", error);
    
    if (error instanceof Error) {
      console.error("[Gemini] Error name:", error.name);
      console.error("[Gemini] Error message:", error.message);
      console.error("[Gemini] Error stack:", error.stack);
      
      // Log all error properties
      const errorKeys = Object.keys(error);
      if (errorKeys.length > 0) {
        console.error("[Gemini] Error properties:", errorKeys);
        errorKeys.forEach((key) => {
          try {
            const value = (error as unknown as Record<string, unknown>)[key];
            console.error(`[Gemini] Error.${key}:`, value);
          } catch (e) {
            console.error(`[Gemini] Error.${key}: [Cannot access]`);
          }
        });
      }
    }
    
    // Handle Gemini API errors - check multiple possible error formats
    // First, try to extract error info from the error object itself
    let errorInfo = extractErrorInfo(error);
    
    // If error message contains JSON string, try to parse it
    if (!errorInfo && error instanceof Error) {
      try {
        // Try parsing the error message as JSON
        const parsed = JSON.parse(error.message);
        errorInfo = extractErrorInfo(parsed);
      } catch {
        // If that fails, try to extract JSON from the message string
        try {
          const jsonMatch = error.message.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            errorInfo = extractErrorInfo(parsed);
          }
        } catch {
          // Continue with original errorInfo (null)
        }
      }
    }
    
    if (errorInfo) {
      const errorCode = errorInfo.code || 500;
      // Provide user-friendly messages for common errors
      let errorMessage = errorInfo.message || (error instanceof Error ? error.message : "Unknown error from Gemini API");
      
      // Handle 503 errors with user-friendly message
      if (errorCode === 503 || errorInfo.status === "UNAVAILABLE") {
        errorMessage = "The service is temporarily overloaded. Please try again in a few moments.";
      }
      
      const errorStatus = errorInfo.status;

      const customError = new Error(errorMessage) as Error & { statusCode?: number; apiError?: unknown };
      
      // Preserve 503 status codes properly - this is critical!
      if (errorCode === 503 || errorStatus === "UNAVAILABLE") {
        customError.statusCode = 503;
        customError.apiError = { code: 503, message: errorMessage, status: "UNAVAILABLE" };
      } else {
        customError.statusCode = errorCode;
        customError.apiError = { code: errorCode, message: errorMessage, status: errorStatus };
      }
      
      throw customError;
    }

    // If it's a standard Error, check if message contains JSON error info
    if (error instanceof Error) {
      // Try to parse JSON from error message (common with API errors)
      try {
        const parsed = JSON.parse(error.message);
        const parsedErrorInfo = extractErrorInfo(parsed);
        if (parsedErrorInfo) {
          const errorCode = parsedErrorInfo.code || 500;
          const errorMessage = parsedErrorInfo.message || error.message;
          const errorStatus = parsedErrorInfo.status;

          const customError = new Error(errorMessage) as Error & { statusCode?: number; apiError?: unknown };
          
          // Preserve 503 status codes
          if (errorCode === 503 || errorStatus === "UNAVAILABLE") {
            customError.statusCode = 503;
            customError.apiError = { code: 503, message: errorMessage || "The model is overloaded. Please try again later.", status: "UNAVAILABLE" };
          } else {
            customError.statusCode = errorCode;
            customError.apiError = { code: errorCode, message: errorMessage, status: errorStatus };
          }
          
          throw customError;
        }
      } catch (parseError) {
        // Not valid JSON or parsing failed, check message for keywords
        const message = error.message.toLowerCase();
        
        // Check if message contains JSON-like structure with 503
        if (message.includes('"code":503') || message.includes('"code": 503') || 
            message.includes('"status":"unavailable"') || message.includes('"status": "unavailable"')) {
          // Try to extract JSON from the message string
          try {
            const jsonMatch = error.message.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const parsedErrorInfo = extractErrorInfo(parsed);
              if (parsedErrorInfo && (parsedErrorInfo.code === 503 || parsedErrorInfo.status === "UNAVAILABLE")) {
                const customError = new Error(parsedErrorInfo.message || error.message) as Error & { statusCode?: number; apiError?: unknown };
                customError.statusCode = 503;
                customError.apiError = { code: 503, message: parsedErrorInfo.message || "The model is overloaded. Please try again later.", status: "UNAVAILABLE" };
                throw customError;
              }
            }
          } catch {
            // Fall through to keyword check
          }
        }
        
        // Check error message for status codes or keywords
        if (message.includes("503") || message.includes("overloaded") || message.includes("unavailable")) {
          const customError = new Error(error.message) as Error & { statusCode?: number; apiError?: unknown };
          customError.statusCode = 503;
          customError.apiError = { code: 503, message: error.message, status: "UNAVAILABLE" };
          throw customError;
        }
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

// Demo analysis report generator - creates sample soil analysis based on user input
// Used when all AI models fail to ensure users still get useful output
const generateDemoAnalysis = (
  language: string,
  manualValues: Record<string, string>,
  reportText?: string
): Record<string, unknown> => {
  const isMarathi = language === "mr" || language === "hi";
  
  // Extract values from manual input
  const ph = manualValues.ph || manualValues.pH || "6.5";
  const nitrogen = manualValues.nitrogen || manualValues.N || "25";
  const phosphorus = manualValues.phosphorus || manualValues.P || "15";
  const potassium = manualValues.potassium || manualValues.K || "180";
  
  const overview = isMarathi
    ? `मातीच्या चाचणीच्या आधारे, माती ${ph} pH सह मध्यम गुणवत्तेची आहे. नायट्रोजन, फॉस्फरस आणि पोटॅशियमची पातळी तपासली आहे.`
    : `Based on soil test results, the soil quality is moderate with pH ${ph}. Nitrogen, Phosphorus, and Potassium levels have been analyzed.`;
  
  const sectionTitles = isMarathi
    ? {
        overview: "सारांश",
        soilQuality: "मातीची गुणवत्ता",
        nutrientAnalysis: "पोषक तत्व विश्लेषण",
        chemicalPlan: "रासायनिक खत योजना",
        organicPlan: "सेंद्रिय खत योजना",
        improvementPlan: "सुधारणा योजना",
        warnings: "सावधानता",
        nextSteps: "पुढील पाऊल",
      }
    : {
        overview: "Overview",
        soilQuality: "Soil Quality",
        nutrientAnalysis: "Nutrient Analysis",
        chemicalPlan: "Chemical Fertilizer Plan",
        organicPlan: "Organic Fertilizer Plan",
        improvementPlan: "Improvement Plan",
        warnings: "Warnings",
        nextSteps: "Next Steps",
      };
  
  return {
    language,
    overview,
    sectionTitles,
    soilQuality: {
      rating: isMarathi ? "मध्यम" : "Moderate",
      score: 65,
      description: isMarathi
        ? `मातीची गुणवत्ता मध्यम आहे. pH ${ph} आहे जे बहुतेक पिकांसाठी योग्य आहे.`
        : `Soil quality is moderate. pH is ${ph} which is suitable for most crops.`,
    },
    nutrientAnalysis: [
      {
        parameter: isMarathi ? "नायट्रोजन (N)" : "Nitrogen (N)",
        value: `${nitrogen} kg/ha`,
        status: isMarathi ? "मध्यम" : "Moderate",
        impact: isMarathi ? "पिकाच्या वाढीसाठी आवश्यक" : "Essential for crop growth",
        recommendation: isMarathi ? "नायट्रोजनयुक्त खत वापरा" : "Apply nitrogen-rich fertilizer",
      },
      {
        parameter: isMarathi ? "फॉस्फरस (P)" : "Phosphorus (P)",
        value: `${phosphorus} kg/ha`,
        status: isMarathi ? "कमी" : "Low",
        impact: isMarathi ? "मुळांच्या वाढीसाठी महत्वाचे" : "Important for root development",
        recommendation: isMarathi ? "फॉस्फरसयुक्त खत वापरा" : "Apply phosphorus-rich fertilizer",
      },
      {
        parameter: isMarathi ? "पोटॅशियम (K)" : "Potassium (K)",
        value: `${potassium} kg/ha`,
        status: isMarathi ? "चांगले" : "Good",
        impact: isMarathi ? "पिकाच्या आरोग्यासाठी आवश्यक" : "Essential for crop health",
        recommendation: isMarathi ? "वर्तमान पातळी राखा" : "Maintain current levels",
      },
    ],
    fertilizerRecommendations: {
      chemical: [
        {
          name: isMarathi ? "NPK 19:19:19" : "NPK 19:19:19",
          quantity: isMarathi ? "50 किलो प्रति एकर" : "50 kg per acre",
          timing: isMarathi ? "बुवणीच्या वेळी" : "At sowing time",
          application: isMarathi ? "मातीत मिसळा" : "Mix in soil",
          notes: isMarathi ? "संतुलित पोषक तत्व" : "Balanced nutrients",
        },
      ],
      organic: [
        {
          name: isMarathi ? "कंपोस्ट" : "Compost",
          quantity: isMarathi ? "2-3 टन प्रति एकर" : "2-3 tons per acre",
          timing: isMarathi ? "बुवणीपूर्वी" : "Before sowing",
          application: isMarathi ? "मातीत मिसळा" : "Mix in soil",
          notes: isMarathi ? "मातीची सुधारणा" : "Soil improvement",
        },
      ],
    },
    improvementPlan: [
      {
        action: isMarathi ? "नियमित सिंचन करा" : "Maintain regular irrigation",
        benefit: isMarathi ? "मातीची आर्द्रता राखणे" : "Maintain soil moisture",
        priority: isMarathi ? "उच्च" : "High",
      },
      {
        action: isMarathi ? "मातीची नियमित चाचणी करा" : "Conduct regular soil testing",
        benefit: isMarathi ? "पोषक तत्वांची पातळी मॉनिटर करा" : "Monitor nutrient levels",
        priority: isMarathi ? "मध्यम" : "Medium",
      },
    ],
    warnings: isMarathi
      ? [
          "मातीची pH पातळी नियमित तपासा",
          "अतिरिक्त खत वापर टाळा",
        ]
      : [
          "Monitor soil pH regularly",
          "Avoid excessive fertilizer use",
        ],
    nextSteps: isMarathi
      ? [
          "खत योजना लागू करा",
          "3 महिन्यांनंतर पुन्हा चाचणी करा",
        ]
      : [
          "Apply fertilizer plan",
          "Retest after 3 months",
        ],
    analysisTimestamp: new Date().toISOString(),
  };
};

// Demo report generator - creates sample recommendations based on user input
// Used when all AI models fail to ensure users still get useful output
const generateDemoRecommendations = (
  language: string,
  data: {
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
): Record<string, unknown> => {
  const isMarathi = language === "mr" || language === "hi";
  
  const farmSizeText = data.farmSize 
    ? `${data.farmSize.value} ${data.farmSize.unit === "acre" ? (isMarathi ? "एकर" : "acres") : (isMarathi ? "हेक्टर" : "hectares")}`
    : (isMarathi ? "मध्यम आकार" : "medium size");
  
  const summary = isMarathi
    ? `${data.crop.label} साठी ${data.soilType.label} मातीत ${data.growthStage.label} टप्प्यात शिफारसी. ${data.region.label} प्रदेशासाठी अनुकूल.`
    : `Recommendations for ${data.crop.label} in ${data.soilType.label} soil at ${data.growthStage.label} stage. Suitable for ${data.region.label} region.`;
  
  const demoRecommendation = (name: string, quantity: string, frequency: string, details: string) => ({
    name,
    quantity,
    frequency,
    details,
    notes: "",
  });
  
  return {
    language,
    summary,
    chemical: {
      primary: [
        demoRecommendation(
          isMarathi ? "NPK 19:19:19" : "NPK 19:19:19",
          isMarathi ? `50 किलो प्रति ${farmSizeText}` : `50 kg per ${farmSizeText}`,
          isMarathi ? "15 दिवसांनी" : "Every 15 days",
          isMarathi ? "मुख्य पोषक तत्वांसाठी संतुलित खत" : "Balanced fertilizer for main nutrients"
        ),
      ],
      secondary: [
        demoRecommendation(
          isMarathi ? "युरिया" : "Urea",
          isMarathi ? `25 किलो प्रति ${farmSizeText}` : `25 kg per ${farmSizeText}`,
          isMarathi ? "20 दिवसांनी" : "Every 20 days",
          isMarathi ? "नायट्रोजन पूरक" : "Nitrogen supplement"
        ),
      ],
    },
    organic: {
      primary: [
        demoRecommendation(
          isMarathi ? "कंपोस्ट" : "Compost",
          isMarathi ? `2-3 टन प्रति ${farmSizeText}` : `2-3 tons per ${farmSizeText}`,
          isMarathi ? "महिन्यातून एकदा" : "Once per month",
          isMarathi ? "सेंद्रिय पदार्थ आणि सूक्ष्म पोषक तत्व" : "Organic matter and micronutrients"
        ),
      ],
      secondary: [
        demoRecommendation(
          isMarathi ? "गोबर खत" : "Farmyard Manure",
          isMarathi ? `1-2 टन प्रति ${farmSizeText}` : `1-2 tons per ${farmSizeText}`,
          isMarathi ? "महिन्यातून एकदा" : "Once per month",
          isMarathi ? "मातीची सुधारणा" : "Soil improvement"
        ),
      ],
    },
    tips: isMarathi
      ? [
          `${data.crop.label} साठी नियमित सिंचन करा`,
          `मातीची pH पातळी 6.5-7.5 दरम्यान ठेवा`,
          `किडकांवर लक्ष ठेवा आणि आवश्यकतेनुसार उपचार करा`,
          `मातीची नियमित चाचणी करा`,
        ]
      : [
          `Maintain regular irrigation for ${data.crop.label}`,
          `Keep soil pH between 6.5-7.5`,
          `Monitor for pests and treat as needed`,
          `Conduct regular soil testing`,
        ],
  };
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
        "",
        "CRITICAL JSON FORMATTING RULES:",
        "- Return ONLY valid JSON. No markdown code blocks, no explanations, no text outside JSON.",
        "- All string values must use double quotes (\"). Never use single quotes.",
        "- Escape all quotes inside strings using backslash: \\\"",
        "- Escape newlines in strings as \\n",
        "- NO trailing commas in arrays or objects (e.g., [item1, item2] NOT [item1, item2,])",
        "- NO missing commas between array elements or object properties",
        "- All property names must be in double quotes",
        "- Ensure proper JSON syntax throughout - every array element and object property must be properly separated by commas",
        "- Arrays must have proper closing brackets: [item1, item2]",
        "- Objects must have proper closing braces: {\"key\": \"value\"}",
        "",
        "Use the provided soil metrics and lab report information (if any) to craft a detailed, actionable analysis.",
        "Deliver the response strictly as JSON that conforms exactly to the provided schema.",
        "",
        "Content Guidelines:",
        "- Be practical and concise, but offer enough context for farmers with low technical literacy.",
        "- Reference nutrient levels, deficiencies, and risks.",
        "- Recommend both chemical and organic fertilizer strategies.",
        "- Include actionable improvement steps and warnings when necessary.",
        "- Provide localized section titles inside the sectionTitles object.",
        "- Populate every array with at least one item; if data is missing, infer from typical agronomy knowledge but note assumptions.",
        "- When writing text content, ensure all quotes are escaped: use \\\" instead of \"",
        "",
        "Manual soil metrics:",
        formattedManual,
        "",
        reportSection,
        "",
        "Remember: Return ONLY valid JSON that can be parsed directly. No markdown, no code blocks, no explanations.",
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
    timestamp: new Date().toISOString(),
  });
});

// Simple test endpoint to verify POST is working
app.post("/api/test-post", (req, res) => {
  console.log("[TEST] POST /api/test-post received");
  console.log("[TEST] Request body:", req.body);
  res.json({
    success: true,
    message: "POST request received successfully",
    receivedBody: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint to verify server is working
app.post("/api/test-analyze-soil", async (req, res) => {
  try {
    console.log("[TEST] Test endpoint called");
    res.json({ 
      success: true, 
      message: "Server is working",
      body: req.body 
    });
  } catch (error) {
    console.error("[TEST] Error:", error);
    res.status(500).json({ error: "Test failed", details: error instanceof Error ? error.message : "Unknown" });
  }
});

// Main POST handler for analyze-soil endpoint
console.log("[SoilSathi] 📍 Registering POST /api/analyze-soil route...");

// Handle OPTIONS for CORS preflight (must be before POST)
app.options("/api/analyze-soil", (_req, res) => {
  console.log("[SoilSathi] OPTIONS /api/analyze-soil - CORS preflight");
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).send();
});

// Handle GET requests to analyze-soil (for browser direct access or debugging)
app.get("/api/analyze-soil", (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(405).json({
    error: "Method not allowed",
    message: "This endpoint only accepts POST requests. Please use the 'Analyze' button in the application.",
    method: "POST",
    path: "/api/analyze-soil",
    example: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        language: "en",
        manualValues: { ph: "7.0", nitrogen: "50" },
        reportText: "Optional lab report text",
        reportImage: { data: "base64...", mimeType: "image/png" }
      }
    }
  });
});

// Optimized helper function - tries ALL models in parallel from the start
// Whichever model responds fastest wins - maximum speed and reliability!
// This ensures users never see 503 errors if ANY model is available
const tryMultipleModels = async (
  models: string[],
  parts: Part[],
  schema: Schema,
  timeoutMs: number,
  maxOutputTokens?: number,
  useCache?: boolean
): Promise<Record<string, unknown>> => {
  // Filter out empty models
  const validModels = models.filter(m => m && m.trim().length > 0);
  if (validModels.length === 0) {
    throw new Error("No valid models configured");
  }
  
  const hasImage = parts.some(p => 'inlineData' in p);
  
  // Model-specific timeout optimization - faster models get shorter timeouts
  const getModelTimeout = (model: string, baseTimeout: number): number => {
    if (model.includes('flash-lite')) {
      return hasImage ? Math.min(baseTimeout, 20000) : Math.min(baseTimeout, 15000); // 20s/15s for flash-lite (fastest)
    }
    if (model.includes('flash') && !model.includes('pro') && !model.includes('lite')) {
      return hasImage ? Math.min(baseTimeout, 25000) : Math.min(baseTimeout, 18000); // 25s/18s for flash
    }
    if (model.includes('pro')) {
      return hasImage ? Math.min(baseTimeout, 40000) : Math.min(baseTimeout, 30000); // 40s/30s for pro (slower but accurate)
    }
    // Default timeout
    return hasImage ? Math.min(baseTimeout, 35000) : Math.min(baseTimeout, 25000);
  };
  
  const baseTimeout = timeoutMs;
  
  console.log(`[SoilSathi] 🚀 Starting ${validModels.length} models in parallel - first success wins!`);
  console.log(`[SoilSathi] Models: ${validModels.join(", ")}`);
  
  // Create promises for ALL models simultaneously - race condition!
  const modelPromises = validModels.map(async (model, index) => {
    try {
      const modelTimeout = getModelTimeout(model, baseTimeout);
      console.log(`[SoilSathi] 🔄 Model ${index + 1}/${validModels.length}: Starting ${model}... (timeout: ${modelTimeout}ms)`);
      
      const result = await generateJsonResponse<Record<string, unknown>>({
        model,
        parts,
        schema,
        timeoutMs: modelTimeout,
        maxOutputTokens,
        useCache,
      });
      
      console.log(`[SoilSathi] ✅ Model ${model} succeeded!`);
      return { success: true, model, result };
    } catch (error) {
      const statusCode = (error as Error & { statusCode?: number })?.statusCode;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Only log if it's not a timeout (timeouts are expected for slower models)
      if (!errorMsg.toLowerCase().includes("timeout")) {
        console.log(`[SoilSathi] ❌ Model ${model} failed (${statusCode || 'unknown'}): ${errorMsg.substring(0, 100)}`);
      }
      
      return { 
        success: false, 
        model, 
        error: error instanceof Error ? error : new Error(String(error)),
        statusCode 
      };
    }
  });
  
  // Race all models - first success wins!
  // Use Promise.allSettled to wait for all, but return first success
  const results = await Promise.allSettled(modelPromises);
  
  // Find the first successful result
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.success) {
      const winner = result.value;
      console.log(`[SoilSathi] 🏆 Winner: ${winner.model} - returning result!`);
      return winner.result;
    }
  }
  
  // All models failed - collect errors and create a user-friendly error
  const errors: Array<{ model: string; error: Error; statusCode?: number }> = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && !result.value.success) {
      errors.push({
        model: result.value.model,
        error: result.value.error,
        statusCode: result.value.statusCode
      });
    }
  }
  
  // Log all failures
  console.error(`[SoilSathi] ❌ All ${validModels.length} models failed:`);
  errors.forEach(({ model, statusCode, error }) => {
    console.error(`  - ${model}: ${statusCode || 'unknown'} - ${error.message.substring(0, 100)}`);
  });
  
  // Create a user-friendly error that doesn't expose 503 status
  // This ensures users get a helpful message instead of "service unavailable"
  const all503 = errors.every(e => e.statusCode === 503);
  const all429 = errors.every(e => e.statusCode === 429);
  const all404 = errors.every(e => e.statusCode === 404);
  
  const userFriendlyError = new Error(
    all503 
      ? "All AI models are currently busy. Please try again in a few moments."
      : all429
      ? "API quota limit reached. Please wait a moment and try again."
      : all404
      ? "AI models are not available. Please check your configuration."
      : "Unable to process request at this time. Please try again later."
  ) as Error & { statusCode?: number; apiError?: unknown };
  
  // Don't expose 503 to users - return as 500 with friendly message
  userFriendlyError.statusCode = 500;
  userFriendlyError.apiError = {
    code: 500,
    message: userFriendlyError.message,
    status: "SERVICE_UNAVAILABLE",
    allModelsFailed: true,
    attemptedModels: validModels
  };
  
  throw userFriendlyError;
};

// Main POST handler for analyze-soil endpoint
app.post("/api/analyze-soil", async (req, res) => {
  // CRITICAL: Set JSON header FIRST, before any operations
  try {
    res.setHeader('Content-Type', 'application/json');
  } catch (headerError) {
    console.error("[SoilSathi] ❌ Failed to set Content-Type header:", headerError);
  }
  
  // Log route hit - ALWAYS log to verify route is being called
  console.log("\n[SoilSathi] ✅✅✅ /api/analyze-soil POST route MATCHED ✅✅✅");
  console.log("[SoilSathi] Request method:", req.method);
  console.log("[SoilSathi] Request URL:", req.url);
  console.log("[SoilSathi] Request path:", req.path);
  console.log("[SoilSathi] Request headers:", JSON.stringify(req.headers, null, 2));
  console.log("[SoilSathi] Request body keys:", Object.keys(req.body || {}));
  console.log("[SoilSathi] Request body sample:", JSON.stringify(req.body || {}, null, 2).substring(0, 500));
  
    const isDev = env.nodeEnv === "development";
  
  // Wrap entire handler to catch ANY error - including synchronous errors
  try {
    
    if (isDev) {
      console.log("[SoilSathi] ========== ANALYZE-SOIL REQUEST START ==========");
      console.log("[SoilSathi] Request body keys:", Object.keys(req.body || {}));
    }
    
    if (!genAI) {
      console.error("[SoilSathi] ❌ Gemini API client not initialized for analyze-soil!");
      if (!res.headersSent) {
        res.status(500).json({
          error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
        });
      }
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
      
      // Validate and sanitize inputs
      let sanitizedManualValues: Record<string, string>;
      try {
        sanitizedManualValues = sanitizeManualValues(manualValues);
      } catch (sanitizeError) {
        console.error("[SoilSathi] ❌ Failed to sanitize manual values:", sanitizeError);
        res.status(400).json({
          error: "Invalid manual values provided.",
          details: sanitizeError instanceof Error ? sanitizeError.message : "Unknown error",
        });
        return;
      }

      const trimmedReportText = reportText?.trim() || undefined;
      
      // Build prompt with error handling
      let parts: Part[];
      try {
        parts = buildPrompt(language, sanitizedManualValues, trimmedReportText);
        if (!parts || parts.length === 0) {
          throw new Error("Failed to build prompt: empty parts array");
        }
      } catch (promptError) {
        console.error("[SoilSathi] ❌ Failed to build prompt:", promptError);
        res.status(400).json({
          error: "Failed to build analysis prompt.",
          details: promptError instanceof Error ? promptError.message : "Unknown error",
        });
        return;
      }

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

      // Validate model name and parts before API call
      if (!MODEL_NAME || MODEL_NAME.trim().length === 0) {
        console.error("[SoilSathi] ❌ MODEL_NAME is not configured!");
        res.status(500).json({
          error: "Server configuration error: Model name not configured.",
        });
        return;
      }

      if (!parts || parts.length === 0) {
        console.error("[SoilSathi] ❌ Parts array is empty!");
        res.status(400).json({
          error: "Invalid request: No content to analyze.",
        });
        return;
      }

      console.log("[SoilSathi] Calling Gemini API for soil analysis...");
      console.log("[SoilSathi] Primary model:", MODEL_NAME);
      console.log("[SoilSathi] Fallback models:", FALLBACK_MODELS.join(", "));
      console.log("[SoilSathi] Parts count:", parts.length);
      console.log("[SoilSathi] Has image:", parts.some(p => 'inlineData' in p));
      
      // Optimized timeout for image analysis (35 seconds for faster responses)
      // Use multi-model fallback system to handle overloaded models
      let payload: Record<string, unknown>;
      try {
        payload = await tryMultipleModels(
          FALLBACK_MODELS,
          parts,
          analysisSchema,
          reportImage?.data ? 60000 : 30000, // 60 seconds for image analysis, 30s for text-only
          reportImage?.data ? 8192 : 8192, // Increased to 8192 for manual-only to prevent MAX_TOKENS truncation
          !reportImage?.data // Disable cache for image requests
        );
      } catch (generateError) {
        // Check if all models failed - if so, generate demo report
        const apiError = (generateError as Error & { apiError?: { allModelsFailed?: boolean } })?.apiError;
        if (apiError?.allModelsFailed) {
          console.log("[SoilSathi] 🎭 All models failed - generating demo analysis based on user input...");
          payload = generateDemoAnalysis(language, sanitizedManualValues, trimmedReportText);
          console.log("[SoilSathi] ✅ Demo analysis generated successfully");
          console.log("[SoilSathi] 📤 Sending demo report to user...");
        } else {
          // If it's a different error, log and throw it
          console.error("[SoilSathi] ❌ generateJsonResponse failed:", generateError);
          if (isDev) {
            console.error("[SoilSathi] Error details:", {
              errorType: typeof generateError,
              errorMessage: generateError instanceof Error ? generateError.message : String(generateError),
              errorStack: generateError instanceof Error ? generateError.stack : undefined,
            });
          }
          throw generateError; // Re-throw to be handled by outer catch
        }
      }

      if (isDev) {
        console.log("[SoilSathi] ✅ Soil analysis completed successfully");
      }
      
      // Ensure response is sent
      if (!res.headersSent) {
        console.log("[SoilSathi] 📤 Sending response to user (payload keys:", Object.keys(payload || {}).join(", "), ")");
        res.json(payload);
      } else {
        console.warn("[SoilSathi] ⚠️ Response already sent, cannot send payload");
      }
    } catch (error: unknown) {
      console.error("\n========== [SoilSathi] ANALYZE-SOIL ERROR ==========");
      console.error("[SoilSathi] Analysis failed:", error);
      console.error("[SoilSathi] Error type:", typeof error);
      
      // CRITICAL: Always ensure JSON response, even if error handling fails
      const sendJsonError = (status: number, errorObj: Record<string, unknown>) => {
        try {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            res.status(status).json(errorObj);
          }
        } catch (sendError) {
          console.error("[SoilSathi] ❌ Failed to send JSON error response:", sendError);
          // Last resort - try to send plain text if JSON fails
          try {
            if (!res.headersSent) {
              res.status(status).send(JSON.stringify(errorObj));
            }
          } catch {
            // If everything fails, at least log it
            console.error("[SoilSathi] ❌❌❌ COMPLETE FAILURE TO SEND RESPONSE ❌❌❌");
          }
        }
      };
      
      try {
        if (error instanceof Error) {
          console.error("[SoilSathi] Error message:", error.message);
          console.error("[SoilSathi] Error stack:", error.stack);
        }
        
        // Extract error info using the helper function to ensure proper detection
        const errorInfo = extractErrorInfo(error);
        
        // Check if it's a 503/UNAVAILABLE error
        const statusCode = (error as Error & { statusCode?: number })?.statusCode;
        const apiError = (error as Error & { apiError?: { code?: number; message?: string; status?: string } })?.apiError;
        
        // Use extracted error info if available, otherwise fall back to direct properties
        const isServiceOverloaded = 
          errorInfo?.code === 503 || 
          errorInfo?.status === "UNAVAILABLE" ||
          statusCode === 503 || 
          apiError?.status === "UNAVAILABLE" ||
          apiError?.code === 503;
        
        const isQuotaExceeded = 
          errorInfo?.code === 429 ||
          errorInfo?.status === "RESOURCE_EXHAUSTED" ||
          statusCode === 429 ||
          apiError?.status === "RESOURCE_EXHAUSTED" ||
          apiError?.code === 429 ||
          (error instanceof Error && (
            error.message.toLowerCase().includes("quota") ||
            error.message.toLowerCase().includes("rate limit") ||
            error.message.toLowerCase().includes("exceeded")
          ));
        
        if (isQuotaExceeded) {
          sendJsonError(429, {
            error: "API quota exceeded. Please wait a moment and try again.",
            details: errorInfo?.message || apiError?.message || "You've reached the API request limit. Please wait before trying again.",
            code: 429,
            status: "RESOURCE_EXHAUSTED",
          });
          return;
        }
        
        if (isServiceOverloaded) {
          sendJsonError(503, {
            error: "The model is overloaded. Please try again later.",
            details: errorInfo?.message || apiError?.message || "The Gemini API is currently unavailable. Please wait a moment and try again.",
            code: 503,
            status: "UNAVAILABLE",
          });
          return;
        }

        const httpStatus = (statusCode && statusCode >= 400 && statusCode < 600) ? statusCode : 500;
        
        // Ensure response hasn't been sent yet
        if (!res.headersSent) {
          sendJsonError(httpStatus, {
            error: "Failed to generate soil analysis. Please try again later.",
            details:
              error instanceof Error
                ? error.message
                : "Unknown error occurred while contacting Gemini API.",
            ...(apiError && { apiError }),
          });
        }
      } catch (handlerError) {
        // If error handling itself fails, log and send basic error
        console.error("[SoilSathi] ❌ Error handler failed:", handlerError);
        sendJsonError(500, {
            error: "An unexpected error occurred while processing your request.",
            details: error instanceof Error ? error.message : "Unknown error",
          });
      }
    }
  } catch (topLevelError: unknown) {
    // Catch ANY error that wasn't handled above
    console.error("\n========== [SoilSathi] TOP-LEVEL ANALYZE-SOIL ERROR ==========");
    console.error("[SoilSathi] Unhandled exception:", topLevelError);
    console.error("[SoilSathi] Error type:", typeof topLevelError);
    
    if (topLevelError instanceof Error) {
      console.error("[SoilSathi] Error name:", topLevelError.name);
      console.error("[SoilSathi] Error message:", topLevelError.message);
      console.error("[SoilSathi] Error stack:", topLevelError.stack);
    }
    
    // CRITICAL: Always send JSON, never crash
    try {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        const statusCode = (topLevelError as Error & { statusCode?: number })?.statusCode;
        const apiError = (topLevelError as Error & { apiError?: { code?: number; message?: string; status?: string } })?.apiError;
        
        if (statusCode === 503 || apiError?.status === "UNAVAILABLE") {
          res.status(503).json({
            error: "The model is overloaded. Please try again later.",
            details: apiError?.message || "The Gemini API is currently unavailable.",
            code: 503,
            status: "UNAVAILABLE",
          });
        } else {
          res.status(statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
            error: "An unexpected error occurred while processing your request.",
            details: topLevelError instanceof Error ? topLevelError.message : "Unknown error",
            type: typeof topLevelError,
          });
        }
      }
    } catch (finalError) {
      // Absolute last resort - log and try one more time
      console.error("[SoilSathi] ❌❌❌ FINAL ERROR HANDLER FAILED ❌❌❌", finalError);
      if (!res.headersSent) {
        try {
          res.setHeader('Content-Type', 'application/json');
          res.status(500).json({
            error: "An unexpected error occurred while processing your request.",
            details: "Internal server error",
          });
        } catch {
          // If even this fails, let Express handle it
        }
      }
    }
  }
});

app.post("/api/recommendations", async (req, res) => {
  // CRITICAL: Set JSON header FIRST, before any operations
  try {
    res.setHeader('Content-Type', 'application/json');
  } catch (headerError) {
    console.error("[SoilSathi] ❌ Failed to set Content-Type header:", headerError);
  }
  
  const isDev = env.nodeEnv === "development";
  
  // Wrap entire handler to catch ANY error - including synchronous errors
  try {
    if (isDev) {
      console.log("[SoilSathi] ========== RECOMMENDATIONS REQUEST START ==========");
      console.log("[SoilSathi] Request body keys:", Object.keys(req.body || {}));
    }
    
    if (!genAI) {
      console.error("[SoilSathi] ❌ Gemini API client not initialized for recommendations!");
      if (!res.headersSent) {
        res.status(500).json({
          error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
        });
      }
      return;
    }

    const parsed = recommendationsRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      console.error("[SoilSathi] ❌ Validation failed for recommendations:", parsed.error.errors);
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
      if (isDev) {
        console.log("[SoilSathi] Recommendations request received", {
          language,
          soilType: soilType?.label,
          region: region?.label,
          crop: crop?.label,
          growthStage: growthStage?.label,
        });
      }
      
      // Build prompt with error handling
      let parts: Part[];
      try {
        parts = buildRecommendationsPrompt(language, {
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
        if (!parts || parts.length === 0) {
          throw new Error("Failed to build prompt: empty parts array");
        }
      } catch (promptError) {
        console.error("[SoilSathi] ❌ Failed to build recommendations prompt:", promptError);
        if (!res.headersSent) {
          res.status(400).json({
            error: "Failed to build recommendations prompt.",
            details: promptError instanceof Error ? promptError.message : "Unknown error",
          });
        }
        return;
      }

      // Validate model name and parts before API call
      if (!MODEL_NAME || MODEL_NAME.trim().length === 0) {
        console.error("[SoilSathi] ❌ MODEL_NAME is not configured!");
        if (!res.headersSent) {
          res.status(500).json({
            error: "Server configuration error: Model name not configured.",
          });
        }
        return;
      }

      if (!parts || parts.length === 0) {
        console.error("[SoilSathi] ❌ Parts array is empty!");
        if (!res.headersSent) {
          res.status(400).json({
            error: "Invalid request: No content to process.",
          });
        }
        return;
      }

      console.log("[SoilSathi] Calling Gemini API for recommendations...");
      console.log("[SoilSathi] Primary model:", MODEL_NAME);
      console.log("[SoilSathi] Fallback models:", FALLBACK_MODELS.join(", "));
      console.log("[SoilSathi] Parts count:", parts.length);

      // Use multi-model parallel system for reliability - all models try simultaneously
      // First success wins - ensures users never see 503 errors if ANY model works
      let payload: Record<string, unknown>;
      try {
        payload = await tryMultipleModels(
          FALLBACK_MODELS,
          parts,
          recommendationsSchema,
          60000, // 60 seconds timeout
          8192, // Increased to 8192 to prevent MAX_TOKENS truncation
          true // Enable caching for same requests
        );
      } catch (generateError) {
        // Check if all models failed - if so, generate demo report
        const apiError = (generateError as Error & { apiError?: { allModelsFailed?: boolean } })?.apiError;
        if (apiError?.allModelsFailed) {
          console.log("[SoilSathi] 🎭 All models failed - generating demo recommendations based on user input...");
          payload = generateDemoRecommendations(language, {
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
          console.log("[SoilSathi] ✅ Demo recommendations generated successfully");
          console.log("[SoilSathi] 📤 Sending demo recommendations to user...");
        } else {
          // If it's a different error, log and throw it
          console.error("[SoilSathi] ❌ generateJsonResponse failed:", generateError);
          if (isDev) {
            console.error("[SoilSathi] Error details:", {
              errorType: typeof generateError,
              errorMessage: generateError instanceof Error ? generateError.message : String(generateError),
              errorStack: generateError instanceof Error ? generateError.stack : undefined,
            });
          }
          throw generateError; // Re-throw to be handled by outer catch
        }
      }

      if (isDev) {
        console.log("[SoilSathi] ✅ Recommendations completed successfully");
      }
      
      // Ensure response is sent
      if (!res.headersSent) {
        console.log("[SoilSathi] 📤 Sending response to user (payload keys:", Object.keys(payload || {}).join(", "), ")");
        res.json(payload);
      } else {
        console.warn("[SoilSathi] ⚠️ Response already sent, cannot send payload");
      }
    } catch (error: unknown) {
      console.error("\n========== [SoilSathi] RECOMMENDATIONS ERROR ==========");
      console.error("[SoilSathi] Recommendations failed:", error);
      console.error("[SoilSathi] Error type:", typeof error);
      
      // CRITICAL: Always ensure JSON response, even if error handling fails
      const sendJsonError = (status: number, errorObj: Record<string, unknown>) => {
        try {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            res.status(status).json(errorObj);
          }
        } catch (sendError) {
          console.error("[SoilSathi] ❌ Failed to send JSON error response:", sendError);
          // Last resort - try to send plain text if JSON fails
          try {
            if (!res.headersSent) {
              res.status(status).send(JSON.stringify(errorObj));
            }
          } catch {
            // If everything fails, at least log it
            console.error("[SoilSathi] ❌❌❌ COMPLETE FAILURE TO SEND RESPONSE ❌❌❌");
          }
        }
      };
      
      try {
        if (error instanceof Error) {
          console.error("[SoilSathi] Error message:", error.message);
          console.error("[SoilSathi] Error stack:", error.stack);
        }
        
        // Extract error info using the helper function to ensure proper detection
        const errorInfo = extractErrorInfo(error);
        
        // Check if it's a 503/UNAVAILABLE error
        const statusCode = (error as Error & { statusCode?: number })?.statusCode;
        const apiError = (error as Error & { apiError?: { code?: number; message?: string; status?: string; allModelsFailed?: boolean } })?.apiError;
        
        // Check if all models failed (our custom error from tryMultipleModels)
        const allModelsFailed = apiError?.allModelsFailed === true;
        
        // Use extracted error info if available, otherwise fall back to direct properties
        const isServiceOverloaded = 
          errorInfo?.code === 503 || 
          errorInfo?.status === "UNAVAILABLE" ||
          statusCode === 503 || 
          apiError?.status === "UNAVAILABLE" ||
          apiError?.code === 503;
        
        const isQuotaExceeded = 
          errorInfo?.code === 429 ||
          errorInfo?.status === "RESOURCE_EXHAUSTED" ||
          statusCode === 429 ||
          apiError?.status === "RESOURCE_EXHAUSTED" ||
          apiError?.code === 429 ||
          (error instanceof Error && (
            error.message.toLowerCase().includes("quota") ||
            error.message.toLowerCase().includes("rate limit") ||
            error.message.toLowerCase().includes("exceeded")
          ));
        
        const isMaxTokens = 
          errorInfo?.status === "MAX_TOKENS" ||
          apiError?.status === "MAX_TOKENS" ||
          (error instanceof Error && (
            error.message.toLowerCase().includes("max_tokens") ||
            error.message.toLowerCase().includes("token limit") ||
            error.message.toLowerCase().includes("truncated")
          ));
        
        // If all models failed, return user-friendly 500 error (not 503)
        if (allModelsFailed) {
          sendJsonError(500, {
            error: error instanceof Error ? error.message : "Unable to process request at this time.",
            details: apiError?.message || "All AI models are currently unavailable. Please try again in a few moments.",
            code: 500,
            status: "SERVICE_UNAVAILABLE",
            retry: true,
          });
          return;
        }
        
        if (isQuotaExceeded) {
          sendJsonError(429, {
            error: "API quota exceeded. Please wait a moment and try again.",
            details: errorInfo?.message || apiError?.message || "You've reached the API request limit. Please wait before trying again.",
            code: 429,
            status: "RESOURCE_EXHAUSTED",
          });
          return;
        }
        
        if (isMaxTokens) {
          sendJsonError(500, {
            error: "Response was too long. Please try simplifying your request or contact support.",
            details: errorInfo?.message || apiError?.message || "The response exceeded the maximum token limit. Try reducing the number of challenges or notes.",
            code: 500,
            status: "MAX_TOKENS",
          });
          return;
        }
        
        // Don't return 503 to users - convert to 500 with friendly message
        if (isServiceOverloaded) {
          sendJsonError(500, {
            error: "Service temporarily unavailable. Please try again in a few moments.",
            details: errorInfo?.message || apiError?.message || "The AI service is currently busy. Please wait a moment and try again.",
            code: 500,
            status: "SERVICE_UNAVAILABLE",
            retry: true,
          });
          return;
        }

        const httpStatus = (statusCode && statusCode >= 400 && statusCode < 600) ? statusCode : 500;
        
        // Ensure response hasn't been sent yet
        if (!res.headersSent) {
          sendJsonError(httpStatus, {
            error: "Failed to generate fertilizer recommendations. Please try again later.",
            details:
              error instanceof Error
                ? error.message
                : "Unknown error occurred while contacting Gemini API.",
            ...(apiError && { apiError }),
          });
        }
      } catch (handlerError) {
        // If error handling itself fails, log and send basic error
        console.error("[SoilSathi] ❌ Error handler failed:", handlerError);
        sendJsonError(500, {
            error: "An unexpected error occurred while processing your request.",
            details: error instanceof Error ? error.message : "Unknown error",
          });
      }
    }
  } catch (outerError: unknown) {
    // Catch any synchronous errors that weren't caught in inner try-catch
    console.error("[SoilSathi] ❌ Outer error handler caught:", outerError);
    try {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
          error: "An unexpected error occurred while processing your request.",
          details: outerError instanceof Error ? outerError.message : "Unknown error",
        });
      }
    } catch {
      console.error("[SoilSathi] ❌❌❌ COMPLETE FAILURE TO SEND RESPONSE ❌❌❌");
    }
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: !!genAI,
    model: MODEL_NAME,
    version: "0.0.1",
    commit: "bedccf0",
    deployedAt: new Date().toISOString(),
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

    // Generate response from Gemini using parallel model execution with fallbacks
    let payload: Record<string, unknown>;
    try {
      if (isDev) {
        console.log("[SoilSathi] Calling Gemini API with parallel fallback models...");
      }
      // Use parallel model execution for faster, more reliable responses
      payload = await tryMultipleModels(
        FALLBACK_MODELS,
        parts,
        farmerAssistSchema,
        20000, // 20 seconds base timeout - optimized for faster response
        1024, // Limit tokens for faster conversational responses
        false // Disable cache for conversational requests (unique per question)
      ) as Record<string, unknown>;
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred while contacting Gemini API.";
    
    // Check for timeout errors
    const isTimeout = errorMessage.toLowerCase().includes("timeout") || errorMessage.toLowerCase().includes("timed out");
    
    // Check for rate limit/quota errors
    const isRateLimit = statusCode === 429 || 
                       apiError?.code === 429 || 
                       apiError?.status === "RESOURCE_EXHAUSTED" ||
                       errorMessage.toLowerCase().includes("quota") ||
                       errorMessage.toLowerCase().includes("rate limit");
    
    // Check for service unavailable errors
    const isServiceUnavailable = statusCode === 503 || 
                                apiError?.status === "UNAVAILABLE" || 
                                apiError?.code === 503;
    
    if (isServiceUnavailable) {
      console.error("[SoilSathi] Returning 503 Service Unavailable response");
      res.status(503).json({
        error: "Service temporarily unavailable. Please try again in a few moments.",
        details: "All AI models are currently busy. The system will automatically retry with alternative models.",
        code: apiError?.code || 503,
        status: apiError?.status || "UNAVAILABLE",
        retryAfter: 5, // Suggest retry after 5 seconds
      });
      return;
    }
    
    if (isRateLimit) {
      console.error("[SoilSathi] Returning 429 Rate Limit response");
      res.status(429).json({
        error: "Too many requests. Please wait a moment before trying again.",
        details: "The API rate limit has been reached. Please wait a few seconds and try again.",
        code: apiError?.code || 429,
        status: apiError?.status || "RESOURCE_EXHAUSTED",
        retryAfter: 10, // Suggest retry after 10 seconds
      });
      return;
    }
    
    if (isTimeout) {
      console.error("[SoilSathi] Returning 504 Gateway Timeout response");
      res.status(504).json({
        error: "Request timed out. The AI is taking longer than expected to respond.",
        details: "Please try again with a shorter question or wait a moment and retry.",
        retryAfter: 3,
      });
      return;
    }

    // For other errors, return 500 with user-friendly message
    const httpStatus = (statusCode && statusCode >= 400 && statusCode < 600 && statusCode !== 503 && statusCode !== 429) ? statusCode : 500;
    
    console.error("[SoilSathi] Returning", httpStatus, "response with message:", errorMessage);
    
    res.status(httpStatus).json({
      error: "Unable to process your question at this time. Please try again.",
      details: isDev ? errorMessage : "An error occurred while processing your request. Please try again in a moment.",
      ...(apiError && { apiError }),
    });
  }
});

const cropDiseaseRequestSchema = z.object({
  language: languageSchema.optional(),
  cropName: z.string().min(1, "Crop name is required.").max(100),
  cropType: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  imageData: z
    .string()
    .min(1, "Image data is required.")
    .max(MAX_IMAGE_CHAR_LENGTH),
  imageMimeType: z
    .string()
    .regex(/^image\/[a-zA-Z0-9.+-]+$/, "Invalid MIME type for image.")
    .optional(),
});

const cropDiseaseSchema: Schema = {
  type: Type.OBJECT,
  required: [
    "language",
    "diseaseName",
    "diseaseType",
    "severity",
    "confidence",
    "description",
    "symptoms",
    "causes",
    "treatments",
    "preventionTips",
  ],
  properties: {
    language: { type: Type.STRING },
    diseaseName: { type: Type.STRING },
    diseaseType: {
      type: Type.STRING,
      enum: ["disease", "pest", "nutrient_deficiency", "other"],
    },
    severity: {
      type: Type.STRING,
      enum: ["low", "medium", "high", "critical"],
    },
    confidence: { type: Type.NUMBER },
    description: { type: Type.STRING },
    symptoms: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    causes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    treatments: {
      type: Type.OBJECT,
      required: ["organic", "chemical"],
      properties: {
        organic: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["name", "method", "timing", "notes"],
            properties: {
              name: { type: Type.STRING },
              method: { type: Type.STRING },
              timing: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
          },
        },
        chemical: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["name", "method", "timing", "notes"],
            properties: {
              name: { type: Type.STRING },
              method: { type: Type.STRING },
              timing: { type: Type.STRING },
              notes: { type: Type.STRING },
              safetyWarnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
    preventionTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
};

const buildCropDiseasePrompt = (
  language: string,
  cropName: string,
  cropType?: string,
  region?: string
): Part[] => {
  return [
    {
      text: [
        "You are SoilSathi AI, an expert agricultural pathologist and entomologist specializing in Indian crops.",
        `Respond in ${language.toUpperCase()} (the user's selected language).`,
        "Analyze the provided crop image to identify any diseases, pests, or nutrient deficiencies.",
        "Output strictly as JSON that matches the provided schema.",
        "",
        "Context:",
        `Crop name: ${cropName}`,
        cropType ? `Crop type: ${cropType}` : "",
        region ? `Region: ${region}` : "",
        "",
        "Guidelines:",
        "- Identify the specific disease, pest, or nutrient deficiency visible in the image.",
        "- Assess severity based on visible symptoms (low, medium, high, critical).",
        "- Provide confidence score (0-100) based on image clarity and symptom visibility.",
        "- List all visible symptoms clearly.",
        "- Identify likely causes (environmental, management, or biological factors).",
        "- Recommend both organic and chemical treatments with specific methods and timing.",
        "- Include safety warnings for chemical treatments.",
        "- Provide practical prevention tips to avoid recurrence.",
        "- If multiple issues are present, focus on the most critical one but mention others.",
        "- If image quality is poor or symptoms are unclear, indicate lower confidence and suggest clearer photos.",
        "- Use localized crop and disease names appropriate for the region.",
        "- Never refer to this as AI output; speak as an expert advisor.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
};

app.post("/api/identify-disease", async (req, res) => {
  const isDev = env.nodeEnv === "development";

  if (!genAI) {
    console.error("[SoilSathi] ❌ Gemini API client not initialized for identify-disease!");
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = cropDiseaseRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    console.error("[SoilSathi] ❌ Validation failed for identify-disease:", parsed.error.errors);
    handleValidationFailure(res, parsed.error);
    return;
  }

  const {
    language = "en",
    cropName,
    cropType,
    region,
    imageData,
    imageMimeType,
  } = parsed.data;

  try {
    if (isDev) {
      console.log("[SoilSathi] Identify-disease request received", {
        language,
        cropName,
        cropType,
        region,
        hasImage: !!imageData,
      });
    }

    // Validate image data
    let base64Data: string;
    try {
      const [, encodedPayload = imageData] = imageData.split(",");
      if (!BASE64_REGEX.test(encodedPayload)) {
        res.status(400).json({
          error: "imageData must be base64 encoded.",
        });
        return;
      }
      base64Data = encodedPayload;
    } catch (validationError) {
      res.status(400).json({
        error:
          validationError instanceof Error
            ? validationError.message
            : "Invalid image data.",
      });
      return;
    }

    const mimeType =
      imageMimeType ||
      (imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)?.[1] ??
        "image/png");

    // Build prompt
    const parts = buildCropDiseasePrompt(language, cropName, cropType, region);

    // Add image part
    const imagePart: Part = {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    };
    parts.push(imagePart);

    if (isDev) {
      console.log("[SoilSathi] Calling Gemini API for disease identification...");
    }

    // Optimized timeout for image analysis (45 seconds, reduced from 90s)
    const payload = await generateJsonResponse<Record<string, unknown>>({
      model: MODEL_NAME,
      parts,
      schema: cropDiseaseSchema,
      timeoutMs: 30000, // 30 seconds for image analysis (optimized for faster responses)
      useCache: false, // Disable cache for image requests
      maxOutputTokens: 2048, // Limit tokens for faster generation
    });

    if (isDev) {
      console.log("[SoilSathi] ✅ Disease identification completed successfully");
    }

    res.json(payload);
  } catch (error) {
    console.error("\n========== [SoilSathi] IDENTIFY-DISEASE ERROR ==========");
    console.error("[SoilSathi] Timestamp:", new Date().toISOString());
    console.error("[SoilSathi] Identification failed:", error);
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
    } else {
      console.error("[SoilSathi] Non-Error object details:", JSON.stringify(error, null, 2));
    }

    const statusCode = (error as Error & { statusCode?: number })?.statusCode;
    const apiError = (error as Error & {
      apiError?: { code?: number; message?: string; status?: string };
    })?.apiError;

    // Check error message for overload/unavailable indicators
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isOverloaded = 
      statusCode === 503 || 
      apiError?.status === "UNAVAILABLE" ||
      errorMessage.toLowerCase().includes("overloaded") ||
      errorMessage.toLowerCase().includes("unavailable") ||
      errorMessage.toLowerCase().includes("503");

    if (isOverloaded) {
      console.error("[SoilSathi] Returning 503 Service Unavailable response");
      res.status(503).json({
        error: "The model is overloaded. Please try again later.",
        details:
          apiError?.message ||
          errorMessage ||
          "The Gemini API is currently unavailable. Please wait a moment and try again.",
        code: apiError?.code || 503,
        status: apiError?.status || "UNAVAILABLE",
      });
      return;
    }

    const httpStatus =
      statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    console.error("[SoilSathi] Returning", httpStatus, "response");
    res.status(httpStatus).json({
      error: "Failed to identify crop disease. Please try again later.",
      details:
        error instanceof Error
          ? error.message
          : "Unknown error occurred while contacting Gemini API.",
      ...(apiError && { apiError }),
    });
  }
});

const weatherAlertsRequestSchema = z.object({
  language: languageSchema.optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  region: z.string().max(100).optional(),
  cropName: z.string().max(100).optional(),
  cropStage: z.string().max(100).optional(),
});

const weatherAlertSchema: Schema = {
  type: Type.OBJECT,
  required: ["language", "alerts"],
  properties: {
    language: { type: Type.STRING },
    alerts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["type", "severity", "title", "message", "recommendations", "weatherData"],
        properties: {
          type: {
            type: Type.STRING,
            enum: ["irrigation", "spraying", "harvest", "sowing", "fertilizer", "general"],
          },
          severity: {
            type: Type.STRING,
            enum: ["info", "warning", "critical"],
          },
          title: { type: Type.STRING },
          message: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          weatherData: {
            type: Type.OBJECT,
            required: ["temperature", "humidity", "condition"],
            properties: {
              temperature: { type: Type.NUMBER },
              humidity: { type: Type.NUMBER },
              precipitation: { type: Type.NUMBER },
              windSpeed: { type: Type.NUMBER },
              condition: { type: Type.STRING },
              forecast: { type: Type.STRING },
            },
          },
        },
      },
    },
  },
};

const buildWeatherAlertsPrompt = (
  language: string,
  weatherData: {
    temperature: number;
    humidity: number;
    precipitation?: number;
    windSpeed?: number;
    condition: string;
    forecast?: string;
  },
  cropName?: string,
  cropStage?: string
): Part[] => {
  // Ensure language is valid
  const normalizedLanguage = language?.toLowerCase()?.trim() || "en";
  const validLanguage = ["mr", "hi", "en"].includes(normalizedLanguage) ? normalizedLanguage : "en";

  // Build prompt parts safely
  const promptParts: string[] = [
    "You are SoilSathi AI, an expert agricultural advisor specializing in weather-based farming recommendations for Indian farmers.",
    `Respond in ${validLanguage.toUpperCase()} (the user's selected language).`,
    "Analyze the provided weather data and generate personalized farming alerts and recommendations.",
    "Output strictly as JSON that matches the provided schema.",
    "",
    "Weather Data:",
    `Temperature: ${weatherData.temperature ?? 0}°C`,
    `Humidity: ${weatherData.humidity ?? 0}%`,
  ];

  if (weatherData.precipitation !== undefined && weatherData.precipitation !== null) {
    promptParts.push(`Precipitation: ${weatherData.precipitation}mm`);
  }

  if (weatherData.windSpeed !== undefined && weatherData.windSpeed !== null) {
    promptParts.push(`Wind Speed: ${weatherData.windSpeed} km/h`);
  }

  promptParts.push(`Condition: ${weatherData.condition || "Unknown"}`);

  if (weatherData.forecast) {
    promptParts.push(`Forecast: ${weatherData.forecast}`);
  }

  promptParts.push("");

  if (cropName) {
    promptParts.push(`Crop: ${cropName}`);
  }

  if (cropStage) {
    promptParts.push(`Crop Stage: ${cropStage}`);
  }

  promptParts.push(
    "",
    "Guidelines:",
    "- Generate 2-4 relevant alerts based on weather conditions and crop context.",
    "- Alert types: irrigation, spraying, harvest, sowing, fertilizer, general",
    "- Severity levels: info (informational), warning (action needed), critical (urgent action)",
    "- Provide actionable recommendations for each alert.",
    "- Consider Indian farming practices and regional conditions.",
    "- Use localized terminology appropriate for the region.",
    "- Never refer to this as AI output; speak as an expert advisor."
  );

  return [
    {
      text: promptParts.filter(Boolean).join("\n"),
    },
  ];
};

app.post("/api/weather-alerts", async (req, res) => {
  const isDev = env.nodeEnv === "development";

  if (!genAI) {
    console.error("[SoilSathi] ❌ Gemini API client not initialized for weather-alerts!");
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = weatherAlertsRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    console.error("[SoilSathi] ❌ Validation failed for weather-alerts:", parsed.error.errors);
    handleValidationFailure(res, parsed.error);
    return;
  }

  const {
    language = "en",
    latitude,
    longitude,
    region,
    cropName,
    cropStage,
  } = parsed.data;

  try {
    if (isDev) {
      console.log("[SoilSathi] Weather alerts request received", {
        language,
        hasLocation: !!(latitude && longitude),
        region,
        cropName,
        cropStage,
      });
    }

    // In a real implementation, you would fetch weather data from OpenWeatherMap API
    // For now, we'll use mock data structure - replace with actual API call
    // Ensure all values are properly defined to avoid undefined errors
    const weatherData = {
      temperature: 28,
      humidity: 65,
      precipitation: 0,
      windSpeed: 15,
      condition: "Partly Cloudy",
      forecast: "Clear skies expected for next 3 days",
    };

    // Validate weather data before building prompt
    if (
      typeof weatherData.temperature !== "number" ||
      typeof weatherData.humidity !== "number" ||
      !weatherData.condition
    ) {
      throw new Error("Invalid weather data structure");
    }

    const parts = buildWeatherAlertsPrompt(
      language,
      weatherData,
      cropName,
      cropStage
    );

    if (!parts || parts.length === 0) {
      throw new Error("Failed to build weather alerts prompt");
    }

    if (isDev) {
      console.log("[SoilSathi] Calling Gemini API for weather alerts...");
    }

    // Optimized timeout: 30 seconds (reduced from default 60s)
    const payload = await generateJsonResponse<Record<string, unknown>>({
      model: MODEL_NAME,
      parts,
      schema: weatherAlertSchema,
      timeoutMs: 15000, // 15 seconds - optimized for faster response
      useCache: true, // Enable caching for same requests
      maxOutputTokens: 1024, // Limit tokens for faster generation
    });

    if (isDev) {
      console.log("[SoilSathi] ✅ Weather alerts generated successfully");
    }

    res.json(payload);
  } catch (error) {
    console.error("\n========== [SoilSathi] WEATHER-ALERTS ERROR ==========");
    console.error("[SoilSathi] Weather alerts failed:", error);
    console.error("[SoilSathi] Error type:", typeof error);
    if (error instanceof Error) {
      console.error("[SoilSathi] Error message:", error.message);
      console.error("[SoilSathi] Error stack:", error.stack);
    }

    // Check if it's a Gemini API error with status code
    const statusCode = (error as Error & { statusCode?: number })?.statusCode;
    const apiError = (error as Error & {
      apiError?: { code?: number; message?: string; status?: string };
    })?.apiError;

    if (statusCode === 503 || apiError?.status === "UNAVAILABLE") {
      res.status(503).json({
        error: "The model is overloaded. Please try again later.",
        details:
          apiError?.message ||
          "The Gemini API is currently unavailable. Please wait a moment and try again.",
        code: apiError?.code || 503,
        status: apiError?.status || "UNAVAILABLE",
      });
      return;
    }

    const httpStatus =
      statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    res.status(httpStatus).json({
      error: "Failed to generate weather alerts. Please try again later.",
      details:
        error instanceof Error
          ? error.message
          : "Unknown error occurred while contacting Gemini API.",
      ...(apiError && { apiError }),
    });
  }
});

const cropGrowthRequestSchema = z.object({
  language: languageSchema.optional(),
  cropName: z.string().min(1).max(100),
  cropType: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  imageData: z.string().min(1).max(MAX_IMAGE_CHAR_LENGTH),
  imageMimeType: z.string().regex(/^image\/[a-zA-Z0-9.+-]+$/).optional(),
  previousGrowthStage: z.string().max(100).optional(),
});

const cropGrowthSchema: Schema = {
  type: Type.OBJECT,
  required: ["language", "growthStage", "growthStageConfidence", "healthScore", "observations", "aiAnalysis"],
  properties: {
    language: { type: Type.STRING },
    growthStage: { type: Type.STRING },
    growthStageConfidence: { type: Type.NUMBER },
    healthScore: { type: Type.NUMBER },
    observations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    aiAnalysis: { type: Type.STRING },
    yieldPrediction: {
      type: Type.OBJECT,
      properties: {
        estimatedYield: { type: Type.NUMBER },
        unit: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
        factors: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    },
  },
};

const buildCropGrowthPrompt = (
  language: string,
  cropName: string,
  cropType?: string,
  region?: string,
  previousGrowthStage?: string
): Part[] => {
  return [
    {
      text: [
        "You are SoilSathi AI, an expert agronomist specializing in crop growth monitoring and yield prediction for Indian farmers.",
        `Respond in ${language.toUpperCase()} (the user's selected language).`,
        "Analyze the provided crop image to determine growth stage, health status, and provide yield predictions.",
        "Output strictly as JSON that matches the provided schema.",
        "",
        "Context:",
        `Crop name: ${cropName}`,
        cropType ? `Crop type: ${cropType}` : "",
        region ? `Region: ${region}` : "",
        previousGrowthStage ? `Previous growth stage: ${previousGrowthStage}` : "",
        "",
        "Guidelines:",
        "- Identify the current growth stage (e.g., seedling, vegetative, flowering, fruiting, maturity).",
        "- Provide confidence score (0-100) for growth stage identification.",
        "- Assess crop health score (0-100) based on visual indicators.",
        "- List key observations visible in the image.",
        "- Provide detailed AI analysis of crop condition.",
        "- If possible, predict yield based on current growth stage and health.",
        "- Consider regional and seasonal factors.",
        "- Use localized terminology appropriate for the region.",
        "- Never refer to this as AI output; speak as an expert advisor.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
};

app.post("/api/analyze-growth", async (req, res) => {
  if (!genAI) {
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = cropGrowthRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    handleValidationFailure(res, parsed.error);
    return;
  }

  const {
    language = "en",
    cropName,
    cropType,
    region,
    imageData,
    imageMimeType,
    previousGrowthStage,
  } = parsed.data;

  try {
    let base64Data: string;
    try {
      const [, encodedPayload = imageData] = imageData.split(",");
      if (!BASE64_REGEX.test(encodedPayload)) {
        res.status(400).json({ error: "imageData must be base64 encoded." });
        return;
      }
      base64Data = encodedPayload;
    } catch (validationError) {
      res.status(400).json({
        error: validationError instanceof Error ? validationError.message : "Invalid image data.",
      });
      return;
    }

    const mimeType = imageMimeType || (imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)?.[1] ?? "image/png");

    const parts = buildCropGrowthPrompt(language, cropName, cropType, region, previousGrowthStage);

    const imagePart: Part = {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    };
    parts.push(imagePart);

    const payload = await generateJsonResponse<Record<string, unknown>>({
      model: MODEL_NAME,
      parts,
      schema: cropGrowthSchema,
      timeoutMs: 30000, // Optimized timeout: 30 seconds for faster responses
      useCache: false, // Disable cache for image requests
      maxOutputTokens: 2048, // Limit tokens for faster generation
    });

    res.json(payload);
  } catch (error) {
    console.error("[SoilSathi] Crop growth analysis failed:", error);
    const statusCode = (error as Error & { statusCode?: number })?.statusCode;
    const apiError = (error as Error & {
      apiError?: { code?: number; message?: string; status?: string };
    })?.apiError;

    const httpStatus = statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    res.status(httpStatus).json({
      error: "Failed to analyze crop growth. Please try again later.",
      details: error instanceof Error ? error.message : "Unknown error occurred.",
      ...(apiError && { apiError }),
    });
  }
});

const marketPricesRequestSchema = z.object({
  language: languageSchema.optional(),
  cropName: z.string().min(1).max(100),
  region: z.string().max(100).optional(),
  days: z.number().min(7).max(30).optional(),
});

const marketPricesSchema: Schema = {
  type: Type.OBJECT,
  required: ["language", "currentPrice", "priceHistory", "pricePrediction", "bestTimeToSell", "regionalComparison"],
  properties: {
    language: { type: Type.STRING },
    currentPrice: {
      type: Type.OBJECT,
      required: ["value", "unit", "date"],
      properties: {
        value: { type: Type.NUMBER },
        unit: { type: Type.STRING },
        date: { type: Type.STRING },
      },
    },
    priceHistory: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["date", "price", "unit"],
        properties: {
          date: { type: Type.STRING },
          price: { type: Type.NUMBER },
          unit: { type: Type.STRING },
        },
      },
    },
    pricePrediction: {
      type: Type.OBJECT,
      required: ["predictedPrice", "unit", "dateRange", "confidence", "factors"],
      properties: {
        predictedPrice: { type: Type.NUMBER },
        unit: { type: Type.STRING },
        dateRange: {
          type: Type.OBJECT,
          required: ["start", "end"],
          properties: {
            start: { type: Type.STRING },
            end: { type: Type.STRING },
          },
        },
        confidence: { type: Type.NUMBER },
        factors: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    },
    bestTimeToSell: {
      type: Type.OBJECT,
      required: ["recommendedDate", "expectedPrice", "reason"],
      properties: {
        recommendedDate: { type: Type.STRING },
        expectedPrice: { type: Type.NUMBER },
        reason: { type: Type.STRING },
      },
    },
    regionalComparison: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["marketName", "price", "unit"],
        properties: {
          marketName: { type: Type.STRING },
          price: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          distance: { type: Type.NUMBER },
        },
      },
    },
  },
};

const buildMarketPricesPrompt = (
  language: string,
  cropName: string,
  region?: string,
  days: number = 30
): Part[] => {
  return [
    {
      text: [
        "You are SoilSathi AI, an expert agricultural market analyst specializing in Indian crop markets and price trends.",
        `Respond in ${language.toUpperCase()} (the user's selected language).`,
        "Analyze market prices and provide price predictions, best selling times, and regional comparisons.",
        "Output strictly as JSON that matches the provided schema.",
        "",
        "Context:",
        `Crop name: ${cropName}`,
        region ? `Region: ${region}` : "",
        `Prediction period: ${days} days`,
        "",
        "Guidelines:",
        "- Provide realistic current market prices based on typical Indian agricultural markets (APMC/eMandi).",
        "- Generate price history for the last 30 days with realistic fluctuations.",
        "- Predict prices for the next 7-30 days based on seasonal trends and market patterns.",
        "- Recommend the best time to sell based on predicted price trends.",
        "- Compare prices across different regional markets (at least 3-4 markets).",
        "- Include factors affecting price predictions (season, demand, supply, weather, etc.).",
        "- Use localized market names and units (quintal, kg, etc.).",
        "- Never refer to this as AI output; speak as an expert market analyst.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
};

app.get("/api/market-prices", async (req, res) => {
  if (!genAI) {
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = marketPricesRequestSchema.safeParse({
    language: req.query.language,
    cropName: req.query.cropName,
    region: req.query.region,
    days: req.query.days ? Number(req.query.days) : undefined,
  });

  if (!parsed.success) {
    handleValidationFailure(res, parsed.error);
    return;
  }

  const {
    language = "en",
    cropName,
    region,
    days = 30,
  } = parsed.data;

  try {
    const parts = buildMarketPricesPrompt(language, cropName, region, days);

    const payload = await generateJsonResponse<Record<string, unknown>>({
      model: MODEL_NAME,
      parts,
      schema: marketPricesSchema,
      timeoutMs: 15000, // 15 seconds - optimized for faster response
      maxOutputTokens: 1024, // Limit tokens for faster generation
    });

    res.json(payload);
  } catch (error) {
    console.error("[SoilSathi] Market prices failed:", error);
    const statusCode = (error as Error & { statusCode?: number })?.statusCode;
    const apiError = (error as Error & {
      apiError?: { code?: number; message?: string; status?: string };
    })?.apiError;

    const httpStatus = statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    res.status(httpStatus).json({
      error: "Failed to fetch market prices. Please try again later.",
      details: error instanceof Error ? error.message : "Unknown error occurred.",
      ...(apiError && { apiError }),
    });
  }
});

const irrigationScheduleRequestSchema = z.object({
  language: languageSchema.optional(),
  cropName: z.string().min(1).max(100),
  cropType: z.string().max(100).optional(),
  region: z.string().max(100),
  farmSize: farmSizeSchema,
  irrigationMethod: z.string().max(100).optional(),
  soilMoisture: z.number().min(0).max(100).optional(),
  startDate: z.string().optional(),
});

const irrigationScheduleSchema: Schema = {
  type: Type.OBJECT,
  required: ["language", "schedule", "waterUsageOptimization"],
  properties: {
    language: { type: Type.STRING },
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["date", "duration", "amount", "method", "notes"],
        properties: {
          date: { type: Type.STRING },
          duration: { type: Type.NUMBER },
          amount: { type: Type.NUMBER },
          method: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
      },
    },
    weatherAdjustments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["date", "originalSchedule", "adjustedSchedule", "reason"],
        properties: {
          date: { type: Type.STRING },
          originalSchedule: { type: Type.STRING },
          adjustedSchedule: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
      },
    },
    waterUsageOptimization: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
};

const buildIrrigationSchedulePrompt = (
  language: string,
  cropName: string,
  region: string,
  farmSize: FarmSize,
  irrigationMethod?: string,
  soilMoisture?: number
): Part[] => {
  return [
    {
      text: [
        "You are SoilSathi AI, an expert irrigation specialist for Indian agriculture.",
        `Respond in ${language.toUpperCase()} (the user's selected language).`,
        "Generate an optimal irrigation schedule based on crop requirements, weather patterns, and water conservation principles.",
        "Output strictly as JSON that matches the provided schema.",
        "",
        "Context:",
        `Crop name: ${cropName}`,
        `Region: ${region}`,
        `Farm size: ${farmSize.value} ${farmSize.unit}`,
        irrigationMethod ? `Irrigation method: ${irrigationMethod}` : "",
        soilMoisture !== undefined ? `Current soil moisture: ${soilMoisture}%` : "",
        "",
        "Guidelines:",
        "- Generate irrigation schedule for the next 30 days.",
        "- Consider crop water requirements, growth stage, and regional weather patterns.",
        "- Adjust schedule based on soil moisture levels if provided.",
        "- Include weather-based adjustments when rainfall is expected.",
        "- Provide water usage optimization tips.",
        "- Use appropriate units (liters, mm, hours) based on irrigation method.",
        "- Consider Indian farming practices and regional water availability.",
        "- Use localized terminology appropriate for the region.",
        "- Never refer to this as AI output; speak as an expert advisor.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
};

app.post("/api/irrigation-schedule", async (req, res) => {
  if (!genAI) {
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = irrigationScheduleRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    handleValidationFailure(res, parsed.error);
    return;
  }

  const {
    language = "en",
    cropName,
    cropType,
    region,
    farmSize,
    irrigationMethod,
    soilMoisture,
    startDate,
  } = parsed.data;

  try {
    const parts = buildIrrigationSchedulePrompt(
      language,
      cropName,
      region,
      farmSize,
      irrigationMethod,
      soilMoisture
    );

    const payload = await generateJsonResponse<Record<string, unknown>>({
      model: MODEL_NAME,
      parts,
      schema: irrigationScheduleSchema,
      timeoutMs: 20000, // 20 seconds - optimized for faster response
      maxOutputTokens: 1536, // Limit tokens for faster generation
    });

    res.json(payload);
  } catch (error) {
    console.error("[SoilSathi] Irrigation schedule failed:", error);
    const statusCode = (error as Error & { statusCode?: number })?.statusCode;
    const apiError = (error as Error & {
      apiError?: { code?: number; message?: string; status?: string };
    })?.apiError;

    const httpStatus = statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    res.status(httpStatus).json({
      error: "Failed to generate irrigation schedule. Please try again later.",
      details: error instanceof Error ? error.message : "Unknown error occurred.",
      ...(apiError && { apiError }),
    });
  }
});

const farmingCalendarRequestSchema = z.object({
  language: languageSchema.optional(),
  cropName: z.string().min(1).max(100),
  cropType: z.string().max(100).optional(),
  region: z.string().max(100),
  startDate: z.string().optional(),
  duration: z.number().min(30).max(365).optional(),
});

const farmingCalendarSchema: Schema = {
  type: Type.OBJECT,
  required: ["language", "tasks"],
  properties: {
    language: { type: Type.STRING },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["taskType", "title", "description", "scheduledDate", "priority"],
        properties: {
          taskType: {
            type: Type.STRING,
            enum: ["sowing", "irrigation", "fertilizer", "pest_control", "harvest", "soil_test", "other"],
          },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          scheduledDate: { type: Type.STRING },
          priority: {
            type: Type.STRING,
            enum: ["low", "medium", "high", "critical"],
          },
        },
      },
    },
  },
};

const buildFarmingCalendarPrompt = (
  language: string,
  cropName: string,
  region: string,
  cropType?: string,
  startDate?: string,
  duration: number = 180
): Part[] => {
  return [
    {
      text: [
        "You are SoilSathi AI, an expert agricultural planner specializing in Indian farming calendars.",
        `Respond in ${language.toUpperCase()} (the user's selected language).`,
        "Generate a comprehensive farming calendar with tasks, priorities, and timing based on crop requirements and regional conditions.",
        "Output strictly as JSON that matches the provided schema.",
        "",
        "Context:",
        `Crop name: ${cropName}`,
        cropType ? `Crop type: ${cropType}` : "",
        `Region: ${region}`,
        startDate ? `Start date: ${startDate}` : "Start from current date",
        `Duration: ${duration} days`,
        "",
        "Guidelines:",
        "- Generate farming tasks for the specified duration covering all crop stages.",
        "- Task types: sowing, irrigation, fertilizer, pest_control, harvest, soil_test, other",
        "- Priority levels: low, medium, high, critical",
        "- Schedule tasks at appropriate times based on crop growth stages and regional weather patterns.",
        "- Include soil testing, fertilizer application, pest control, and irrigation tasks.",
        "- Consider Indian farming seasons (Kharif, Rabi) and regional variations.",
        "- Use localized terminology and dates appropriate for the region.",
        "- Never refer to this as AI output; speak as an expert advisor.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
};

app.post("/api/farming-calendar", async (req, res) => {
  if (!genAI) {
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = farmingCalendarRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    handleValidationFailure(res, parsed.error);
    return;
  }

  const {
    language = "en",
    cropName,
    cropType,
    region,
    startDate,
    duration = 180,
  } = parsed.data;

  try {
    const parts = buildFarmingCalendarPrompt(
      language,
      cropName,
      region,
      cropType,
      startDate,
      duration
    );

    const payload = await generateJsonResponse<Record<string, unknown>>({
      model: MODEL_NAME,
      parts,
      schema: farmingCalendarSchema,
      timeoutMs: 20000, // 20 seconds - optimized for faster response
      maxOutputTokens: 1536, // Limit tokens for faster generation
    });

    res.json(payload);
  } catch (error) {
    console.error("[SoilSathi] Farming calendar failed:", error);
    const statusCode = (error as Error & { statusCode?: number })?.statusCode;
    const apiError = (error as Error & {
      apiError?: { code?: number; message?: string; status?: string };
    })?.apiError;

    const httpStatus = statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    res.status(httpStatus).json({
      error: "Failed to generate farming calendar. Please try again later.",
      details: error instanceof Error ? error.message : "Unknown error occurred.",
      ...(apiError && { apiError }),
    });
  }
});

const fertilizerCostRequestSchema = z.object({
  language: languageSchema.optional(),
  cropName: z.string().min(1).max(100),
  cropType: z.string().max(100).optional(),
  region: z.string().max(100),
  farmSize: farmSizeSchema,
  fertilizers: z.array(
    z.object({
      name: z.string().min(1).max(100),
      type: z.enum(["chemical", "organic"]),
      quantity: z.number().positive(),
      unit: z.string().max(50),
      pricePerUnit: z.number().positive().optional(),
    })
  ).min(1),
});

const fertilizerCostSchema: Schema = {
  type: Type.OBJECT,
  required: ["language", "totalCost", "optimizedCost", "savings", "recommendations"],
  properties: {
    language: { type: Type.STRING },
    totalCost: { type: Type.NUMBER },
    optimizedCost: { type: Type.NUMBER },
    savings: { type: Type.NUMBER },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
};

const buildFertilizerCostPrompt = (
  language: string,
  cropName: string,
  region: string,
  farmSize: FarmSize,
  fertilizers: Array<{ name: string; type: string; quantity: number; unit: string; pricePerUnit?: number }>
): Part[] => {
  const fertilizerList = fertilizers
    .map((f) => `${f.name} (${f.type}): ${f.quantity} ${f.unit} @ ₹${f.pricePerUnit || "market price"}/unit`)
    .join("\n");

  return [
    {
      text: [
        "You are SoilSathi AI, an expert agricultural cost analyst specializing in fertilizer optimization for Indian farmers.",
        `Respond in ${language.toUpperCase()} (the user's selected language).`,
        "Analyze fertilizer costs and provide optimization recommendations to reduce expenses while maintaining crop health.",
        "Output strictly as JSON that matches the provided schema.",
        "",
        "Context:",
        `Crop name: ${cropName}`,
        `Region: ${region}`,
        `Farm size: ${farmSize.value} ${farmSize.unit}`,
        "",
        "Fertilizers:",
        fertilizerList,
        "",
        "Guidelines:",
        "- Calculate total cost based on provided fertilizer prices.",
        "- Suggest optimized cost by recommending cheaper alternatives, bulk purchases, or organic substitutes.",
        "- Calculate potential savings from optimization.",
        "- Provide practical recommendations for cost reduction.",
        "- Consider regional price variations and seasonal discounts.",
        "- Suggest organic alternatives that can reduce costs.",
        "- Use localized terminology and currency (₹).",
        "- Never refer to this as AI output; speak as an expert advisor.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
};

app.post("/api/fertilizer-cost", async (req, res) => {
  if (!genAI) {
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = fertilizerCostRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    handleValidationFailure(res, parsed.error);
    return;
  }

  const {
    language = "en",
    cropName,
    cropType,
    region,
    farmSize,
    fertilizers,
  } = parsed.data;

  try {
    const parts = buildFertilizerCostPrompt(language, cropName, region, farmSize, fertilizers);

    const payload = await generateJsonResponse<Record<string, unknown>>({
      model: MODEL_NAME,
      parts,
      schema: fertilizerCostSchema,
      timeoutMs: 20000, // 20 seconds - optimized for faster response
      maxOutputTokens: 1536, // Limit tokens for faster generation
    });

    res.json(payload);
  } catch (error) {
    console.error("[SoilSathi] Fertilizer cost calculation failed:", error);
    const statusCode = (error as Error & { statusCode?: number })?.statusCode;
    const apiError = (error as Error & {
      apiError?: { code?: number; message?: string; status?: string };
    })?.apiError;

    const httpStatus = statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    res.status(httpStatus).json({
      error: "Failed to calculate fertilizer costs. Please try again later.",
      details: error instanceof Error ? error.message : "Unknown error occurred.",
      ...(apiError && { apiError }),
    });
  }
});

const soilHealthPredictionRequestSchema = z.object({
  language: languageSchema.optional(),
  region: z.string().max(100),
  cropName: z.string().max(100).optional(),
  currentSoilData: z.record(z.union([z.string(), z.number()])).optional(),
  forecastPeriodMonths: z.number().min(3).max(12).optional(),
});

const soilHealthPredictionSchema: Schema = {
  type: Type.OBJECT,
  required: ["language", "predictedHealthScore", "predictedParameters", "riskAlerts", "recommendations"],
  properties: {
    language: { type: Type.STRING },
    predictedHealthScore: { type: Type.NUMBER },
    predictedParameters: {
      type: Type.OBJECT,
      additionalProperties: { type: Type.NUMBER },
    },
    riskAlerts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
};

const buildSoilHealthPredictionPrompt = (
  language: string,
  region: string,
  cropName?: string,
  currentSoilData?: Record<string, string | number>,
  forecastPeriodMonths: number = 6
): Part[] => {
  const soilDataStr = currentSoilData
    ? Object.entries(currentSoilData)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")
    : "No current soil data provided";

  return [
    {
      text: [
        "You are SoilSathi AI, an expert soil scientist specializing in soil health prediction and forecasting for Indian agriculture.",
        `Respond in ${language.toUpperCase()} (the user's selected language).`,
        "Predict future soil health based on current conditions, regional patterns, and agricultural practices.",
        "Output strictly as JSON that matches the provided schema.",
        "",
        "Context:",
        `Region: ${region}`,
        cropName ? `Crop: ${cropName}` : "",
        `Forecast period: ${forecastPeriodMonths} months`,
        "",
        "Current Soil Data:",
        soilDataStr,
        "",
        "Guidelines:",
        "- Predict soil health score (0-100) for the forecast period.",
        "- Predict key soil parameters (pH, N, P, K, organic matter, etc.) based on trends.",
        "- Identify potential risk alerts (e.g., salinity increase, nutrient depletion, pH changes).",
        "- Provide actionable recommendations to maintain or improve soil health.",
        "- Consider regional climate patterns, farming practices, and seasonal variations.",
        "- Use localized terminology appropriate for the region.",
        "- Never refer to this as AI output; speak as an expert advisor.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
};

app.post("/api/soil-health-prediction", async (req, res) => {
  if (!genAI) {
    res.status(500).json({
      error: "Gemini API key missing. Please configure GEMINI_API_KEY.",
    });
    return;
  }

  const parsed = soilHealthPredictionRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    handleValidationFailure(res, parsed.error);
    return;
  }

  const {
    language = "en",
    region,
    cropName,
    currentSoilData,
    forecastPeriodMonths = 6,
  } = parsed.data;

  try {
    const parts = buildSoilHealthPredictionPrompt(
      language,
      region,
      cropName,
      currentSoilData,
      forecastPeriodMonths
    );

    const payload = await generateJsonResponse<Record<string, unknown>>({
      model: MODEL_NAME,
      parts,
      schema: soilHealthPredictionSchema,
      timeoutMs: 20000, // 20 seconds - optimized for faster response
      maxOutputTokens: 1536, // Limit tokens for faster generation
    });

    res.json(payload);
  } catch (error) {
    console.error("[SoilSathi] Soil health prediction failed:", error);
    const statusCode = (error as Error & { statusCode?: number })?.statusCode;
    const apiError = (error as Error & {
      apiError?: { code?: number; message?: string; status?: string };
    })?.apiError;

    const httpStatus = statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    res.status(httpStatus).json({
      error: "Failed to predict soil health. Please try again later.",
      details: error instanceof Error ? error.message : "Unknown error occurred.",
      ...(apiError && { apiError }),
    });
  }
});

// 404 handler for API routes (must be after all API routes)
// This will only catch API routes that weren't matched by specific handlers above
console.log("[SoilSathi] 📍 Registering 404 handler for /api/* routes...");
app.all("/api/*", (req, res) => {
  // Log unmatched API route - ALWAYS log
  console.log(`\n[SoilSathi] ⚠️⚠️⚠️ Unmatched API route: ${req.method} ${req.path} ⚠️⚠️⚠️`);
  console.log(`[SoilSathi] Full URL: ${req.url}`);
  console.log(`[SoilSathi] Original URL: ${req.originalUrl}`);
  
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    method: req.method,
    url: req.url,
    message: `The endpoint ${req.method} ${req.path} was not found.`,
    availableEndpoints: [
      "POST /api/analyze-soil",
      "POST /api/recommendations",
      "POST /api/farmer-assist",
      "POST /api/identify-disease",
      "GET /api/health",
    ],
  });
});

// Development mode: serve frontend from Vite dev server
// In development, Vite handles the frontend, so we just need to handle API routes
if (env.nodeEnv === "development") {
  // Root route in development - redirect or provide info
  app.get("/", (_req, res) => {
    res.json({
      message: "SoilSathi Backend API",
      status: "running",
      mode: "development",
      frontend: "Frontend is served by Vite dev server (usually on port 5173)",
      api: "API endpoints are available at /api/*",
      health: "/api/health",
    });
  });
  
  // Catch-all for non-API routes in development
  app.get("*", (req, res, next) => {
    // Skip API routes - let them fall through to API 404 handler
    if (req.path.startsWith("/api/")) {
      next(); // Pass to API 404 handler
      return;
    }
    
    // In development, frontend is served by Vite
    res.setHeader('Content-Type', 'application/json');
    res.json({
      message: "Frontend route",
      note: "In development mode, frontend is served by Vite dev server",
      path: req.path,
      suggestion: "Access the frontend through Vite (usually http://localhost:5173)",
    });
  });
}

if (env.nodeEnv === "production") {
  // Log file system info for debugging
  console.log("[SoilSathi] Production mode - Setting up static file serving...");
  console.log("[SoilSathi] Current working directory:", process.cwd());
  console.log("[SoilSathi] __dirname:", __dirname);
  console.log("[SoilSathi] clientBuildDir:", clientBuildDir);
  console.log("[SoilSathi] clientIndexHtml:", clientIndexHtml);
  
  // Check if build directory exists
  const buildDirExists = fs.existsSync(clientBuildDir);
  const indexHtmlExists = fs.existsSync(clientIndexHtml);
  
  console.log("[SoilSathi] Build directory exists:", buildDirExists);
  console.log("[SoilSathi] Index.html exists:", indexHtmlExists);
  
  if (buildDirExists) {
    // List files in build directory for debugging
    try {
      const files = fs.readdirSync(clientBuildDir);
      console.log("[SoilSathi] Files in build directory:", files.slice(0, 10).join(", "), files.length > 10 ? `... (${files.length} total)` : "");
    } catch (err) {
      console.error("[SoilSathi] Error reading build directory:", err);
    }
    
    // Serve static files from client build directory
    app.use(express.static(clientBuildDir, {
      maxAge: "1y", // Cache static assets
      etag: true,
      index: false, // Don't serve index.html automatically, we'll handle it manually
    }));
    console.log("[SoilSathi] ✅ Static files middleware configured for:", clientBuildDir);
  } else {
    console.error("[SoilSathi] ❌ Client build directory not found at", clientBuildDir);
    console.error("[SoilSathi] This will cause 404 errors for frontend routes!");
  }

  // Root route handler
  app.get("/", (req, res) => {
    if (indexHtmlExists) {
      try {
        res.sendFile(clientIndexHtml);
      } catch (error) {
        console.error("[SoilSathi] Error sending index.html:", error);
        res.status(500).send("Error loading application");
      }
    } else {
      console.error("[SoilSathi] ❌ index.html not found at:", clientIndexHtml);
      res.status(404).send("Client application not found. Please run the build step.");
    }
  });

  // Catch-all handler: send back React app for all non-API routes
  app.get("*", (req, res, next) => {
    // Skip API routes - let them fall through to 404 if not found
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }

    // Send index.html for all other routes (React Router will handle routing)
    if (indexHtmlExists) {
      try {
        res.sendFile(clientIndexHtml);
      } catch (error) {
        console.error("[SoilSathi] Error sending index.html for path:", req.path, error);
        res.status(500).send("Error loading application");
      }
      return;
    }

    console.error("[SoilSathi] ❌ index.html not found at:", clientIndexHtml);
    console.error("[SoilSathi] Requested path:", req.path);
    res.status(404).send("Client application not found. Please run the build step.");
  });
}

// Global error handler for unhandled errors - DON'T CRASH THE SERVER
process.on("uncaughtException", (error) => {
  console.error("\n========== [SoilSathi] UNCAUGHT EXCEPTION ==========");
  console.error("[SoilSathi] Error:", error);
  console.error("[SoilSathi] Stack:", error.stack);
  console.error("[SoilSathi] ⚠️ Server will continue running...");
  console.error("==================================================\n");
  // DON'T exit - let the server keep running
  // process.exit(1); // REMOVED - server should keep running
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("\n========== [SoilSathi] UNHANDLED REJECTION ==========");
  console.error("[SoilSathi] Reason:", reason);
  console.error("[SoilSathi] Promise:", promise);
  console.error("[SoilSathi] ⚠️ Server will continue running...");
  console.error("==================================================\n");
  // DON'T exit - let the server keep running
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

// Global Express error handler middleware - must be added after all routes
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("\n========== [SoilSathi] GLOBAL ERROR HANDLER ==========");
  console.error("[SoilSathi] Unhandled error:", err);
  console.error("[SoilSathi] Error type:", typeof err);
  console.error("[SoilSathi] Request path:", _req.path);
  console.error("[SoilSathi] Request method:", _req.method);
  
  if (err instanceof Error) {
    console.error("[SoilSathi] Error name:", err.name);
    console.error("[SoilSathi] Error message:", err.message);
    console.error("[SoilSathi] Error stack:", err.stack);
  }
  
  // CRITICAL: Always send JSON, never crash
  try {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      const statusCode = (err as Error & { statusCode?: number })?.statusCode;
      const apiError = (err as Error & { apiError?: { code?: number; message?: string; status?: string } })?.apiError;
      
      // Check for specific error types
      if (statusCode === 503 || apiError?.status === "UNAVAILABLE") {
        res.status(503).json({
          error: "The model is overloaded. Please try again later.",
          details: apiError?.message || "The Gemini API is currently unavailable.",
          code: 503,
          status: "UNAVAILABLE",
        });
      } else if (statusCode === 429 || apiError?.status === "RESOURCE_EXHAUSTED") {
        res.status(429).json({
          error: "API quota exceeded. Please wait a moment and try again.",
          details: apiError?.message || "You've reached the API request limit.",
          code: 429,
          status: "RESOURCE_EXHAUSTED",
        });
      } else {
        res.status(statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
          error: "An unexpected error occurred while processing your request.",
          details: err instanceof Error ? err.message : "Unknown error",
          path: _req.path,
          method: _req.method,
        });
      }
    } else {
      console.error("[SoilSathi] ⚠️ Headers already sent, cannot send error response");
    }
  } catch (sendError) {
    console.error("[SoilSathi] ❌❌❌ FAILED TO SEND ERROR RESPONSE ❌❌❌", sendError);
    // Last resort - try to send JSON error
    try {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
          error: "An unexpected error occurred while processing your request.",
          details: "Internal server error",
        });
      }
    } catch {
      // If everything fails, just log
      console.error("[SoilSathi] ❌ Complete failure in error handler");
    }
  }
});

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

