import type { APIEvent } from "@solidjs/start/server";
import { proxyAnalyticsGet } from "~/lib/arkjet-analytics/proxy";

export function GET(event: APIEvent): Promise<Response> {
  return proxyAnalyticsGet("catalog", event, {
    cacheControl: "public, max-age=300, stale-while-revalidate=3600",
  });
}
