import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  Loader2,
  Play,
  Sparkles,
} from "lucide-react";
import {
  competitionsQueryOptions,
  useCreateEvaluationMutation,
} from "../../queries";
import { EvaluationResultView } from "./EvaluationResultView";
import type { EvaluationResponse } from "../../schemas/api";

export function EvaluationLabPage() {
  const search = useSearch({ from: "/evaluate" });
  const navigate = useNavigate({ from: "/evaluate" });
  const { data: competitions = [] } = useQuery(competitionsQueryOptions());

  const activeCompCode = search.competition || competitions[0]?.code || "EPL";
  const activeComp = useMemo(
    () =>
      competitions.find((c) => c.code === activeCompCode) ?? competitions[0],
    [competitions, activeCompCode]
  );

  const [warmupSeasons, setWarmupSeasons] = useState<string[]>([]);
  const [targetSeasons, setTargetSeasons] = useState<string[]>([]);
  const [maxGoals, setMaxGoals] = useState<number>(search.maxGoals ?? 8);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeEvaluation, setActiveEvaluation] =
    useState<EvaluationResponse | null>(null);

  const createEvaluation = useCreateEvaluationMutation();

  // Initialize warm-up and target seasons when competition loads
  useEffect(() => {
    if (!activeComp || activeComp.seasons.length === 0) return;
    const all = activeComp.seasons;
    if (search.warmup && search.target) {
      setWarmupSeasons(search.warmup.split(",").filter(Boolean));
      setTargetSeasons(search.target.split(",").filter(Boolean));
      return;
    }
    if (all.length >= 2) {
      setWarmupSeasons(all.slice(0, -1));
      setTargetSeasons([all[all.length - 1]]);
    } else {
      setWarmupSeasons([all[0]]);
      setTargetSeasons([]);
    }
  }, [activeComp, search.warmup, search.target]);

  const toggleWarmupSeason = (season: string) => {
    setFormError(null);
    if (warmupSeasons.includes(season)) {
      setWarmupSeasons(warmupSeasons.filter((s) => s !== season));
    } else {
      setWarmupSeasons([...warmupSeasons, season]);
      setTargetSeasons(targetSeasons.filter((s) => s !== season));
    }
  };

  const toggleTargetSeason = (season: string) => {
    setFormError(null);
    if (targetSeasons.includes(season)) {
      setTargetSeasons(targetSeasons.filter((s) => s !== season));
    } else {
      setTargetSeasons([...targetSeasons, season]);
      setWarmupSeasons(warmupSeasons.filter((s) => s !== season));
    }
  };

  const handleRunEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (warmupSeasons.length === 0) {
      setFormError("Select at least one warm-up season.");
      return;
    }
    if (targetSeasons.length === 0) {
      setFormError(
        "Select at least one target evaluation season (disjoint from warm-up seasons)."
      );
      return;
    }

    navigate({
      search: {
        competition: activeCompCode,
        warmup: warmupSeasons.join(","),
        target: targetSeasons.join(","),
        maxGoals,
      },
      replace: true,
    });

    const result = await createEvaluation.mutateAsync({
      competition_code: activeCompCode,
      warmup_seasons: warmupSeasons,
      evaluation_seasons: targetSeasons,
      max_goals: maxGoals,
      save_snapshot: true,
    });
    setActiveEvaluation(result);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1">
          <Activity className="h-3.5 w-3.5" />
          <span>Chronological Walk-Forward Backtesting</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Evaluation Lab</h1>
        <p className="text-sm text-slate-400">
          Test out-of-sample probabilistic calibration, Log Loss, and Brier Score
          against a naive league baseline and bookmaker-implied probabilities.
        </p>
      </div>

      {/* Configuration Form */}
      <form
        onSubmit={handleRunEvaluation}
        className="rounded-xl border border-slate-800 bg-slate-900/75 p-6 space-y-5"
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              1. Competition
            </label>
            <select
              value={activeCompCode}
              onChange={(e) =>
                navigate({
                  search: {
                    competition: e.target.value,
                    warmup: undefined,
                    target: undefined,
                    maxGoals,
                  },
                  replace: true,
                })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              {competitions.map((comp) => (
                <option key={comp.code} value={comp.code}>
                  {comp.name} ({comp.code})
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              2. Warm-Up Seasons ({warmupSeasons.length}) —{" "}
              <span className="text-slate-500 font-normal">
                Recorded into state, excluded from metrics
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800">
              {activeComp?.seasons.map((season) => {
                const selected = warmupSeasons.includes(season);
                return (
                  <button
                    key={season}
                    type="button"
                    onClick={() => toggleWarmupSeason(season)}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs transition ${
                      selected
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold"
                        : "bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300"
                    }`}
                  >
                    {season}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              3. Target Evaluation Seasons ({targetSeasons.length})
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800">
              {activeComp?.seasons.map((season) => {
                const selected = targetSeasons.includes(season);
                return (
                  <button
                    key={season}
                    type="button"
                    onClick={() => toggleTargetSeason(season)}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs transition ${
                      selected
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                        : "bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300"
                    }`}
                  >
                    {season}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col justify-end space-y-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Max Goals Grid
              </label>
              <input
                type="number"
                min={4}
                max={15}
                value={maxGoals}
                onChange={(e) => setMaxGoals(Number(e.target.value) || 8)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-sm text-slate-100"
              />
            </div>
            <button
              type="submit"
              disabled={createEvaluation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
            >
              {createEvaluation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  Run Backtest
                </>
              )}
            </button>
          </div>
        </div>

        {(formError || createEvaluation.isError) && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {formError ||
                (createEvaluation.error instanceof Error
                  ? createEvaluation.error.message
                  : "Evaluation failed")}
            </span>
          </div>
        )}
      </form>

      {activeEvaluation ? (
        <EvaluationResultView evaluation={activeEvaluation} />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
          <Sparkles className="h-8 w-8 text-emerald-400/70 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">
            Configure & Run Walk-Forward Evaluation
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Select warm-up seasons (blue) and target evaluation seasons (green)
            above, then click <strong className="text-slate-200">Run Backtest</strong>{" "}
            to compute multiclass Log Loss, Brier Score, reliability calibration
            curves, and bookmaker benchmarks.
          </p>
        </div>
      )}
    </div>
  );
}
