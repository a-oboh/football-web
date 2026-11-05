import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  Check,
  Copy,
  Download,
  Info,
  Share2,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { PredictionResponse } from "../../schemas/api";
import {
  formatMultiplier,
  formatOdds,
  formatPct,
  formatXg,
} from "../../lib/formatters";

interface PredictionResultViewProps {
  prediction: PredictionResponse;
  isReadOnlyPermalink?: boolean;
}

export function PredictionResultView({
  prediction,
  isReadOnlyPermalink = false,
}: PredictionResultViewProps) {
  const [showFullMatrix, setShowFullMatrix] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const socialCardRef = useRef<HTMLDivElement>(null);

  const shareUrl = prediction.slug
    ? `${window.location.origin}/p/${prediction.slug}`
    : window.location.href;

  const handleCopyPermalink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadSocialPng = async () => {
    if (!socialCardRef.current) return;
    setExportingPng(true);
    try {
      const dataUrl = await toPng(socialCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#020617",
      });
      const link = document.createElement("a");
      const safeHome = prediction.home_team.toLowerCase().replace(/\s+/g, "-");
      const safeAway = prediction.away_team.toLowerCase().replace(/\s+/g, "-");
      link.download = `football-engine-${safeHome}-vs-${safeAway}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExportingPng(false);
    }
  };

  const maxVisibleGoals = showFullMatrix
    ? prediction.score_matrix.max_goals
    : Math.min(5, prediction.score_matrix.max_goals);

  const maxCellProb = Math.max(
    ...prediction.score_matrix.probabilities.flat(),
    0.01
  );

  const hStr = prediction.explanation.home_team_home_strength;
  const aStr = prediction.explanation.away_team_away_strength;
  const bm = prediction.bookmaker_comparison;
  const hist = prediction.historical_context;

  // Normalize H/D/A for visual bar width
  const mass = prediction.probability_mass || 1;
  const normHome = prediction.outcome_probabilities.home_win / mass;
  const normDraw = prediction.outcome_probabilities.draw / mass;
  const normAway = prediction.outcome_probabilities.away_win / mass;

  return (
    <div className="space-y-6">
      {/* Top Reproducibility & Share Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
            {prediction.mode === "historical"
              ? "Historical Pre-Kickoff Mode"
              : prediction.mode === "upcoming"
                ? "Live Upcoming Fixture"
                : "Hypothetical State"}
          </span>
          <span className="text-xs text-slate-400">
            Competition:{" "}
            <strong className="font-mono text-slate-200">
              {prediction.competition_code}
            </strong>
          </span>
          <span className="text-xs text-slate-400">
            Seasons:{" "}
            <strong className="font-mono text-slate-200">
              {prediction.seasons_used.join(", ")}
            </strong>
          </span>
          {prediction.as_of_date && (
            <span className="text-xs text-amber-300/90">
              Cutoff: &lt;{" "}
              <strong className="font-mono">{prediction.as_of_date}</strong>
            </span>
          )}
          <span className="text-xs text-slate-500">
            Snapshot:{" "}
            <code className="text-slate-400">
              {prediction.data_snapshot_hash.slice(0, 10)}
            </code>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyPermalink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied URL
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                {prediction.slug ? `Permalink (${prediction.slug})` : "Copy Link"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
          >
            <Share2 className="h-3.5 w-3.5" />
            Social Share Card
          </button>
        </div>
      </div>

      {/* Historical Post-Match Outcome Banner (when evaluating a past fixture) */}
      {hist && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-100">
                Actual Historical Result ({hist.match_date}):{" "}
                <span className="font-mono font-bold text-amber-300">
                  {prediction.home_team} {hist.actual_home_goals} –{" "}
                  {hist.actual_away_goals} {prediction.away_team}
                </span>{" "}
                <span className="text-xs text-slate-400">
                  (Result: {hist.actual_result}
                  {hist.actual_ht_home_goals !== null &&
                  hist.actual_ht_home_goals !== undefined
                    ? `, HT: ${hist.actual_ht_home_goals}–${hist.actual_ht_away_goals}`
                    : ""}
                  )
                </span>
              </p>
              <p className="text-xs text-slate-400">
                Leakage check passed: this forecast used only the{" "}
                <span className="font-mono text-slate-200">
                  {prediction.explanation.total_league_matches}
                </span>{" "}
                matches completed strictly before{" "}
                <span className="font-mono text-slate-200">{hist.match_date}</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Matchup & Expected Goals Banner */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400 mb-4">
              <span>Matchup Expected Goals (xG)</span>
              <span className="font-mono text-slate-500">
                Model: {prediction.model_version}
              </span>
            </div>

            <div className="grid grid-cols-3 items-center gap-4 py-3 border-b border-slate-800/80">
              <div>
                <div className="text-xs text-emerald-400 font-medium mb-1">
                  HOME SIDE
                </div>
                <div className="text-xl font-bold text-slate-100 leading-tight">
                  {prediction.home_team}
                </div>
                <div className="mt-1 text-xs text-slate-400 font-mono">
                  HT xG: {formatXg(prediction.half_time.expected_goals.home)}
                </div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-baseline gap-3 rounded-xl bg-slate-950/90 px-4 py-2.5 border border-slate-800">
                  <span className="font-mono text-3xl font-bold text-emerald-400">
                    {formatXg(prediction.expected_goals.home)}
                  </span>
                  <span className="text-xs uppercase text-slate-500 font-semibold">
                    xG
                  </span>
                  <span className="font-mono text-3xl font-bold text-sky-400">
                    {formatXg(prediction.expected_goals.away)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Total Expected:{" "}
                  <span className="font-mono text-slate-200 font-semibold">
                    {formatXg(
                      prediction.expected_goals.home +
                        prediction.expected_goals.away
                    )}
                  </span>{" "}
                  goals
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-sky-400 font-medium mb-1">
                  AWAY SIDE
                </div>
                <div className="text-xl font-bold text-slate-100 leading-tight">
                  {prediction.away_team}
                </div>
                <div className="mt-1 text-xs text-slate-400 font-mono">
                  HT xG: {formatXg(prediction.half_time.expected_goals.away)}
                </div>
              </div>
            </div>
          </div>

          {/* 1X2 Outcome Probability Cards & Stacked Bar */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Full-Time 1X2 Outcome Distribution</span>
              <span className="font-mono">
                Retained Grid Mass:{" "}
                <strong className="text-slate-200">
                  {formatPct(prediction.probability_mass, 2)}
                </strong>
              </span>
            </div>

            <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-950 flex p-0.5 border border-slate-800">
              <div
                style={{ width: `${normHome * 100}%` }}
                className="bg-emerald-500 h-full rounded-l-full transition-all"
                title={`Home Win: ${formatPct(prediction.outcome_probabilities.home_win)}`}
              />
              <div
                style={{ width: `${normDraw * 100}%` }}
                className="bg-amber-400 h-full transition-all"
                title={`Draw: ${formatPct(prediction.outcome_probabilities.draw)}`}
              />
              <div
                style={{ width: `${normAway * 100}%` }}
                className="bg-sky-500 h-full rounded-r-full transition-all"
                title={`Away Win: ${formatPct(prediction.outcome_probabilities.away_win)}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3.5">
                <div className="flex items-center justify-between text-xs text-emerald-300">
                  <span className="font-semibold">1 • Home Win</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Fair {formatOdds(prediction.markets.home_win.fair_odds)}
                  </span>
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                  {formatPct(prediction.outcome_probabilities.home_win)}
                </div>
                {bm && (
                  <div className="mt-1.5 pt-1.5 border-t border-emerald-500/15 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{bm.source} Implied:</span>
                    <span className="text-slate-200">
                      {formatPct(bm.implied_home_win)} (@{formatOdds(bm.home_price)})
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-3.5">
                <div className="flex items-center justify-between text-xs text-amber-300">
                  <span className="font-semibold">X • Draw</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Fair {formatOdds(prediction.markets.draw.fair_odds)}
                  </span>
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-amber-300">
                  {formatPct(prediction.outcome_probabilities.draw)}
                </div>
                {bm && (
                  <div className="mt-1.5 pt-1.5 border-t border-amber-400/15 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{bm.source} Implied:</span>
                    <span className="text-slate-200">
                      {formatPct(bm.implied_draw)} (@{formatOdds(bm.draw_price)})
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-sky-500/25 bg-sky-500/5 p-3.5">
                <div className="flex items-center justify-between text-xs text-sky-300">
                  <span className="font-semibold">2 • Away Win</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Fair {formatOdds(prediction.markets.away_win.fair_odds)}
                  </span>
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-sky-400">
                  {formatPct(prediction.outcome_probabilities.away_win)}
                </div>
                {bm && (
                  <div className="mt-1.5 pt-1.5 border-t border-sky-500/15 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{bm.source} Implied:</span>
                    <span className="text-slate-200">
                      {formatPct(bm.implied_away_win)} (@{formatOdds(bm.away_price)})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Top Scorelines, Half-Time & Secondary Markets */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400 mb-3">
              <span>Most Likely Exact Scorelines</span>
              <span className="font-mono text-slate-500">
                HT Mode: {prediction.half_time.score.home_goals}–
                {prediction.half_time.score.away_goals} (
                {formatPct(prediction.half_time.score.probability)})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {prediction.top_scores.slice(0, 6).map((s, idx) => {
                const isHome = s.home_goals > s.away_goals;
                const isDraw = s.home_goals === s.away_goals;
                return (
                  <div
                    key={`${s.home_goals}-${s.away_goals}`}
                    className={`rounded-lg border p-2.5 flex flex-col justify-between ${
                      idx === 0
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-slate-800 bg-slate-950/60"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>#{idx + 1}</span>
                      <span
                        className={
                          isHome
                            ? "text-emerald-400"
                            : isDraw
                              ? "text-amber-300"
                              : "text-sky-400"
                        }
                      >
                        {isHome ? "HOME" : isDraw ? "DRAW" : "AWAY"}
                      </span>
                    </div>
                    <div className="my-1 font-mono text-xl font-bold text-slate-100">
                      {s.home_goals} – {s.away_goals}
                    </div>
                    <div className="font-mono text-xs text-slate-300">
                      {formatPct(s.probability)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core Derived Markets (O/U 2.5 & BTTS with Fair Odds) */}
          <div className="pt-3 border-t border-slate-800">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">
              Derived Goals Markets & No-Margin Fair Odds
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-slate-400">Over 2.5 Goals</div>
                  <div className="font-mono text-base font-bold text-slate-100">
                    {formatPct(prediction.markets.over_2_5_goals.probability)}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[11px] text-slate-500">Fair Odds</div>
                  <div className="text-slate-300 font-semibold">
                    {formatOdds(prediction.markets.over_2_5_goals.fair_odds)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-slate-400">Under 2.5 Goals</div>
                  <div className="font-mono text-base font-bold text-slate-100">
                    {formatPct(prediction.markets.under_2_5_goals.probability)}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[11px] text-slate-500">Fair Odds</div>
                  <div className="text-slate-300 font-semibold">
                    {formatOdds(prediction.markets.under_2_5_goals.fair_odds)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-slate-400">BTTS — Yes</div>
                  <div className="font-mono text-base font-bold text-slate-100">
                    {formatPct(prediction.markets.btts_yes.probability)}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[11px] text-slate-500">Fair Odds</div>
                  <div className="text-slate-300 font-semibold">
                    {formatOdds(prediction.markets.btts_yes.fair_odds)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-slate-400">BTTS — No</div>
                  <div className="font-mono text-base font-bold text-slate-100">
                    {formatPct(prediction.markets.btts_no.probability)}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[11px] text-slate-500">Fair Odds</div>
                  <div className="text-slate-300 font-semibold">
                    {formatOdds(prediction.markets.btts_no.fair_odds)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Matrix Heatmap & Explainability Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Joint Score Probability Matrix */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Joint Scoreline Probability Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Rows = Home goals ({prediction.home_team}), Columns = Away goals (
                {prediction.away_team}). Green = Home Win, Amber = Draw, Blue = Away
                Win.
              </p>
            </div>
            {prediction.score_matrix.max_goals > 5 && (
              <button
                type="button"
                onClick={() => setShowFullMatrix((prev) => !prev)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition"
              >
                {showFullMatrix
                  ? "Compact Grid (0–5)"
                  : `Full Grid (0–${prediction.score_matrix.max_goals})`}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left text-[11px] text-slate-500 border-b border-slate-800">
                    H \ A
                  </th>
                  {Array.from({ length: maxVisibleGoals + 1 }, (_, aGoals) => (
                    <th
                      key={aGoals}
                      className="p-2 text-center text-sky-400 border-b border-slate-800"
                    >
                      {aGoals}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxVisibleGoals + 1 }, (_, hGoals) => (
                  <tr key={hGoals}>
                    <th className="p-2 text-left text-emerald-400 border-r border-slate-800">
                      {hGoals}
                    </th>
                    {Array.from({ length: maxVisibleGoals + 1 }, (__, aGoals) => {
                      const prob =
                        prediction.score_matrix.probabilities[hGoals]?.[aGoals] ??
                        0;
                      const intensity = Math.min(
                        0.85,
                        Math.max(0.06, (prob / maxCellProb) * 0.75)
                      );
                      const bgColor =
                        hGoals > aGoals
                          ? `rgba(16, 185, 129, ${intensity})`
                          : hGoals === aGoals
                            ? `rgba(245, 158, 11, ${intensity})`
                            : `rgba(14, 165, 233, ${intensity})`;

                      const isActual =
                        hist &&
                        hist.actual_home_goals === hGoals &&
                        hist.actual_away_goals === aGoals;

                      return (
                        <td
                          key={aGoals}
                          style={{ backgroundColor: bgColor }}
                          className={`p-2 text-center border border-slate-900/80 transition ${
                            isActual
                              ? "ring-2 ring-amber-300 font-bold text-white"
                              : "text-slate-100"
                          }`}
                          title={`${prediction.home_team} ${hGoals} - ${aGoals} ${prediction.away_team}: ${formatPct(prob, 2)}`}
                        >
                          {formatPct(prob, 1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Explainability Inspector Panel */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>Model Explainability & Rate Decomposition</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Every expected goal value is decomposed transparently from{" "}
              <span className="font-mono text-slate-200">
                {prediction.explanation.total_league_matches}
              </span>{" "}
              completed league matches.
            </p>

            {/* Formula Box */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs space-y-2">
              <div className="text-slate-400 text-[11px]">
                λ_home = League_Home × Home_Attack × Away_Defense
              </div>
              <div className="text-emerald-400 font-semibold">
                {formatXg(prediction.expected_goals.home)} ={" "}
                {formatXg(prediction.explanation.league_home_goals)} ×{" "}
                {formatMultiplier(hStr.attack_multiplier)} ×{" "}
                {formatMultiplier(aStr.defence_multiplier)}
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-slate-400 text-[11px]">
                λ_away = League_Away × Away_Attack × Home_Defense
              </div>
              <div className="text-sky-400 font-semibold">
                {formatXg(prediction.expected_goals.away)} ={" "}
                {formatXg(prediction.explanation.league_away_goals)} ×{" "}
                {formatMultiplier(aStr.attack_multiplier)} ×{" "}
                {formatMultiplier(hStr.defence_multiplier)}
              </div>
            </div>

            {/* Venue Parameter Table */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between font-semibold text-emerald-300 mb-1.5">
                  <span>{prediction.home_team} (Home Venue Record)</span>
                  <span className="font-mono text-slate-400">
                    {hStr.matches_played} home matches
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-slate-300">
                  <div>
                    Scored: {hStr.goals_for} (
                    {formatXg(hStr.goals_for_per_match)}/m) →{" "}
                    <span className="text-emerald-400">
                      {formatMultiplier(hStr.attack_multiplier)}
                    </span>
                  </div>
                  <div>
                    Conceded: {hStr.goals_against} (
                    {formatXg(hStr.goals_against_per_match)}/m) →{" "}
                    <span className="text-slate-200">
                      {formatMultiplier(hStr.defence_multiplier)}
                    </span>
                  </div>
                </div>
                {hStr.used_neutral_fallback && (
                  <div className="mt-1.5 text-[11px] text-amber-400">
                    No prior home history in window — using neutral 1.00× strength.
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between font-semibold text-sky-300 mb-1.5">
                  <span>{prediction.away_team} (Away Venue Record)</span>
                  <span className="font-mono text-slate-400">
                    {aStr.matches_played} away matches
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-slate-300">
                  <div>
                    Scored: {aStr.goals_for} (
                    {formatXg(aStr.goals_for_per_match)}/m) →{" "}
                    <span className="text-sky-400">
                      {formatMultiplier(aStr.attack_multiplier)}
                    </span>
                  </div>
                  <div>
                    Conceded: {aStr.goals_against} (
                    {formatXg(aStr.goals_against_per_match)}/m) →{" "}
                    <span className="text-slate-200">
                      {formatMultiplier(aStr.defence_multiplier)}
                    </span>
                  </div>
                </div>
                {aStr.used_neutral_fallback && (
                  <div className="mt-1.5 text-[11px] text-amber-400">
                    No prior away history in window — using neutral 1.00× strength.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-3 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong>Analytical Baseline Disclosure:</strong> Probabilities assume
              conditional Poisson independence truncated at{" "}
              <code className="text-slate-300">
                max_goals={prediction.score_matrix.max_goals}
              </code>
              . This output is for quantitative modeling research, not a betting
              recommendation.
            </span>
          </div>
        </div>
      </div>

      {/* Social Media Card Export Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Social Media Share Card & Permalink
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close ✕
              </button>
            </div>

            {/* Exportable PNG Card Canvas */}
            <div
              ref={socialCardRef}
              className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-7 space-y-5"
            >
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-emerald-400 font-bold tracking-wider uppercase">
                  FOOTBALL ENGINE LAB • {prediction.competition_code}
                </span>
                <span>
                  {prediction.model_version} • Seasons:{" "}
                  {prediction.seasons_used.join(", ")}
                </span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4 py-2">
                <div>
                  <div className="text-xs text-emerald-400 font-semibold">
                    HOME
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {prediction.home_team}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Attack {formatMultiplier(hStr.attack_multiplier)} • Defense{" "}
                    {formatMultiplier(hStr.defence_multiplier)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="font-mono text-3xl font-bold text-white">
                    <span className="text-emerald-400">
                      {formatXg(prediction.expected_goals.home)}
                    </span>{" "}
                    <span className="text-sm text-slate-500">xG</span>{" "}
                    <span className="text-sky-400">
                      {formatXg(prediction.expected_goals.away)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-mono text-slate-400">
                    Top Score: {prediction.full_time_score.home_goals}–
                    {prediction.full_time_score.away_goals} (
                    {formatPct(prediction.full_time_score.probability)})
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-sky-400 font-semibold">AWAY</div>
                  <div className="text-2xl font-bold text-white">
                    {prediction.away_team}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Attack {formatMultiplier(aStr.attack_multiplier)} • Defense{" "}
                    {formatMultiplier(aStr.defence_multiplier)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-center">
                  <div className="text-xs text-emerald-300">1 • Home Win</div>
                  <div className="text-xl font-bold text-emerald-400">
                    {formatPct(prediction.outcome_probabilities.home_win)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Fair Odds: {formatOdds(prediction.markets.home_win.fair_odds)}
                  </div>
                </div>
                <div className="rounded-xl bg-amber-400/10 border border-amber-400/30 p-3 text-center">
                  <div className="text-xs text-amber-300">X • Draw</div>
                  <div className="text-xl font-bold text-amber-300">
                    {formatPct(prediction.outcome_probabilities.draw)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Fair Odds: {formatOdds(prediction.markets.draw.fair_odds)}
                  </div>
                </div>
                <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 p-3 text-center">
                  <div className="text-xs text-sky-300">2 • Away Win</div>
                  <div className="text-xl font-bold text-sky-400">
                    {formatPct(prediction.outcome_probabilities.away_win)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Fair Odds: {formatOdds(prediction.markets.away_win.fair_odds)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800">
                <span>
                  Over 2.5: {formatPct(prediction.markets.over_2_5_goals.probability)}{" "}
                  • BTTS Yes: {formatPct(prediction.markets.btts_yes.probability)}
                </span>
                <span>
                  Snapshot #{prediction.data_snapshot_hash.slice(0, 8)} •{" "}
                  {prediction.slug ?? "reproducible"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400 font-mono truncate max-w-sm">
                {shareUrl}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyPermalink}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedLink ? "Copied!" : "Copy URL"}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSocialPng}
                  disabled={exportingPng}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {exportingPng ? "Rendering PNG..." : "Download PNG for Social Media"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
