import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Database,
  FlaskConical,
  Globe,
  Layers,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { overviewQueryOptions } from "../../queries";

export function OverviewPage() {
  const { data: overview, isLoading } = useQuery(overviewQueryOptions());

  if (isLoading || !overview) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 rounded-xl border border-slate-800 bg-slate-900/60"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/30 p-8">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
            <span>{overview.active_model.id}</span>
            <span>•</span>
            <span>v{overview.active_model.version}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Football Engine Lab
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            A public-facing quantitative football analytics laboratory. Explore{" "}
            <span className="font-mono font-semibold text-white">
              {overview.total_matches.toLocaleString()}
            </span>{" "}
            historical matches, inspect Sequential Poisson rate decompositions,
            benchmark predictions against bookmaker odds with zero future data
            leakage, and share reproducible experiments.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/predict"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 transition"
            >
              <FlaskConical className="h-4 w-4" />
              Open Prediction Lab
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/evaluate"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 transition"
            >
              <Activity className="h-4 w-4 text-sky-400" />
              Run Walk-Forward Backtest
            </Link>

            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition"
            >
              <Database className="h-4 w-4 text-amber-400" />
              Browse Match Corpus
            </Link>
          </div>
        </div>
      </div>

      {/* Live Corpus Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Completed Matches
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-100">
            {overview.total_matches.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-500">
            {overview.earliest_match_date ?? "—"} →{" "}
            {overview.latest_match_date ?? "—"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Competitions & Seasons
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-400">
            {overview.total_competitions} / {overview.total_seasons}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Canonical league tables
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Tracked Clubs
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-sky-400">
            {overview.total_teams.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Alias-reconciled entities
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Bookmaker Odds Rows
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-amber-300">
            {overview.total_odds.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            1X2, O/U 2.5 & AH lines
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Upcoming Synced Fixtures
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-100">
            {overview.upcoming_fixtures}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            api-football.com:{" "}
            <span
              className={
                overview.api_football_configured
                  ? "text-emerald-400"
                  : "text-amber-400"
              }
            >
              {overview.api_football_configured ? "Connected" : "CSV Mode"}
            </span>
          </div>
        </div>
      </div>

      {/* Supported Competitions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Ingested Competitions & Season Coverage
            </h2>
            <p className="text-xs text-slate-400">
              All statistics below reflect persisted database records. Click a
              competition to launch the Prediction Lab or Walk-Forward Evaluator.
            </p>
          </div>
        </div>

        {overview.competitions.length === 0 ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-sm text-amber-200">
            No competitions ingested in PostgreSQL yet. Run{" "}
            <code className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs">
              uv run football-analytics bulk-ingest src/data/raw/epl
              --competition-name "Premier League" --competition-code EPL
            </code>{" "}
            or trigger a sync from the Explore page.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {overview.competitions.map((comp) => (
              <div
                key={comp.code}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-md bg-emerald-500/15 px-2.5 py-1 font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
                        {comp.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-100">
                        {comp.name}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      {comp.match_count.toLocaleString()} matches
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {comp.seasons.map((season) => (
                      <span
                        key={season}
                        className="rounded bg-slate-950 px-2 py-0.5 font-mono text-[11px] text-slate-300 border border-slate-800"
                      >
                        {season}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <Link
                    to="/predict"
                    search={{
                      competition: comp.code,
                      seasons: comp.seasons.slice(-2).join(","),
                      mode: "hypothetical",
                      maxGoals: 8,
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    Predict Matchup <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <Link
                    to="/evaluate"
                    search={{
                      competition: comp.code,
                      warmup: comp.seasons.slice(0, -1).join(","),
                      target: comp.seasons.slice(-1).join(","),
                      maxGoals: 8,
                    }}
                    className="inline-flex items-center gap-1 font-medium text-sky-400 hover:text-sky-300"
                  >
                    Evaluate {comp.seasons[comp.seasons.length - 1]}{" "}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Methodology & Architectural Principles Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Zero Data Leakage Guarantee</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {overview.active_model.data_leakage_policy}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-400">
            <Layers className="h-4 w-4" />
            <span>Explainable Rate Decomposition</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {overview.active_model.description}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <Globe className="h-4 w-4" />
              <span>Dual Ingestion: CSV + api-football.com</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Combines multi-decade historical CSV archives with live{" "}
              <code className="text-slate-300">v3.football.api-sports.io</code>{" "}
              fixture & odds synchronization using canonical team alias
              resolution.
            </p>
          </div>
          <Link
            to="/model"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Read Full Model Specification & Limitations
          </Link>
        </div>
      </div>
    </div>
  );
}
