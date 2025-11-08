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

export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();
  const trimmedBody = rawBody.trim();

  const ensureOk = (message: string) => {
    if (!response.ok) {
      throw new Error(normalizeErrorMessage(response, message));
    }
  };

  if (!contentType.includes("application/json")) {
    ensureOk(
      trimmedBody || "Received a non-JSON response from the server."
    );
    throw new Error(
      trimmedBody || "Received a non-JSON response from the server."
    );
  }

  if (!trimmedBody) {
    ensureOk("Received an empty JSON response from the server.");
    throw new Error("Received an empty JSON response from the server.");
  }

  try {
    return JSON.parse(trimmedBody) as T;
  } catch (error) {
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
};


