import { For } from "solid-js";
import { formatBasisPoints, formatDurationSeconds, formatMinorUnits, type AnalyticsOverview } from "~/lib/arkjet-analytics";

type Props = { overview: AnalyticsOverview };
const integer = (value: number) => new Intl.NumberFormat("en-US").format(value);

export default function FinanceRisk(props: Props) {
  const money = (value: string) => formatMinorUnits(value, props.overview.currencyDecimalPlaces, props.overview.currency);
  const coverage = () => Math.max(0, Math.min(100, (props.overview.solvency.custodyCoverageBasisPoints ?? 0) / 100));
  const reserves = () => [
    ["Custody assets", money(props.overview.solvency.custodyAssetsMinor)],
    ["Player liability", money(props.overview.solvency.playerLiabilityMinor)],
    ["Operator reserve", money(props.overview.solvency.operatorReserveMinor)],
    ["Chicken reserve", money(props.overview.solvency.chickenReserveMinor)],
    ["Custody surplus", money(props.overview.solvency.custodySurplusMinor)],
  ];
  const funding = () => [
    ["Credited deposits", integer(props.overview.funding.creditedDeposits), money(props.overview.funding.creditedDepositMinor)],
    ["Broadcast withdrawals", integer(props.overview.funding.broadcastedWithdrawals), money(props.overview.funding.broadcastedWithdrawalMinor)],
    ["Failed withdrawals", integer(props.overview.funding.failedWithdrawals), "Requires review"],
    ["Pending withdrawals", integer(props.overview.funding.pendingWithdrawals), "Awaiting broadcast"],
  ];
  const pipeline = () => [
    ["Recorded", props.overview.pipeline.recordedEvents],
    ["Published", props.overview.pipeline.publishedEvents],
    ["Pending", props.overview.pipeline.pendingEvents],
    ["Failed", props.overview.pipeline.failedEvents],
  ] as const;

  return (
    <div class="finance-grid">
      <article class="panel solvency-panel">
        <header class="panel-head"><div><strong>Custody solvency</strong><span>Latest verified balance snapshot</span></div><b class={props.overview.solvency.custodyCoverageBasisPoints === null ? "neutral-text" : "healthy-text"}>{formatBasisPoints(props.overview.solvency.custodyCoverageBasisPoints)}</b></header>
        <div class="solvency-body">
          <div class="coverage-ring" style={{ background: `conic-gradient(#10a878 ${coverage()}%, #edf2f6 0)` }}><div><strong>{formatBasisPoints(props.overview.solvency.custodyCoverageBasisPoints)}</strong><span>coverage</span></div></div>
          <div class="reserve-list"><For each={reserves()}>{item => <div><span>{item[0]}</span><strong>{item[1]}</strong></div>}</For></div>
        </div>
      </article>

      <article class="panel funding-panel">
        <header class="panel-head"><div><strong>Funding operations</strong><span>Confirmed ledger movement</span></div><b>{props.overview.currency}</b></header>
        <div class="funding-grid"><For each={funding()}>{item => <div class={item[0].startsWith("Failed") && Number(item[1]) > 0 ? "warning-tile" : ""}><span>{item[0]}</span><strong>{item[1]}</strong><small>{item[2]}</small></div>}</For></div>
      </article>

      <article class="panel pipeline-panel">
        <header class="panel-head"><div><strong>Analytics pipeline</strong><span>Fact recording and broker delivery</span></div><span class={`health-chip ${props.overview.pipeline.failedEvents > 0 ? "degraded" : ""}`}>{props.overview.pipeline.failedEvents > 0 ? "Degraded" : "Healthy"}</span></header>
        <div class="pipeline-stats"><For each={pipeline()}>{item => <div><span>{item[0]}</span><strong>{integer(item[1])}</strong></div>}</For></div>
        <footer class="pipeline-foot"><span>Oldest pending event</span><strong>{formatDurationSeconds(props.overview.pipeline.oldestPendingAgeSeconds)}</strong></footer>
      </article>
    </div>
  );
}
