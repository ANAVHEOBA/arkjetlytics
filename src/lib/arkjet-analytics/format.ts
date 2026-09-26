export function formatMinorUnits(
  value: string,
  decimalPlaces: number,
  currency = "USDC",
  visibleFractionDigits = 2,
): string {
  const raw = BigInt(value);
  const negative = raw < 0n;
  const absolute = negative ? -raw : raw;
  const scale = 10n ** BigInt(decimalPlaces);
  const whole = absolute / scale;
  const fraction = (absolute % scale)
    .toString()
    .padStart(decimalPlaces, "0")
    .slice(0, visibleFractionDigits)
    .padEnd(visibleFractionDigits, "0");
  const formattedWhole = new Intl.NumberFormat("en-US").format(whole);
  const decimal = visibleFractionDigits > 0 ? `.${fraction}` : "";
  return `${negative ? "-" : ""}${formattedWhole}${decimal} ${currency}`;
}

export function formatBasisPoints(value: number | null): string {
  return value === null ? "N/A" : `${(value / 100).toFixed(2)}%`;
}

export function formatDurationSeconds(value: number | null): string {
  if (value === null) return "N/A";
  if (value < 60) return `${value}s`;
  if (value < 3_600) return `${Math.floor(value / 60)}m ${value % 60}s`;
  return `${Math.floor(value / 3_600)}h ${Math.floor((value % 3_600) / 60)}m`;
}

export function formatDecimalMoney(value: string, currency = "USDC", fractionDigits = 2): string {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const formattedWhole = new Intl.NumberFormat("en-US").format(BigInt(whole || "0"));
  const visibleFraction = fraction.padEnd(fractionDigits, "0").slice(0, fractionDigits);
  return `${negative ? "-" : ""}${formattedWhole}${fractionDigits ? `.${visibleFraction}` : ""} ${currency}`;
}
