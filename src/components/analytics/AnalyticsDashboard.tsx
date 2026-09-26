import { createSignal, For, Show } from "solid-js";
import {
  createAnalyticsInsightsResource,
  createAnalyticsOverviewResource,
  createAnalyticsTimeSeriesResource,
  formatBasisPoints,
  formatDurationSeconds,
  formatMinorUnits,
  type AnalyticsRangeParams,
  type DistributionBucket,
  type GameOverview,
  useAnalyticsRealtime,
} from "~/lib/arkjet-analytics";
import AppShell, { PageHeader } from "~/components/shell/AppShell";
import FinanceRisk from "./FinanceRisk";
import GameIntelligence from "./GameIntelligence";
import PerformanceChart from "./PerformanceChart";

type Preset = "24h" | "7d" | "30d" | "custom";
const count = new Intl.NumberFormat("en-US");

function rangeForPreset(preset: Preset): AnalyticsRangeParams {
  if (preset === "24h" || preset === "custom") return {};
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (preset === "7d" ? 7 : 30));
  return { from: from.toISOString(), to: to.toISOString() };
}

function KpiCard(props: { label: string; value: string; detail: string; foot: string; tone: string }) {
  return <article class={`kpi-card product-kpi ${props.tone}`}><div class="kpi-top"><span class="kpi-label">{props.label}</span><i /></div><div class="kpi-value">{props.value}</div><div class="kpi-foot"><span>{props.detail}</span><strong>{props.foot}</strong></div></article>;
}

function kpis(game: GameOverview, decimalPlaces: number, currency: string) {
  const money = (value: string) => formatMinorUnits(value, decimalPlaces, currency);
  return [
    { label: "Settled handle", value: money(game.handleMinor), detail: `${count.format(game.settledWagers)} settled tickets`, foot: `${count.format(game.uniquePlayers)} players`, tone: "coral" },
    { label: "Gross payout", value: money(game.grossPayoutMinor), detail: "Returned to players", foot: formatBasisPoints(game.actualRtpBasisPoints), tone: "mint" },
    { label: "Gross gaming revenue", value: money(game.ggrMinor), detail: "Handle minus payout", foot: formatBasisPoints(game.actualHouseEdgeBasisPoints), tone: "gold" },
    { label: "Actual RTP", value: formatBasisPoints(game.actualRtpBasisPoints), detail: "Realized return to player", foot: `${formatBasisPoints(game.actualHouseEdgeBasisPoints)} edge`, tone: "sky" },
  ];
}

function Distribution(props: { title: string; description: string; buckets: DistributionBucket[] }) {
  const maximum = () => Math.max(1, ...props.buckets.map(bucket => bucket.count));
  return <article class="surface-card behavior-card"><header><div><strong>{props.title}</strong><span>{props.description}</span></div><b>{count.format(props.buckets.reduce((total, bucket) => total + bucket.count, 0))}</b></header><div class="behavior-bars"><For each={props.buckets}>{bucket => <div><span>{bucket.label}</span><i><b style={{ width: `${Math.max(1, bucket.count / maximum() * 100)}%` }} /></i><strong>{count.format(bucket.count)}</strong></div>}</For></div></article>;
}

