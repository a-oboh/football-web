/**
 * Consistent number formatters per design specification:
 * - Percentages to 1 decimal place (e.g. "51.2%")
 * - Expected goals (xG) to 2 decimal places (e.g. "1.62")
 * - Multipliers & Fair Odds to 2 decimal places (e.g. "1.96")
 * - Metrics (Log Loss, Brier) to 4 decimal places
 */

export function formatPct(probability: number | null | undefined, decimals = 1): string {
  if (probability === null || probability === undefined || Number.isNaN(probability)) {
    return "—";
  }
  return `${(probability * 100).toFixed(decimals)}%`;
}

export function formatXg(xg: number | null | undefined): string {
  if (xg === null || xg === undefined || Number.isNaN(xg)) {
    return "—";
  }
  return xg.toFixed(2);
}

export function formatOdds(odds: number | null | undefined): string {
  if (odds === null || odds === undefined || Number.isNaN(odds)) {
    return "—";
  }
  return odds.toFixed(2);
}

export function formatMetric(val: number | null | undefined, decimals = 4): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return "—";
  }
  return val.toFixed(decimals);
}

export function formatMultiplier(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return "1.00×";
  }
  return `${val.toFixed(2)}×`;
}
