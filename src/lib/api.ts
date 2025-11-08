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

export const parseJsonResponse = async <T>(
  response: Response
): Promise<T> => {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      text.trim()
        ? text
        : "Received a non-JSON response from the server. Please check the API endpoint."
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    const text = await response.text();
    throw new Error(
      text.trim()
        ? text
        : error instanceof Error
          ? error.message
          : "Failed to parse server response."
    );
  }
};