export default function AnalyticsDashboard() {
  const [preset, setPreset] = createSignal<Preset>("24h");
  const [customFrom, setCustomFrom] = createSignal("");
  const [customTo, setCustomTo] = createSignal("");
  const [range, setRange] = createSignal<AnalyticsRangeParams>({});
  const [overview, overviewActions] = createAnalyticsOverviewResource(range);
  const [series, seriesActions] = createAnalyticsTimeSeriesResource(() => ({ ...range(), grain: "auto" }));
  const [insights, insightActions] = createAnalyticsInsightsResource(range);

  const selectPreset = (next: Preset) => {
    setPreset(next);
    setRange(rangeForPreset(next));
  };
  const applyCustomRange = () => {
    if (!customFrom() || !customTo()) return;
    const from = new Date(`${customFrom()}T00:00:00.000Z`);
    const to = new Date(`${customTo()}T00:00:00.000Z`);
    to.setUTCDate(to.getUTCDate() + 1);
    if (from < to) setRange({ from: from.toISOString(), to: to.toISOString() });
  };
  const refresh = () => {
    void overviewActions.refetch();
    void seriesActions.refetch();
    void insightActions.refetch();
  };

  useAnalyticsRealtime(
    () => Promise.all([overviewActions.refetch(), seriesActions.refetch(), insightActions.refetch()]),
    { debounceMs: 350 },
  );

  return (
    <AppShell page="Insights">
      <div class="insights-page">
        <PageHeader
          eyebrow="Product analytics"
          title="Game performance"
          description="Explore player value, realized game math, settlement behavior, and operational risk."
          actions={() => <div class="range-switcher"><For each={["24h", "7d", "30d", "custom"] as Preset[]}>{item => <button class={preset() === item ? "active" : ""} type="button" onClick={() => selectPreset(item)}>{item}</button>}</For></div>}
        />

        <Show when={preset() === "custom"}><div class="custom-range"><label>From<input type="date" value={customFrom()} onInput={event => setCustomFrom(event.currentTarget.value)} /></label><label>To<input type="date" value={customTo()} onInput={event => setCustomTo(event.currentTarget.value)} /></label><button type="button" disabled={!customFrom() || !customTo()} onClick={applyCustomRange}>Apply range</button></div></Show>

        <Show when={overview.error || series.error || insights.error}><div class="product-error"><strong>Part of this report is unavailable.</strong><button type="button" onClick={refresh}>Try again</button></div></Show>

        <Show when={overview.latest} fallback={<div class="kpi-grid"><For each={[1,2,3,4]}>{() => <div class="kpi-card skeleton" />}</For></div>}>
          {data => <section class="kpi-grid"><For each={kpis(data().combined, data().currencyDecimalPlaces, data().currency)}>{card => <KpiCard {...card} />}</For></section>}
        </Show>

        <section class="section-block">
          <Show when={series.latest} fallback={<div class="surface-card chart-skeleton" />}>{data => <PerformanceChart series={data()} />}</Show>
        </section>

        <section class="section-block">
          <div class="block-heading"><div><p>Behavior</p><h2>How players experience the game</h2></div><span>Settled and revealed outcomes only</span></div>
          <Show when={insights.latest} fallback={<div class="behavior-grid"><div class="surface-card large-skeleton"/><div class="surface-card large-skeleton"/></div>}>
            {data => <div class="behavior-grid"><Distribution title="Cashout distribution" description="Where players locked their return" buckets={data().arkjet.cashoutDistribution} /><Distribution title="Crash distribution" description="Where revealed rounds ended" buckets={data().arkjet.crashDistribution} /></div>}
          </Show>
        </section>

        <section class="section-block">
          <div class="block-heading"><div><p>Games</p><h2>Arkjet and Chicken Cross</h2></div></div>
          <Show when={overview.latest} fallback={<div class="surface-card large-skeleton" />}>{data => <GameIntelligence overview={data()} />}</Show>
        </section>

        <section class="section-block">
          <div class="block-heading"><div><p>Money and risk</p><h2>Finance operations</h2></div></div>
          <Show when={overview.latest} fallback={<div class="surface-card large-skeleton" />}>{data => <FinanceRisk overview={data()} />}</Show>
        </section>

        <section class="section-block">
          <div class="block-heading"><div><p>Instrumentation</p><h2>Coverage gaps</h2></div><span>Honest availability, never invented data</span></div>
          <Show when={insights.latest} fallback={<div class="surface-card large-skeleton" />}>
            {data => <div class="coverage-grid"><For each={data().unavailableInstrumentation}>{item => <article class="coverage-card"><span>{item.status}</span><h3>{item.domain.replaceAll("_", " ")}</h3><p>{item.reason}</p><footer>Needs: <strong>{item.sourceRequired}</strong></footer></article>}</For></div>}
          </Show>
        </section>

        <Show when={insights.latest}>{data => <div class="insight-footnotes"><span>Average Arkjet settlement: <strong>{data().arkjet.averageSettlementLatencyMs === null ? "N/A" : `${data().arkjet.averageSettlementLatencyMs}ms`}</strong></span><span>Oldest pending withdrawal: <strong>{formatDurationSeconds(data().funding.oldestPendingWithdrawalSeconds)}</strong></span><span>Liquidity constrained outcomes: <strong>{count.format(data().risk.liquidityConstrainedOutcomes)}</strong></span></div>}</Show>
      </div>
    </AppShell>
  );
}
