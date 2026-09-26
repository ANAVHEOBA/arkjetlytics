import { createResource, type Accessor } from "solid-js";
import { isServer } from "solid-js/web";
import {
  getAnalyticsHome,
  getAnalyticsInsights,
  getAnalyticsOverview,
  getAnalyticsTimeSeries,
} from "./client";
import type { AnalyticsRangeParams, AnalyticsSeriesParams } from "./types";

function serializeRange(params: AnalyticsRangeParams): string {
  return JSON.stringify({ from: params.from ?? null, to: params.to ?? null });
}

export function createAnalyticsOverviewResource(
  params: Accessor<AnalyticsRangeParams> = () => ({}),
) {
  return createResource(
    () => (isServer ? false : serializeRange(params())),
    (serialized) => {
      const parsed = JSON.parse(serialized) as {
        from: string | null;
        to: string | null;
      };
      return getAnalyticsOverview({
        from: parsed.from ?? undefined,
        to: parsed.to ?? undefined,
      });
    },
  );
}

export function createAnalyticsTimeSeriesResource(
  params: Accessor<AnalyticsSeriesParams> = () => ({ grain: "auto" }),
) {
  return createResource(
    () => (isServer ? false : JSON.stringify(params())),
    serialized => getAnalyticsTimeSeries(JSON.parse(serialized) as AnalyticsSeriesParams),
  );
}

export function createAnalyticsHomeResource() {
  return createResource(
    () => !isServer,
    () => getAnalyticsHome(),
  );
}

export function createAnalyticsInsightsResource(
  params: Accessor<AnalyticsRangeParams> = () => ({}),
) {
  return createResource(
    () => (isServer ? false : serializeRange(params())),
    serialized => {
      const parsed = JSON.parse(serialized) as { from: string | null; to: string | null };
      return getAnalyticsInsights({
        from: parsed.from ?? undefined,
        to: parsed.to ?? undefined,
      });
    },
  );
}
