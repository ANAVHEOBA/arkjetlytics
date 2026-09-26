import { createSignal, onCleanup, onMount } from "solid-js";

const ANALYTICS_TOPIC = "arkjet:analytics";
const LOCAL_GATEWAY_URL = "ws://127.0.0.1:8100";
const PRODUCTION_GATEWAY_URL = "wss://ws.tsionark.com";
const KEEPALIVE_MS = 20_000;
const MAX_RECONNECT_MS = 15_000;

export type AnalyticsLiveStatus = "connecting" | "live" | "reconnecting" | "offline";

export type AnalyticsLiveEvent = {
  eventId: string;
  eventName: string;
  game: string;
  occurredAt: string;
};

type GatewayFrame = {
  type?: string;
  topic?: string;
  data?: unknown;
  revision?: number;
};

type Subscriber = {
  onEvent?: (event: AnalyticsLiveEvent) => void;
  onResync?: () => void;
  onStatus?: (status: AnalyticsLiveStatus) => void;
};

const subscribers = new Set<Subscriber>();
let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let keepaliveTimer: number | null = null;
let reconnectDelay = 1_000;
let revision = 0;
let connectedOnce = false;
let status: AnalyticsLiveStatus = "connecting";

function gatewayUrl(): string {
  const configured = import.meta.env.VITE_ARKJET_ANALYTICS_WS_URL?.trim();
  if (configured) return configured;
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return LOCAL_GATEWAY_URL;
  }
  return PRODUCTION_GATEWAY_URL;
}

function setStatus(next: AnalyticsLiveStatus): void {
  if (status === next) return;
  status = next;
  for (const subscriber of subscribers) subscriber.onStatus?.(next);
}

function clearKeepalive(): void {
  if (keepaliveTimer !== null) window.clearInterval(keepaliveTimer);
  keepaliveTimer = null;
}

function scheduleReconnect(): void {
  if (subscribers.size === 0 || reconnectTimer !== null) return;
  setStatus(connectedOnce ? "reconnecting" : "offline");
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, reconnectDelay);
  reconnectDelay = Math.min(MAX_RECONNECT_MS, reconnectDelay * 2);
}

function subscribeFrame(): string {
  return JSON.stringify({
    type: "subscribe",
    topics: [ANALYTICS_TOPIC],
    ...(revision > 0 ? { versions: { [ANALYTICS_TOPIC]: revision } } : {}),
  });
}

function parseEvent(value: unknown): AnalyticsLiveEvent | null {
  if (value === null || typeof value !== "object") return null;
  const event = value as Record<string, unknown>;
  if (
    typeof event.eventId !== "string" ||
    typeof event.eventName !== "string" ||
    typeof event.game !== "string" ||
    typeof event.occurredAt !== "string"
  ) return null;
  return event as AnalyticsLiveEvent;
}

function connect(): void {
  if (typeof window === "undefined" || subscribers.size === 0) return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

  setStatus(connectedOnce ? "reconnecting" : "connecting");
  const connection = new WebSocket(gatewayUrl());
  socket = connection;

  connection.onopen = () => {
    if (socket !== connection) return;
    reconnectDelay = 1_000;
    connection.send(subscribeFrame());
    clearKeepalive();
    keepaliveTimer = window.setInterval(() => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(JSON.stringify({ type: "ping", sentAt: Date.now() }));
      }
    }, KEEPALIVE_MS);
  };

  connection.onmessage = message => {
    let frame: GatewayFrame;
    try {
      frame = JSON.parse(String(message.data)) as GatewayFrame;
    } catch {
      return;
    }

    if (frame.type === "subscribed") {
      const reconnect = connectedOnce;
      connectedOnce = true;
      setStatus("live");
      if (reconnect) for (const subscriber of subscribers) subscriber.onResync?.();
      return;
    }
    if (frame.type === "resync") {
      const data = frame.data as { topic?: unknown } | null;
      if (data?.topic === ANALYTICS_TOPIC) {
        for (const subscriber of subscribers) subscriber.onResync?.();
      }
      return;
    }
    if (frame.topic !== ANALYTICS_TOPIC || frame.type !== "analyticsEvent") return;
    if (typeof frame.revision === "number" && Number.isSafeInteger(frame.revision)) {
      revision = Math.max(revision, frame.revision);
    }
    const event = parseEvent(frame.data);
    if (event) for (const subscriber of subscribers) subscriber.onEvent?.(event);
  };

  connection.onerror = () => connection.close();
  connection.onclose = () => {
    if (socket !== connection) return;
    socket = null;
    clearKeepalive();
    scheduleReconnect();
  };
}

function subscribe(subscriber: Subscriber): () => void {
  subscribers.add(subscriber);
  subscriber.onStatus?.(status);
  connect();
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size > 0) return;
    if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
    clearKeepalive();
    const active = socket;
    socket = null;
    active?.close(1000, "analytics view closed");
  };
}

export function useAnalyticsLiveStatus() {
  const [liveStatus, setLiveStatus] = createSignal<AnalyticsLiveStatus>("connecting");
  onMount(() => {
    const unsubscribe = subscribe({ onStatus: setLiveStatus });
    onCleanup(unsubscribe);
  });
  return liveStatus;
}

export function useAnalyticsRealtime(
  refresh: () => unknown | Promise<unknown>,
  options: { debounceMs?: number; enabled?: () => boolean } = {},
): void {
  let timer: number | null = null;
  let refreshing = false;
  let queued = false;

  const run = async () => {
    if (refreshing) {
      queued = true;
      return;
    }
    refreshing = true;
    try {
      await refresh();
    } catch {
      // Solid resources retain the error for the page to render. The socket
      // loop must stay alive and wait for the next authoritative event.
    } finally {
      refreshing = false;
      if (queued) {
        queued = false;
        schedule();
      }
    }
  };
  const schedule = () => {
    if (options.enabled && !options.enabled()) return;
    if (refreshing) {
      queued = true;
      return;
    }
    // Keep the first scheduled refresh. Resetting this timer for every event
    // would starve the dashboard while a busy game emits continuously.
    if (timer !== null) return;
    timer = window.setTimeout(() => {
      timer = null;
      void run();
    }, options.debounceMs ?? 300);
  };

  onMount(() => {
    const unsubscribe = subscribe({
      onEvent: schedule,
      onResync: schedule,
    });
    onCleanup(() => {
      unsubscribe();
      if (timer !== null) window.clearTimeout(timer);
    });
  });
}
