import { For } from "solid-js";
import { formatBasisPoints, formatMinorUnits, type AnalyticsOverview, type GameOverview } from "~/lib/arkjet-analytics";

type Props = { overview: AnalyticsOverview };

const integer = (value: number) => new Intl.NumberFormat("en-US").format(value);

function GameCard(props: { name: string; accent: string; game: GameOverview; overview: AnalyticsOverview }) {
  const money = (value: string) => formatMinorUnits(value, props.overview.currencyDecimalPlaces, props.overview.currency);
  const rtp = () => Math.max(0, Math.min(100, (props.game.actualRtpBasisPoints ?? 0) / 100));

  return (
    <article class="game-card">
      <header class="game-card-head">
        <div><i style={{ background: props.accent }} /><div><strong>{props.name}</strong><span>Settled performance</span></div></div>
        <span class="game-ticket-count">{integer(props.game.settledWagers)} tickets</span>
      </header>
      <div class="game-money-row">
        <div><span>Handle</span><strong>{money(props.game.handleMinor)}</strong></div>
        <div><span>Gross payout</span><strong>{money(props.game.grossPayoutMinor)}</strong></div>
        <div><span>GGR</span><strong>{money(props.game.ggrMinor)}</strong></div>
      </div>
      <div class="rtp-row"><span>Actual RTP</span><strong>{formatBasisPoints(props.game.actualRtpBasisPoints)}</strong></div>
      <div class="progress-track"><i style={{ width: `${rtp()}%`, background: props.accent }} /></div>
      <footer class="game-card-foot"><span>{integer(props.game.uniquePlayers)} unique players</span><span>{formatBasisPoints(props.game.actualHouseEdgeBasisPoints)} house edge</span></footer>
    </article>
  );
}

export default function GameIntelligence(props: Props) {
  const roundTotal = () => props.overview.rounds.revealed + props.overview.rounds.cancelled;
  const width = (value: number) => `${roundTotal() && value ? Math.max(1, (value / roundTotal()) * 100) : 0}%`;
  const rounds = () => [
    { label: "Random crashes", value: props.overview.rounds.randomCrashes, color: "#3267e3" },
    { label: "Liquidity crashes", value: props.overview.rounds.liquidityCrashes, color: "#f59e42" },
    { label: "Cancelled", value: props.overview.rounds.cancelled, color: "#e45858" },
  ];

  return (
    <div class="game-layout">
      <div class="game-comparison">
        <GameCard name="Arkjet" accent="#3267e3" game={props.overview.arkjet} overview={props.overview} />
        <GameCard name="Chicken Cross" accent="#10a878" game={props.overview.chicken} overview={props.overview} />
      </div>
      <article class="panel round-panel">
        <header class="panel-head"><div><strong>Round resolution</strong><span>Authoritative outcome distribution</span></div><b>{integer(props.overview.rounds.revealed)} revealed</b></header>
        <div class="round-bar" aria-label="Round outcome distribution">
          <For each={rounds()}>{item => <i title={`${item.label}: ${integer(item.value)}`} style={{ width: width(item.value), background: item.color }} />}</For>
        </div>
        <div class="round-stats">
          <div><span>Total completed</span><strong>{integer(roundTotal())}</strong></div>
          <For each={rounds()}>{item => <div><span><i style={{ background: item.color }} />{item.label}</span><strong>{integer(item.value)}</strong></div>}</For>
        </div>
      </article>
    </div>
  );
}
