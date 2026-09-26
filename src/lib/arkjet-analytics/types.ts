export type AnalyticsRangeParams = {
  /** Inclusive RFC3339 timestamp. Defaults to 24 hours before `to`. */
  from?: string;
  /** Exclusive RFC3339 timestamp. Defaults to the current time. */
  to?: string;
};

export type AnalyticsSeriesParams = AnalyticsRangeParams & {
  grain?: "auto" | "hour" | "day";
};

export type AnalyticsListParams = AnalyticsRangeParams & {
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  cursor?: string;
  game?: "arkjet" | "chicken" | "platform";
  lifecycle?: "registered" | "new" | "active" | "returning" | "inactive";
  event?: string;
  playerId?: string;
};

export type GameOverview = {
  settledWagers: number;
  uniquePlayers: number;
  handleMinor: string;
  grossPayoutMinor: string;
  ggrMinor: string;
  actualRtpBasisPoints: number | null;
  actualHouseEdgeBasisPoints: number | null;
};

export type AnalyticsOverview = {
  range: { from: string; to: string };
  currency: string;
  currencyDecimalPlaces: number;
  arkjet: GameOverview;
  chicken: GameOverview;
  combined: GameOverview;
  rounds: {
    revealed: number;
    cancelled: number;
    randomCrashes: number;
    liquidityCrashes: number;
  };
  funding: {
    creditedDeposits: number;
    creditedDepositMinor: string;
    broadcastedWithdrawals: number;
    broadcastedWithdrawalMinor: string;
    failedWithdrawals: number;
    pendingWithdrawals: number;
  };
  solvency: {
    custodyAssetsMinor: string;
    playerLiabilityMinor: string;
    operatorReserveMinor: string;
    chickenReserveMinor: string;
    custodySurplusMinor: string;
    custodyCoverageBasisPoints: number | null;
  };
  pipeline: {
    recordedEvents: number;
    pendingEvents: number;
    publishedEvents: number;
    failedEvents: number;
    oldestPendingAgeSeconds: number | null;
  };
};

export type AnalyticsSeriesPoint = {
  bucket: string;
  arkjet: GameOverview;
  chicken: GameOverview;
  combined: GameOverview;
};

export type AnalyticsTimeSeries = {
  range: { from: string; to: string };
  grain: "hour" | "day";
  currency: string;
  currencyDecimalPlaces: number;
  points: AnalyticsSeriesPoint[];
};

export type MetricStatus = "active" | "partial" | "planned";

export type MetricDefinition = {
  metricId: string;
  family: string;
  title: string;
  unit: string;
  aggregation: string;
  accuracyClass: string;
  privacyClass: string;
  businessOwner: string;
  technicalOwner: string;
  sourceEvents: string[];
  allowedGrains: string[];
  allowedDimensions: string[];
  projections: string[];
  freshnessSloSeconds: number;
  status: MetricStatus;
};

export type MetricCatalog = {
  registryVersion: string;
  baseMeasureCount: number;
  approvedProjectionCount: number;
  activeMeasureCount: number;
  partialMeasureCount: number;
  plannedMeasureCount: number;
  metrics: MetricDefinition[];
};

export type AnalyticsFreshness = {
  checkedAt: string;
  latestEventAt: string | null;
  latestPublishedAt: string | null;
  latestRecordedAt: string | null;
};

