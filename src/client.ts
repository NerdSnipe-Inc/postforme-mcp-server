/**
 * Post for Me API HTTP Client
 *
 * Base URL : https://api.postforme.dev
 * Auth     : Bearer API key
 * Docs     : https://www.postforme.dev/
 */

export const POSTFORME_BASE_URL = "https://api.postforme.dev";

export interface PostForMeConfig {
  apiKey: string;
}

export function getConfig(): PostForMeConfig {
  const apiKey = process.env.POSTFORME_API_KEY;

  if (!apiKey) {
    throw new Error(
      "POSTFORME_API_KEY is not set. Add it to your .env file or MCP server environment config."
    );
  }

  return { apiKey };
}

export function buildHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export class PostForMeApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
    public endpoint: string
  ) {
    super(`Post for Me API Error ${status} on ${endpoint}: ${statusText}`);
    this.name = "PostForMeApiError";
  }
}

/**
 * Build a URL with query params. Supports array values (appended separately).
 */
export function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | string[] | undefined>
): string {
  let url = `${POSTFORME_BASE_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          searchParams.append(key, String(item));
        }
      } else {
        searchParams.append(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  return url;
}

export async function pfmRequest<T = unknown>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options: {
    apiKey: string;
    body?: unknown;
    params?: Record<string, string | number | boolean | string[] | undefined>;
  }
): Promise<T> {
  const { apiKey, body, params } = options;

  const url = buildUrl(path, params);

  const response = await fetch(url, {
    method,
    headers: buildHeaders(apiKey),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    let errorBody: unknown;
    try {
      errorBody = JSON.parse(text);
    } catch {
      errorBody = text;
    }
    throw new PostForMeApiError(response.status, response.statusText, errorBody, path);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/** Format a PostForMeApiError or generic error into a readable MCP tool response string */
export function formatError(error: unknown): string {
  if (error instanceof PostForMeApiError) {
    return JSON.stringify(
      {
        error: true,
        status: error.status,
        endpoint: error.endpoint,
        message: error.message,
        details: error.body,
      },
      null,
      2
    );
  }
  if (error instanceof Error) {
    return JSON.stringify({ error: true, message: error.message });
  }
  return JSON.stringify({ error: true, message: String(error) });
}
