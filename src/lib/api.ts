const defaultBaseUrl =
  typeof window !== "undefined" ? window.location.origin : "";

const apiBaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  defaultBaseUrl;

export const buildApiUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl.replace(/\/$/, "")}${normalizedPath}`;
};

const normalizeErrorMessage = (
  response: Response,
  fallback: string
): string => {
  const statusPrefix = `HTTP ${response.status}${
    response.statusText ? ` ${response.statusText}` : ""
  }`.trim();

  return `${statusPrefix}: ${fallback}`.trim();
};

/**
 * Parse JSON response, allowing error responses to be parsed
 * @param response - The fetch Response object
 * @param allowErrorResponse - If true, will parse JSON even if response.ok is false
 */
export const parseJsonResponse = async <T>(
  response: Response,
  allowErrorResponse: boolean = false
): Promise<T> => {
  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();
  const trimmedBody = rawBody.trim();

  const ensureOk = (message: string) => {
    if (!response.ok && !allowErrorResponse) {
      throw new Error(normalizeErrorMessage(response, message));
    }
  };

  const logNonJsonResponse = () => {
    console.error("[API] Non-JSON response received.", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries()),
      body: trimmedBody.slice(0, 2_000),
    });
  };

  if (!contentType.includes("application/json")) {
    if (trimmedBody) {
      try {
        const parsedJson = JSON.parse(trimmedBody) as T;
        console.warn("[API] Parsed JSON without application/json header.", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
        ensureOk("Received a non-JSON response from the server.");
        return parsedJson;
      } catch {
        // If parsing fails, log but don't throw if allowErrorResponse is true
        if (!allowErrorResponse) {
          logNonJsonResponse();
        }
      }
    } else {
      if (!allowErrorResponse) {
        logNonJsonResponse();
      }
    }

    if (!allowErrorResponse) {
      ensureOk(trimmedBody || "Received a non-JSON response from the server.");
      throw new Error(trimmedBody || "Received a non-JSON response from the server.");
    }
    // If allowErrorResponse is true and we can't parse, return empty object
    return {} as T;
  }

  if (!trimmedBody) {
    if (!allowErrorResponse) {
      ensureOk("Received an empty JSON response from the server.");
      throw new Error("Received an empty JSON response from the server.");
    }
    return {} as T;
  }

  try {
    return JSON.parse(trimmedBody) as T;
  } catch (error) {
    if (!allowErrorResponse) {
      ensureOk(
        error instanceof Error ? error.message : "Failed to parse server response."
      );
      throw new Error(
        normalizeErrorMessage(
          response,
          error instanceof Error ? error.message : "Failed to parse server response."
        )
      );
    }
    throw error;
  }
};

/**
 * Parse error response from API
 * Extracts error message from JSON error response
 */
export const parseErrorResponse = async (response: Response): Promise<{
  error?: string;
  details?: string;
  code?: number;
  status?: string;
}> => {
  try {
    const errorData = await parseJsonResponse<{
      error?: string;
      details?: string;
      code?: number;
      status?: string;
    }>(response, true);
    return errorData;
  } catch {
    return {
      error: `Server responded with ${response.status}`,
      details: response.statusText,
      code: response.status,
    };
  }
};


