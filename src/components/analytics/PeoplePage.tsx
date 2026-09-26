import { createEffect, createResource, createSignal, For, onCleanup, Show } from "solid-js";
import { isServer } from "solid-js/web";
import {
  formatDecimalMoney,
  getPlayers,
  type AnalyticsListParams,
  type PlayerSummary,
  useAnalyticsRealtime,
} from "~/lib/arkjet-analytics";
import AppShell, { PageHeader, PlayerAvatar } from "~/components/shell/AppShell";

const count = new Intl.NumberFormat("en-US");

function compactId(value: string): string {
  if (value.length < 22) return value;
  return `${value.slice(0, 12)}…${value.slice(-7)}`;
}

function seen(value: string | null): string {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default function PeoplePage() {
  const [searchInput, setSearchInput] = createSignal("");
  const [search, setSearch] = createSignal("");
  const [sort, setSort] = createSignal("last_seen");
  const [lifecycle, setLifecycle] = createSignal("");
  const [selected, setSelected] = createSignal<PlayerSummary | null>(null);

  createEffect(() => {
    const value = searchInput();
    const timer = window.setTimeout(() => setSearch(value.trim()), 250);
    onCleanup(() => window.clearTimeout(timer));
  });

  const [players, actions] = createResource(
    () => isServer ? false : JSON.stringify({ search: search(), sort: sort(), lifecycle: lifecycle() }),
    serialized => {
      const params = JSON.parse(serialized) as { search: string; sort: string; lifecycle: string };
      return getPlayers({
        ...params,
        lifecycle: (params.lifecycle || undefined) as AnalyticsListParams["lifecycle"],
        order: "desc",
        limit: 50,
      });
    },
  );
  useAnalyticsRealtime(() => actions.refetch(), { debounceMs: 350 });

  return (
    <AppShell page="People">
      <div class="people-page">
        <PageHeader
          eyebrow="Audience"
          title="People"
          description="Understand each player as one canonical person across Privy, Decane, wallets, gameplay, and money movement."
        />

        <section class="people-toolbar">
          <label class="product-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input value={searchInput()} onInput={event => setSearchInput(event.currentTarget.value)} placeholder="Search name, email, username, wallet, or ID" /></label>
          <label><span>Lifecycle</span><select value={lifecycle()} onInput={event => setLifecycle(event.currentTarget.value)}><option value="">All players</option><option value="new">New</option><option value="active">Active</option><option value="returning">Returning</option><option value="inactive">Inactive</option><option value="registered">Registered</option></select></label>
          <label><span>Sort by</span><select value={sort()} onInput={event => setSort(event.currentTarget.value)}><option value="last_seen">Last seen</option><option value="display_name">Display name</option><option value="wagered">Amount wagered</option><option value="house_result">House result</option><option value="games_played">Games played</option><option value="current_balance">Current balance</option></select></label>
        </section>

        <Show when={players.error}><div class="product-error"><strong>Players could not be loaded.</strong><button type="button" onClick={() => void actions.refetch()}>Try again</button></div></Show>

        <section class="surface-card people-table-card">
          <header class="table-card-head"><div><strong>{count.format(players.latest?.total ?? 0)} people</strong><span>Real identities and authoritative lifetime value</span></div><span class="identified-key"><i /> Identified profile</span></header>
          <div class="product-table-scroll">
            <table class="product-table people-table">
              <thead><tr><th>Person</th><th>Lifecycle</th><th>Last seen</th><th>Wagered</th><th>House result</th><th>Games</th><th>Balance</th></tr></thead>
              <tbody>
                <Show when={players.latest} fallback={<For each={[1,2,3,4,5]}>{() => <tr class="table-skeleton"><td colSpan={7}><i /></td></tr>}</For>}>
                  {data => <For each={data().items} fallback={<tr><td class="table-empty" colSpan={7}><strong>No matching people</strong><span>Try clearing the search or lifecycle filter.</span></td></tr>}>{player => (
                    <tr tabindex="0" onClick={() => setSelected(player)} onKeyDown={event => event.key === "Enter" && setSelected(player)}>
                      <td><div class="person-cell"><PlayerAvatar name={player.displayName} seed={player.playerId} /><div><strong>{player.displayName}</strong><span>{compactId(player.playerId)}</span></div>{player.isIdentified ? <i title="Identified" /> : null}</div></td>
                      <td><span class={`lifecycle-pill ${player.lifecycle}`}>{player.lifecycle}</span></td>
                      <td>{seen(player.lastSeenAt)}</td>
                      <td><strong>{formatDecimalMoney(player.amountWagered, player.currency)}</strong></td>
                      <td class={player.houseResult.startsWith("-") ? "negative-money" : "positive-money"}>{formatDecimalMoney(player.houseResult, player.currency)}</td>
                      <td>{count.format(player.gamesPlayed)}</td>
                      <td>{formatDecimalMoney(player.currentBalance, player.currency)}</td>
                    </tr>
                  )}</For>}
                </Show>
              </tbody>
            </table>
          </div>
        </section>

        <Show when={selected()}>{player => (
          <div class="person-drawer-layer">
            <button class="drawer-scrim" type="button" aria-label="Close person details" onClick={() => setSelected(null)} />
            <aside class="person-drawer">
              <header><div class="person-drawer-title"><PlayerAvatar name={player().displayName} seed={player().playerId} size="lg" /><div><span>Person profile</span><h2>{player().displayName}</h2><p>{compactId(player().playerId)}</p></div></div><button type="button" onClick={() => setSelected(null)}>×</button></header>
              <div class="drawer-section"><h3>Lifetime value</h3><div class="drawer-stat-grid"><div><span>Wagered</span><strong>{formatDecimalMoney(player().amountWagered, player().currency)}</strong></div><div><span>Paid out</span><strong>{formatDecimalMoney(player().amountPaidOut, player().currency)}</strong></div><div><span>Deposited</span><strong>{formatDecimalMoney(player().amountDeposited, player().currency)}</strong></div><div><span>House result</span><strong>{formatDecimalMoney(player().houseResult, player().currency)}</strong></div></div></div>
              <div class="drawer-section"><h3>Behavior</h3><dl class="property-list"><div><dt>Games played</dt><dd>{count.format(player().gamesPlayed)}</dd></div><div><dt>Wins / losses</dt><dd>{player().wins} / {player().losses}</dd></div><div><dt>Cashouts</dt><dd>{player().cashouts}</dd></div><div><dt>Days active</dt><dd>{player().daysActive}</dd></div><div><dt>First seen</dt><dd>{seen(player().firstSeenAt)}</dd></div><div><dt>Last seen</dt><dd>{seen(player().lastSeenAt)}</dd></div></dl></div>
              <div class="drawer-section"><h3>Properties</h3><dl class="property-list"><For each={Object.entries(player().properties)} fallback={<div><dt>Profile</dt><dd>No properties captured</dd></div>}>{([key, value]) => <div><dt>{key.replaceAll("_", " ")}</dt><dd>{String(value)}</dd></div>}</For></dl></div>
            </aside>
          </div>
        )}</Show>
      </div>
    </AppShell>
  );
}
