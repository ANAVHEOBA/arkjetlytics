import type { APIEvent } from "@solidjs/start/server";
import { proxyAnalyticsGet } from "~/lib/arkjet-analytics/proxy";

export function GET(event: APIEvent): Promise<Response> {
  return proxyAnalyticsGet("players", event, {
    cacheControl: "private, max-age=5",
    queryParameters: [
      "search", "sort", "order", "limit", "cursor", "from", "to", "game", "lifecycle",
    ],
  });
}
