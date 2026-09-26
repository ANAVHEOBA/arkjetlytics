# Arkjetlytics

SolidStart operator analytics for Arkjet and Chicken Cross. The dashboard uses
authoritative server data for money, gameplay, fairness, funding, reserves, and
pipeline health. Browser telemetry must never determine financial KPIs.

## Product surfaces

- `/` is the operator home with live KPIs, retention, crash distribution,
  pinned dashboards, recent reports, and suggested analysis.
- `/insights` provides time-windowed financial, game, funding, reserve, and
  player-behavior analysis.
- `/activity` exposes the canonical analytics event stream with game and event
  filters plus an event-property drawer.
- `/people` provides canonical player profiles, identity search, lifecycle
  filters, lifetime value, and behavior details.
- `/catalog` exposes the searchable registry of 256 base measures and 2,048
  approved projections.

The metric registry also defines acquisition, identity, sessions, CRM,
responsible gaming, fraud, fairness, and technical telemetry. A metric marked
`partial` or `planned` is visible in the catalog but must not be rendered as a
real chart until its authoritative source and query projection are active.

## Request flow

The browser only calls same-origin SolidStart routes:

```text
Browser
  -> /api/arkjet-analytics/*
  -> SolidStart server proxy
  -> Arkjet analytics API
  -> PostgreSQL authoritative tables and immutable analytics facts

Arkjet analytics outbox
  -> RabbitMQ ws exchange
  -> existing WS gateway topic arkjet:analytics
  -> quiet, debounced revalidation of the mounted dashboard
```

The WebSocket carries only a privacy-safe invalidation signal. Financial and
player projections are always re-read from the authoritative API. No page uses
interval polling, and an update keeps the previous successful result mounted.

Available routes:

- `GET /api/arkjet-analytics/home`
- `GET /api/arkjet-analytics/insights?from=<RFC3339>&to=<RFC3339>`
- `GET /api/arkjet-analytics/overview?from=<RFC3339>&to=<RFC3339>`
- `GET /api/arkjet-analytics/timeseries?from=<RFC3339>&to=<RFC3339>&grain=auto|hour|day`
- `GET /api/arkjet-analytics/players?search=<text>&lifecycle=<state>&limit=<n>`
- `GET /api/arkjet-analytics/events?game=<game>&event=<name>&limit=<n>`
- `GET /api/arkjet-analytics/catalog`
- `GET /api/arkjet-analytics/health`

Financial values remain integer minor-unit strings through the API. Conversion
to formatted decimal currency happens only at render time.

## Configuration

Local development defaults to Arkjet on port `8096`. Set the server-only origin
for production; do not expose the backend origin through a public `VITE_`
variable.

```env
ARKJET_ANALYTICS_API_URL=https://api.tsionark.com/v1/arkjet/analytics/v1
ARKJET_ANALYTICS_TIMEOUT_MS=10000
VITE_ARKJET_ANALYTICS_API_URL=/api/arkjet-analytics
VITE_ARKJET_ANALYTICS_WS_URL=wss://ws.tsionark.com
```

## Commands

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm dev
```

The production Node server is generated in `.output` and starts with
`pnpm start`.

## Assets

The Arkjet mark is original to this project. The bundled Inter webfont is
distributed under the SIL Open Font License 1.1; its license is included next
to the font in `public/fonts/OFL.txt`.
