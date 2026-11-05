import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpDown,
  Check,
  CheckCircle2,
  Copy,
  Search,
  XCircle,
} from "lucide-react";
import type {
  EvaluatedMatchPrediction,
  EvaluationResponse,
} from "../../schemas/api";
import { formatMetric, formatPct, formatXg } from "../../lib/formatters";

const columnHelper = createColumnHelper<EvaluatedMatchPrediction>();

export function EvaluationResultView({
  evaluation,
}: {
  evaluation: EvaluationResponse;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const shareUrl = evaluation.slug
    ? `${window.location.origin}/e/${evaluation.slug}`
    : window.location.href;

  const handleCopyPermalink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const calibrationChartData = useMemo(
    () =>
      evaluation.calibration_curve
        .filter((b) => b.sample_count > 0)
        .map((b) => ({
          binLabel: `${Math.round(b.bin_lower * 100)}–${Math.round(
            b.bin_upper * 100
          )}%`,
          predicted: Number((b.mean_predicted_probability * 100).toFixed(1)),
          observed: Number((b.observed_frequency * 100).toFixed(1)),
          perfect: Number((b.mean_predicted_probability * 100).toFixed(1)),
          samples: b.sample_count,
        })),
    [evaluation.calibration_curve]
  );

  const frequencyChartData = useMemo(
    () => [
      {
        outcome: "Home Win (H)",
        Predicted: Number(
          (evaluation.outcome_frequencies.predicted_home * 100).toFixed(1)
        ),
        Observed: Number(
          (evaluation.outcome_frequencies.observed_home * 100).toFixed(1)
        ),
      },
      {
        outcome: "Draw (D)",
        Predicted: Number(
          (evaluation.outcome_frequencies.predicted_draw * 100).toFixed(1)
        ),
        Observed: Number(
          (evaluation.outcome_frequencies.observed_draw * 100).toFixed(1)
        ),
      },
      {
        outcome: "Away Win (A)",
        Predicted: Number(
          (evaluation.outcome_frequencies.predicted_away * 100).toFixed(1)
        ),
        Observed: Number(
          (evaluation.outcome_frequencies.observed_away * 100).toFixed(1)
        ),
      },
    ],
    [evaluation.outcome_frequencies]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("match_date", {
        header: "Date",
        cell: (info) => (
          <span className="font-mono text-xs text-slate-300">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("season_name", {
        header: "Season",
        cell: (info) => (
          <span className="font-mono text-xs text-slate-400">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: "fixture",
        header: "Matchup & Score",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-100">
                {r.home_team}
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono font-bold text-amber-300">
                {r.home_goals}–{r.away_goals}
              </span>
              <span className="font-semibold text-slate-100">
                {r.away_team}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "xg",
        header: "Model xG",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-300">
            {formatXg(row.original.expected_home_goals)} –{" "}
            {formatXg(row.original.expected_away_goals)}
          </span>
        ),
      }),
      columnHelper.accessor("home_win_probability", {
        header: "P(H)",
        cell: (info) => (
          <span className="font-mono text-xs text-emerald-400">
            {formatPct(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("draw_probability", {
        header: "P(D)",
        cell: (info) => (
          <span className="font-mono text-xs text-amber-300">
            {formatPct(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("away_win_probability", {
        header: "P(A)",
        cell: (info) => (
          <span className="font-mono text-xs text-sky-400">
            {formatPct(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "verdict",
        header: "Pick vs Actual",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="inline-flex items-center gap-1.5 font-mono text-xs">
              {r.correct ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
              )}
              <span
                className={r.correct ? "text-emerald-300" : "text-slate-400"}
              >
                Pred {r.predicted_result} / Act {r.actual_result}
              </span>
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: evaluation.predictions,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 15 },
    },
  });

  const m = evaluation.model_metrics;
  const b = evaluation.league_baseline_metrics;
  const bm = evaluation.bookmaker_benchmark;

  return (
    <div className="space-y-6">
      {/* Metadata & Permalink Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 font-semibold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
            Walk-Forward Evaluation Completed
          </span>
          <span className="text-slate-400">
            Competition:{" "}
            <strong className="font-mono text-slate-200">
              {evaluation.competition_code}
            </strong>
          </span>
          <span className="text-slate-400">
            Warm-Up:{" "}
            <strong className="font-mono text-slate-200">
              {evaluation.warmup_seasons.join(", ")}
            </strong>
          </span>
          <span className="text-slate-400">
            Evaluated:{" "}
            <strong className="font-mono text-emerald-300">
              {evaluation.evaluation_seasons.join(", ")} (N={m.matches})
            </strong>
          </span>
          <span className="text-slate-500">
            Snapshot:{" "}
            <code className="text-slate-400">
              {evaluation.data_snapshot_hash.slice(0, 10)}
            </code>
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyPermalink}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
        >
          {copiedLink ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Copied Evaluation Link
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-400" />
              {evaluation.slug
                ? `Share Evaluation (${evaluation.slug})`
                : "Copy Link"}
            </>
          )}
        </button>
      </div>

      {/* Primary Metrics Scorecard (Model vs League Baseline vs Bookmaker Implied) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Evaluated Sample Size
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-slate-100">
            {m.matches}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            Mean Grid Mass: {formatPct(m.mean_probability_mass, 2)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Multiclass Log Loss (Lower = Better)
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-emerald-400">
            {formatMetric(m.log_loss, 4)}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            vs Baseline: {formatMetric(b.log_loss, 4)} (
            <span
              className={
                m.log_loss <= b.log_loss ? "text-emerald-400" : "text-rose-400"
              }
            >
              {m.log_loss - b.log_loss >= 0 ? "+" : ""}
              {formatMetric(m.log_loss - b.log_loss, 4)}
            </span>
            )
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Multiclass Brier Score (Lower = Better)
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-sky-400">
            {formatMetric(m.brier_score, 4)}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            vs Baseline: {formatMetric(b.brier_score, 4)} (
            <span
              className={
                m.brier_score <= b.brier_score
                  ? "text-emerald-400"
                  : "text-rose-400"
              }
            >
              {m.brier_score - b.brier_score >= 0 ? "+" : ""}
              {formatMetric(m.brier_score - b.brier_score, 4)}
            </span>
            )
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Top-Outcome 1X2 Accuracy
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-amber-300">
            {formatPct(m.accuracy, 1)}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            vs Baseline: {formatPct(b.accuracy, 1)}
          </div>
        </div>
      </div>

      {/* Bookmaker Benchmark Comparison Panel */}
      {bm && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Benchmark vs. Bookmaker Implied Probabilities (Matched Sample N=
                {bm.evaluated_matches_with_odds})
              </h3>
              <p className="text-xs text-slate-400">
                Evaluated on the exact same subset of matches with stored odds (
                {bm.source_summary}, overround stripped proportionally).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 font-mono text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="text-slate-400 mb-1">Log Loss (Matched Set)</div>
              <div className="flex items-center justify-between">
                <span>
                  Model:{" "}
                  <strong className="text-emerald-400">
                    {formatMetric(
                      bm.model_metrics_on_same_matches.log_loss,
                      4
                    )}
                  </strong>
                </span>
                <span>
                  Bookmaker:{" "}
                  <strong className="text-sky-400">
                    {formatMetric(bm.bookmaker_metrics.log_loss, 4)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="text-slate-400 mb-1">
                Brier Score (Matched Set)
              </div>
              <div className="flex items-center justify-between">
                <span>
                  Model:{" "}
                  <strong className="text-emerald-400">
                    {formatMetric(
                      bm.model_metrics_on_same_matches.brier_score,
                      4
                    )}
                  </strong>
                </span>
                <span>
                  Bookmaker:{" "}
                  <strong className="text-sky-400">
                    {formatMetric(bm.bookmaker_metrics.brier_score, 4)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="text-slate-400 mb-1">1X2 Accuracy (Matched Set)</div>
              <div className="flex items-center justify-between">
                <span>
                  Model:{" "}
                  <strong className="text-emerald-400">
                    {formatPct(bm.model_metrics_on_same_matches.accuracy, 1)}
                  </strong>
                </span>
                <span>
                  Bookmaker:{" "}
                  <strong className="text-sky-400">
                    {formatPct(bm.bookmaker_metrics.accuracy, 1)}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row: Calibration Curve & H/D/A Frequency Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
          <h3 className="text-sm font-semibold text-slate-100 mb-1">
            Probability Calibration Curve (Reliability Diagram)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Compares mean predicted probability against empirical outcome rate
            across decile bins. Points on the dashed diagonal represent ideal
            calibration.
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={calibrationChartData}
                margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="binLabel"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey="perfect"
                  name="Ideal Diagonal"
                  stroke="#64748b"
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="observed"
                  name="Observed Empirical Rate (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
          <h3 className="text-sm font-semibold text-slate-100 mb-1">
            Predicted vs. Observed H/D/A Frequencies
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Reveals whether the independent Poisson model under-predicts Draws
            relative to empirical results.
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={frequencyChartData}
                margin={{ top: 10, right: 15, bottom: 10, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="outcome"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <ReferenceLine y={0} stroke="#334155" />
                <Bar
                  dataKey="Predicted"
                  name="Model Mean Probability (%)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Observed"
                  name="Actual Frequency (%)"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Individual Match Predictions Table (@tanstack/react-table) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Chronological Walk-Forward Match Predictions ({m.matches})
            </h3>
            <p className="text-xs text-slate-400">
              Every row was predicted strictly before its result was recorded into
              the Sequential Poisson state.
            </p>
          </div>
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Filter by team or date..."
              className="rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="py-2.5 px-3 cursor-pointer select-none hover:text-slate-200"
                    >
                      <div className="inline-flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="h-3 w-3 text-slate-600" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-800/40 transition text-xs"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-2.5 px-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Controls */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <div>
            Showing page{" "}
            <strong className="font-mono text-slate-200">
              {table.getState().pagination.pageIndex + 1}
            </strong>{" "}
            of{" "}
            <strong className="font-mono text-slate-200">
              {table.getPageCount()}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 disabled:opacity-40 hover:bg-slate-700"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 disabled:opacity-40 hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
