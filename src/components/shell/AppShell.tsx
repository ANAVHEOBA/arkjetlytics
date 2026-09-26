import { A, useLocation } from "@solidjs/router";
import { createSignal, For, type JSX } from "solid-js";
import { useAnalyticsLiveStatus } from "~/lib/arkjet-analytics";

type NavItem = {
  href: string;
  label: string;
  description: string;
  path: string;
};

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: "Analyze",
    items: [
      { href: "/", label: "Project home", description: "Workspace pulse", path: "M4 10.5 12 4l8 6.5V20H5a1 1 0 0 1-1-1v-8.5ZM9 20v-6h6v6" },
      { href: "/insights", label: "Insights", description: "Trends and game math", path: "M4 19V9m5 10V5m6 14v-7m5 7V3" },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/people", label: "People", description: "Players and value", path: "M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20m11-10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm2-3.8a3.5 3.5 0 0 1 0 6.6m2 2.2a3 3 0 0 1 3 3v2" },
    ],
  },
];

function Icon(props: { path: string; class?: string }) {
  return (
    <svg class={props.class} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={props.path} />
    </svg>
  );
}

export default function AppShell(props: { children: JSX.Element; page: string }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = createSignal(false);
  const liveStatus = useAnalyticsLiveStatus();
  const active = (href: string) => href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  return (
    <div class="product-shell">
      <button class="mobile-menu-button" type="button" aria-label="Toggle navigation" onClick={() => setMenuOpen(value => !value)}>
        <Icon path="M4 7h16M4 12h16M4 17h16" />
      </button>
      <aside class={`product-sidebar ${menuOpen() ? "open" : ""}`}>
        <A class="product-brand" href="/" onClick={() => setMenuOpen(false)}>
          <img src="/arkjet-mark.svg" alt="" width="34" height="34" />
          <span><strong>Arkjetlytics</strong><small>Product intelligence</small></span>
        </A>

        <button class="project-switcher" type="button">
          <span class="project-glyph">AJ</span>
          <span><small>Project</small><strong>Arkjet production</strong></span>
          <Icon path="m9 9 3 3 3-3m-6 6 3-3 3 3" />
        </button>

        <nav class="product-navigation" aria-label="Primary navigation">
          <For each={sections}>{section => (
            <section>
              <p>{section.label}</p>
              <For each={section.items}>{item => (
                <A class={`product-nav-item ${active(item.href) ? "active" : ""}`} href={item.href} onClick={() => setMenuOpen(false)}>
                  <Icon path={item.path} />
                  <span><strong>{item.label}</strong><small>{item.description}</small></span>
                </A>
              )}</For>
            </section>
          )}</For>
        </nav>

        <div class="product-sidebar-foot">
          <span class="connection-dot" />
          <span><strong>Live workspace</strong><small>Authoritative PostgreSQL</small></span>
        </div>
      </aside>

      <div class="product-workspace">
        <header class="product-topbar">
          <div class="topbar-crumb"><span>Arkjet production</span><b>/</b><strong>{props.page}</strong></div>
          <div class="topbar-actions">
            <span class="timezone-chip">UTC</span>
            <span class={`topbar-status ${liveStatus()}`}><i /> {liveStatus() === "live" ? "Live data" : liveStatus() === "connecting" ? "Connecting" : liveStatus() === "reconnecting" ? "Reconnecting" : "Offline"}</span>
            <div class="operator-avatar" title="Operator workspace">OP</div>
          </div>
        </header>
        <main class="product-main">{props.children}</main>
      </div>
      <button class={`mobile-scrim ${menuOpen() ? "visible" : ""}`} type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
    </div>
  );
}

export function PageHeader(props: { eyebrow?: string; title: string; description: string; actions?: () => JSX.Element }) {
  return (
    <header class="product-page-header">
      <div>
        {props.eyebrow ? <p>{props.eyebrow}</p> : null}
        <h1>{props.title}</h1>
        <span>{props.description}</span>
      </div>
      {props.actions ? <div class="page-actions">{props.actions()}</div> : null}
    </header>
  );
}

export function PlayerAvatar(props: { name: string; seed?: string; size?: "sm" | "md" | "lg" }) {
  const initials = () => props.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "?";
  const palette = ["coral", "gold", "mint", "sky", "lilac"];
  const hash = () => [...(props.seed || props.name)].reduce((total, character) => total + character.charCodeAt(0), 0);
  return <span class={`player-avatar ${palette[hash() % palette.length]} ${props.size ?? "md"}`}>{initials()}</span>;
}
