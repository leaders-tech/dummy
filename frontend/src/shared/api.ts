/*
This file sends frontend JSON requests to the backend and builds the websocket base URL.
Edit this file when API path rules, websocket URL rules, shared fetch behavior, session refresh, or API error parsing changes.
Copy the helper pattern here when you add another shared browser API helper.
*/

import type { ApiResponse } from "./types";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getApiBasePath(): string {
  const configured = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim();
  if (configured) {
    const withLeadingSlash = configured.startsWith("/") ? configured : `/${configured}`;
    return withLeadingSlash.replace(/\/+$/, "");
  }
  return "/api";
}

const apiBasePath = getApiBasePath();

async function readApiPayload<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();
  if (!text) {
    throw new ApiError(response.status, "empty_response", "Server returned an empty response.");
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new ApiError(response.status, "invalid_json", "Server returned invalid JSON.");
  }
}

async function sendPost(path: string, body: unknown): Promise<Response> {
  try {
    return await fetch(`${apiBasePath}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "network_error", "Could not reach the server. Please try again.");
  }
}

export async function postJson<T>(path: string, body: unknown = {}): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let response = await sendPost(normalizedPath, body);

  // The login cookie lives for a short time. When it runs out, ask for a new one once and repeat the request.
  // Auth endpoints are skipped so a failed refresh cannot loop forever.
  if (response.status === 401 && !normalizedPath.startsWith("/auth/")) {
    const refreshResponse = await sendPost("/auth/refresh", {});
    if (refreshResponse.ok) {
      response = await sendPost(normalizedPath, body);
    }
  }

  const payload = await readApiPayload<T>(response);
  if (!payload.ok) {
    throw new ApiError(response.status, payload.error.code, payload.error.message);
  }
  return payload.data;
}

export function getWsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}
