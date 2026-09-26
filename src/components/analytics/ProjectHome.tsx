import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import {
  createAnalyticsHomeResource,
  createAnalyticsInsightsResource,
  formatBasisPoints,
  formatMinorUnits,
  useAnalyticsRealtime,
} from "~/lib/arkjet-analytics";
import AppShell, { PageHeader } from "~/components/shell/AppShell";

const number = new Intl.NumberFormat("en-US");

function relativeTime(value: string | null): string {
  if (!value) return "No data yet";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

export default function ProjectHome() {
  const [home, homeActions] = createAnalyticsHomeResource();
  const [insights, insightActions] = createAnalyticsInsightsResource();

  useAnalyticsRealtime(
    () => Promise.all([homeActions.refetch(), insightActions.refetch()]),
    { debounceMs: 350 },
  );

  return (
    <AppShell page="Project home">
      <div class="home-page">
        <PageHeader
          eyebrow="Workspace pulse"
          title="Welcome back."
          description="A concise view of player behavior, game performance, and the work your team returns to."
          actions={() => <A class="primary-action" href="/insights">Explore insights <span>→</span></A>}
        />

        <Show when={home.error || insights.error}>
          <div class="product-error" role="alert"><strong>Some live data is unavailable.</strong><span>The dashboard will keep the last successful result and retry automatically.</span></div>
        </Show>

        <Show when={insights.latest} fallback={<div class="home-kpi-grid"><For each={[1, 2, 3, 4]}>{() => <div class="home-kpi skeleton" />}</For></div>}>
          {data => {
            const settled = () => data().arkjet.acceptedWagers + data().chicken.sessionsStarted;
            const median = () => formatMinorUnits(data().players.medianPlayerHandleMinor, data().currencyDecimalPlaces, data().currency);
            return (
              <section class="home-kpi-grid" aria-label="Workspace indicators">
                <article class="home-kpi coral"><span>Active players</span><strong>{number.format(data().players.activePlayers)}</strong><small>{number.format(data().players.returningPlayers)} returning · {number.format(data().players.newPlayers)} new</small></article>
                <article class="home-kpi mint"><span>Settled plays</span><strong>{number.format(settled())}</strong><small>{number.format(data().arkjet.acceptedWagers)} Arkjet · {number.format(data().chicken.sessionsStarted)} Chicken</small></article>
                <article class="home-kpi gold"><span>Median player handle</span><strong>{median()}</strong><small>Top 10% own {formatBasisPoints(data().players.topTenPercentHandleShareBasisPoints)}</small></article>
                <article class="home-kpi sky"><span>D1 retention</span><strong>{formatBasisPoints(data().players.dayOneRetention.rateBasisPoints)}</strong><small>{number.format(data().players.dayOneRetention.retainedPlayers)} of {number.format(data().players.dayOneRetention.eligiblePlayers)} eligible</small></article>
              </section>
            );
          }}
        </Show>

        <div class="home-grid">
          <section class="home-column wide">
            <div class="block-heading"><div><p>Player behavior</p><h2>Where rounds are ending</h2></div><A href="/insights">Open analysis</A></div>
            <article class="surface-card distribution-card">
              <Show when={insights.latest} fallback={<div class="large-skeleton" />}>
                {data => {
                  const maximum = () => Math.max(1, ...data().arkjet.crashDistribution.map(bucket => bucket.count));
                  return <div class="distribution-list"><For each={data().arkjet.crashDistribution}>{bucket => (
                    <div class="distribution-row">
                      <span>{bucket.label}</span>
                      <div><i style={{ width: `${Math.max(2, bucket.count / maximum() * 100)}%` }} /></div>
                      <strong>{number.format(bucket.count)}</strong>
                    </div>
                  )}</For></div>;
                }}
              </Show>
              <footer><span>Authoritative revealed rounds</span><span>Updated from settled game facts</span></footer>
            </article>
          </section>

          <section class="home-column">
            <div class="block-heading"><div><p>Workspace</p><h2>Pinned dashboards</h2></div></div>
            <Show when={home.latest} fallback={<div class="surface-card large-skeleton" />}>
              {data => <div class="workspace-card-list"><For each={data().pinnedDashboards} fallback={<div class="empty-state"><strong>No dashboard pinned</strong><span>Pin an operations dashboard to keep it within reach.</span></div>}>{dashboard => (
                <article class="workspace-card"><div class="workspace-card-icon">▦</div><div><strong>{dashboard.name}</strong><span>{dashboard.description || "Shared analytics dashboard"}</span><small>Updated {relativeTime(dashboard.updatedAt)}</small></div><b>→</b></article>
              )}</For></div>}
            </Show>
          </section>

          <section class="home-column wide">
            <div class="block-heading"><div><p>Continue exploring</p><h2>Recent reports</h2></div><A href="/insights">View all</A></div>
            <Show when={home.latest} fallback={<div class="report-grid"><For each={[1, 2, 3]}>{() => <div class="surface-card report-card skeleton" />}</For></div>}>
              {data => <div class="report-grid"><For each={data().recentReports} fallback={<div class="surface-card empty-state"><strong>No reports yet</strong><span>Your saved analysis will appear here.</span></div>}>{report => (
                <article class="surface-card report-card"><div class="report-spark"><i /><i /><i /><i /><i /></div><span>Saved insight</span><h3>{report.name}</h3><p>{report.description || "Reusable product analysis"}</p><footer><small>{report.viewCount} views</small><b>{String(report.visualization.type ?? "chart")}</b></footer></article>
              )}</For></div>}
            </Show>
          </section>

          <section class="home-column">
            <div class="block-heading"><div><p>Start here</p><h2>Suggested analysis</h2></div></div>
            <Show when={home.latest} fallback={<div class="surface-card large-skeleton" />}>
              {data => <div class="suggestion-list"><For each={data().suggestedReports}>{(report, index) => (
                <A href="/insights"><span>0{index() + 1}</span><strong>{report.name}</strong><b>→</b></A>
              )}</For></div>}
            </Show>
          </section>
        </div>

        <Show when={home.latest}>{data => <footer class="freshness-strip"><i /><span>Latest event {relativeTime(data().freshness.latestEventAt)}</span><b>Data checked {relativeTime(data().freshness.checkedAt)}</b></footer>}</Show>
      </div>
    </AppShell>
  );
}
