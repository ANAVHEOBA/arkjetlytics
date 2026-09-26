import type { APIEvent } from "@solidjs/start/server";

const DEFAULT_ANALYTICS_URL = "http://127.0.0.1:8096/analytics/v1";
const DEFAULT_TIMEOUT_MS = 10_000;

type ProxyOptions = {
  cacheControl: string;
  queryParameters?: readonly string[];
};

export type AnalyticsProxyEndpoint =
  | "catalog"
  | "events"
  | "health"
  | "home"
  | "insights"
  | "overview"
  | "players"
  | "timeseries";

function analyticsOrigin(): string {
  return (process.env.ARKJET_ANALYTICS_API_URL || DEFAULT_ANALYTICS_URL).replace(
    /\/$/,
    "",
  );
}

function timeoutMilliseconds(): number {
  const configured = Number(process.env.ARKJET_ANALYTICS_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_TIMEOUT_MS;
}

function gatewayError(message: string): Response {
  return Response.json(
    {
      success: false,
      error: { code: "ANALYTICS_UNAVAILABLE", message },
    },
    { status: 502, headers: { "Cache-Control": "no-store" } },
  );
}

export async function proxyAnalyticsGet(
  endpoint: AnalyticsProxyEndpoint,
  event: APIEvent,
  options: ProxyOptions,
): Promise<Response> {
  const upstream = new URL(`${analyticsOrigin()}/${endpoint}`);
  const requestUrl = new URL(event.request.url);
  for (const parameter of options.queryParameters ?? []) {
    const value = requestUrl.searchParams.get(parameter);
    if (value !== null) upstream.searchParams.set(parameter, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMilliseconds());

  try {
    const response = await fetch(upstream, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const body = await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      headers: {
        "Cache-Control": response.ok ? options.cacheControl : "no-store",
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === "AbortError"
        ? "Arkjet analytics timed out"
        : "Arkjet analytics is unavailable";
    return gatewayError(message);
  } finally {
    clearTimeout(timeout);
  }
}
