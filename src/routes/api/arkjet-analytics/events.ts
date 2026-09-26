import type { APIEvent } from "@solidjs/start/server";
import { proxyAnalyticsGet } from "~/lib/arkjet-analytics/proxy";

export function GET(event: APIEvent): Promise<Response> {
  return proxyAnalyticsGet("events", event, {
    cacheControl: "no-store",
    queryParameters: ["event", "playerId", "game", "from", "to", "limit", "cursor"],
  });
}
