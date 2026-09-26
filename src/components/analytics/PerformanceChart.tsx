import { createMemo, createSignal, For, Show } from "solid-js";
import type { AnalyticsTimeSeries, GameOverview } from "~/lib/arkjet-analytics";

type Props = { series: AnalyticsTimeSeries };
type Game = "combined" | "arkjet" | "chicken";
type Metric = "handle" | "payout" | "ggr" | "wagers" | "players" | "rtp";

const WIDTH = 900;
const HEIGHT = 290;
const LEFT = 20;
const TOP = 18;
const BOTTOM = 36;

const metrics: { id: Metric; label: string }[] = [
  { id: "handle", label: "Handle" }, { id: "payout", label: "Payout" },
  { id: "ggr", label: "GGR" }, { id: "wagers", label: "Wagers" },
  { id: "players", label: "Players" }, { id: "rtp", label: "RTP" },
];

function valueFor(game: GameOverview, metric: Metric, decimalPlaces: number): number {
  if (metric === "handle") return Number(game.handleMinor) / 10 ** decimalPlaces;
  if (metric === "payout") return Number(game.grossPayoutMinor) / 10 ** decimalPlaces;
  if (metric === "ggr") return Number(game.ggrMinor) / 10 ** decimalPlaces;
  if (metric === "wagers") return game.settledWagers;
  if (metric === "players") return game.uniquePlayers;
  return (game.actualRtpBasisPoints ?? 0) / 100;
}

function compact(value: number, metric: Metric, currency: string): string {
  if (metric === "rtp") return `${value.toFixed(2)}%`;
  const formatted = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
  return ["handle", "payout", "ggr"].includes(metric) ? `${formatted} ${currency}` : formatted;
}

export default function PerformanceChart(props: Props) {
  const [game, setGame] = createSignal<Game>("combined");
  const [metric, setMetric] = createSignal<Metric>("handle");
  const [hovered, setHovered] = createSignal<number | null>(null);

  const values = createMemo(() => props.series.points.map(point => ({
    at: point.bucket,
    value: valueFor(point[game()], metric(), props.series.currencyDecimalPlaces),
  })));
  const geometry = createMemo(() => {
    const data = values();
    const rawMin = Math.min(0, ...data.map(point => point.value));
    const rawMax = Math.max(0, ...data.map(point => point.value));
    const spread = rawMax - rawMin || 1;
    const min = rawMin - spread * .08;
    const max = rawMax + spread * .08;
    const innerWidth = WIDTH - LEFT * 2;
    const innerHeight = HEIGHT - TOP - BOTTOM;
    const x = (index: number) => LEFT + (data.length <= 1 ? innerWidth / 2 : index / (data.length - 1) * innerWidth);
    const y = (value: number) => TOP + (max - value) / (max - min) * innerHeight;
    const points = data.map((point, index) => ({ ...point, x: x(index), y: y(point.value) }));
    const line = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
    const baseline = y(Math.max(min, Math.min(max, 0)));
    const area = points.length ? `${line} L${points.at(-1)!.x},${baseline} L${points[0]!.x},${baseline} Z` : "";
    return { min, max, points, line, area };
  });
  const latest = createMemo(() => values().at(-1)?.value ?? 0);
  const dateLabel = (timestamp: string) => new Intl.DateTimeFormat("en-US", props.series.grain === "hour" ? { month: "short", day: "numeric", hour: "numeric" } : { month: "short", day: "numeric" }).format(new Date(timestamp));
  const move = (event: PointerEvent & { currentTarget: SVGSVGElement }) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    setHovered(Math.round(ratio * Math.max(0, values().length - 1)));
  };

  return (
    <article class="panel performance-panel">
      <header class="chart-head">
        <div><span>Performance trend</span><strong>{compact(latest(), metric(), props.series.currency)}</strong><small>{props.series.grain}ly · {game()}</small></div>
        <div class="game-toggle"><For each={["combined", "arkjet", "chicken"] as Game[]}>{item => <button type="button" class={game() === item ? "active" : ""} onClick={() => setGame(item)}>{item}</button>}</For></div>
      </header>
      <div class="metric-tabs"><For each={metrics}>{item => <button type="button" class={metric() === item.id ? "active" : ""} onClick={() => setMetric(item.id)}>{item.label}</button>}</For></div>
      <Show when={geometry().points.length} fallback={<div class="chart-empty">No settled activity exists in this range.</div>}>
        <div class="chart-wrap">
          <svg class="performance-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" onPointerMove={move} onPointerLeave={() => setHovered(null)}>
            <defs><linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3267e3" stop-opacity=".25" /><stop offset="1" stop-color="#3267e3" stop-opacity="0" /></linearGradient></defs>
            <For each={[0, 1, 2, 3, 4]}>{step => <line x1={LEFT} x2={WIDTH - LEFT} y1={TOP + step * ((HEIGHT - TOP - BOTTOM) / 4)} y2={TOP + step * ((HEIGHT - TOP - BOTTOM) / 4)} class="chart-grid-line" />}</For>
            <path d={geometry().area} fill="url(#chart-area)" />
            <path d={geometry().line} class="chart-line" />
            <Show when={hovered() !== null && geometry().points[hovered()!] }>{point => <><line x1={point().x} x2={point().x} y1={TOP} y2={HEIGHT - BOTTOM} class="crosshair" /><circle cx={point().x} cy={point().y} r="5" class="chart-point" /></>}</Show>
          </svg>
          <div class="chart-y-labels"><span>{compact(geometry().max, metric(), props.series.currency)}</span><span>{compact(geometry().min, metric(), props.series.currency)}</span></div>
          <div class="chart-x-labels"><span>{dateLabel(values()[0]!.at)}</span><span>{dateLabel(values()[Math.floor(values().length / 2)]!.at)}</span><span>{dateLabel(values().at(-1)!.at)}</span></div>
          <Show when={hovered() !== null && values()[hovered()!] }>{point => <div class="chart-tooltip"><span>{dateLabel(point().at)}</span><strong>{compact(point().value, metric(), props.series.currency)}</strong></div>}</Show>
        </div>
      </Show>
    </article>
  );
}
