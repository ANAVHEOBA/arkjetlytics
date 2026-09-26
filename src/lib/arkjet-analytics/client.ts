import type {
  AnalyticsEvent,
  AnalyticsHealth,
  AnalyticsHome,
  AnalyticsInsights,
  AnalyticsListParams,
  AnalyticsOverview,
  AnalyticsRangeParams,
  AnalyticsSeriesParams,
  AnalyticsTimeSeries,
  ArkjetApiError,
  ArkjetApiSuccess,
  CursorPage,
  PlayerSummary,
} from "./types";

export type AnalyticsRequestOptions = { signal?: AbortSignal };

const configuredBaseUrl = import.meta.env.VITE_ARKJET_ANALYTICS_API_URL?.trim();
export const analyticsBaseUrl = (
  configuredBaseUrl || "/api/arkjet-analytics"
).replace(/\/$/, "");

export class AnalyticsRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AnalyticsRequestError";
    this.status = status;
    this.code = code;
  }
}

async function requestAnalytics<T>(
  path: string,
  params: Record<string, string | number | undefined> | undefined,
  options: AnalyticsRequestOptions,
): Promise<T> {
  const url = new URL(`${analyticsBaseUrl}/${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: options.signal,
  });
  const body = await response.text();
  let payload: ArkjetApiSuccess<T> | ArkjetApiError;
  try {
    payload = body
      ? (JSON.parse(body) as ArkjetApiSuccess<T> | ArkjetApiError)
      : {
          success: false,
          error: {
            code: "EMPTY_RESPONSE",
            message: `Analytics returned an empty response (${response.status})`,
          },
        };
  } catch {
    throw new AnalyticsRequestError(
      response.status,
      "INVALID_RESPONSE",
      `Analytics returned an invalid response (${response.status})`,
    );
  }

  if (!response.ok || !payload.success) {
    const error = payload.success
      ? { code: "HTTP_ERROR", message: `Request failed (${response.status})` }
      : payload.error;
    throw new AnalyticsRequestError(response.status, error.code, error.message);
  }

  return payload.data;
}

export function getAnalyticsOverview(
  params: AnalyticsRangeParams = {},
  options: AnalyticsRequestOptions = {},
): Promise<AnalyticsOverview> {
  return requestAnalytics<AnalyticsOverview>("overview", { ...params }, options);
}

export function getAnalyticsTimeSeries(
  params: AnalyticsSeriesParams = {},
  options: AnalyticsRequestOptions = {},
): Promise<AnalyticsTimeSeries> {
  return requestAnalytics<AnalyticsTimeSeries>("timeseries", { ...params }, options);
}

export function getAnalyticsHome(options: AnalyticsRequestOptions = {}): Promise<AnalyticsHome> {
  return requestAnalytics<AnalyticsHome>("home", undefined, options);
}

export function getAnalyticsInsights(
  params: AnalyticsRangeParams = {},
  options: AnalyticsRequestOptions = {},
): Promise<AnalyticsInsights> {
  return requestAnalytics<AnalyticsInsights>("insights", { ...params }, options);
}

export function getPlayers(
  params: AnalyticsListParams = {},
  options: AnalyticsRequestOptions = {},
): Promise<CursorPage<PlayerSummary>> {
  return requestAnalytics<CursorPage<PlayerSummary>>("players", { ...params }, options);
}

export function getEvents(
  params: AnalyticsListParams = {},
  options: AnalyticsRequestOptions = {},
): Promise<CursorPage<AnalyticsEvent>> {
  return requestAnalytics<CursorPage<AnalyticsEvent>>("events", { ...params }, options);
}

export function getAnalyticsHealth(options: AnalyticsRequestOptions = {}): Promise<AnalyticsHealth> {
  return requestAnalytics<AnalyticsHealth>("health", undefined, options);
}