export type SavedReport = {
  reportId: string;
  name: string;
  description: string;
  query: Record<string, unknown>;
  visualization: Record<string, unknown>;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardSummary = {
  dashboardId: string;
  name: string;
  description: string;
  pinned: boolean;
  defaultDateRange: Record<string, unknown>;
  filters: unknown[];
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsHome = {
  freshness: AnalyticsFreshness;
  preferences: {
    dateRange: Record<string, unknown>;
    defaultDashboardId: string | null;
    displaySettings: Record<string, unknown>;
    timezone: string;
    updatedAt: string;
  };
  pinnedDashboards: DashboardSummary[];
  recentReports: SavedReport[];
  trendingReports: SavedReport[];
  suggestedReports: { name: string; query: Record<string, unknown> }[];
};

export type RetentionMetric = {
  eligiblePlayers: number;
  retainedPlayers: number;
  rateBasisPoints: number | null;
};

export type DistributionBucket = {
  key: string;
  label: string;
  count: number;
};

export type AnalyticsInsights = {
  range: { from: string; to: string };
  currency: string;
  currencyDecimalPlaces: number;
  players: {
    activePlayers: number;
    newPlayers: number;
    returningPlayers: number;
    averageSettledWagersPerPlayerHundredths: number;
    medianPlayerHandleMinor: string;
    topTenPercentHandleShareBasisPoints: number;
    dayOneRetention: RetentionMetric;
    daySevenRetention: RetentionMetric;
    dayThirtyRetention: RetentionMetric;
  };
  arkjet: {
    acceptedWagers: number;
    configuredAutomaticCashoutWagers: number;
    configuredManualCashoutWagers: number;
    cashedOutWagers: number;
    lostWagers: number;
    cancelledWagers: number;
    averageCashoutMultiplierHundredths: number | null;
    p50CashoutMultiplierHundredths: number | null;
    p95CashoutMultiplierHundredths: number | null;
    averageSettlementLatencyMs: number | null;
    p95SettlementLatencyMs: number | null;
    cashoutDistribution: DistributionBucket[];
    crashDistribution: DistributionBucket[];
  };
  chicken: {
    sessionsStarted: number;
    sessionsCashedOut: number;
    sessionsLost: number;
    easySessions: number;
    mediumSessions: number;
    hardSessions: number;
    averagePathLengthHundredths: number | null;
    p95PathLengthHundredths: number | null;
    averageSettlementMultiplierHundredths: number | null;
  };
  risk: {
    maximumActionsPerPlayerMinute: number;
    playersAboveTenActionsPerMinute: number;
    maximumRoundReservedLiabilityMinor: string;
    maximumRoundRiskBudgetMinor: string;
    roundsExceedingRiskBudget: number;
    maximumChickenReservedLiabilityMinor: string;
    liquidityConstrainedOutcomes: number;
  };
  funding: {
    averageDepositCreditSeconds: number | null;
    averageWithdrawalCompletionSeconds: number | null;
    p95WithdrawalCompletionSeconds: number | null;
    oldestPendingWithdrawalSeconds: number | null;
    failureCategories: { category: string; count: number }[];
  };
  unavailableInstrumentation: {
    domain: string;
    status: string;
    sourceRequired: string;
    reason: string;
  }[];
};

export type PlayerSummary = {
  playerId: string;
  displayName: string;
  properties: Record<string, unknown>;
  distinctIds: string[];
  isIdentified: boolean;
  profileCreatedAt: string | null;
  profileUpdatedAt: string | null;
  currency: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  lifecycle: string;
  daysActive: number;
  amountDeposited: string;
  amountWithdrawn: string;
  amountWagered: string;
  amountPaidOut: string;
  playerNet: string;
  houseResult: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  cashouts: number;
  averageWager: string;
  availableBalance: string;
  lockedBalance: string;
  pendingWithdrawal: string;
  currentBalance: string;
  balanceUpdatedAt: string;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  total?: number;
};

export type AnalyticsEvent = {
  eventId: string;
  event: string;
  game: "arkjet" | "chicken" | "platform" | string;
  aggregateType: string;
  aggregateId: string;
  playerId: string | null;
  occurredAt: string;
  recordedAt: string;
  properties: Record<string, unknown>;
  measures: Record<string, unknown>;
  payload: Record<string, unknown>;
};

export type AnalyticsHealth = {
  status: string;
  database: boolean;
  queryEngine: string;
  rawSqlAllowed: boolean;
  freshness: AnalyticsFreshness;
};

export type ArkjetApiSuccess<T> = { success: true; data: T };

export type ArkjetApiError = {
  success: false;
  error: { code: string; message: string };
};
