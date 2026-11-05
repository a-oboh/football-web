import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Calendar,
  CheckCircle2,
  Database,
  Eye,
  FlaskConical,
  Loader2,
  RefreshCw,
  Server,
  X,
} from "lucide-react";
import {
  competitionsQueryOptions,
  matchDetailQueryOptions,
  matchesQueryOptions,
  syncStatusQueryOptions,
  upcomingFixturesQueryOptions,
  useTriggerApiFootballSyncMutation,
} from "../../queries";
import type { MatchSummary } from "../../schemas/api";
import { formatOdds } from "../../lib/formatters";

const columnHelper = createColumnHelper<MatchSummary>();

export function ExplorePage() {
  const search = useSearch({ from: "/explore" });
  const navigate = useNavigate({ from: "/explore" });
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  // Sync trigger state
  const [syncComp, setSyncComp] = useState("EPL");
  const [syncSeason, setSyncSeason] = useState("2025-26");
  const [syncOdds, setSyncOdds] = useState(true);
  const [syncStats, setSyncStats] = useState(false);

  const { data: competitions = [] } = useQuery(competitionsQueryOptions());
  const activeComp = useMemo(
    () => competitions.find((c) => c.code === search.competition),
    [competitions, search.competition]
  );

  const { data: matchesPage, isLoading: loadingMatches } = useQuery(
    matchesQueryOptions({
      competition_code: search.competition,
      season: search.season,
      team: search.team,
      result: search.result,
      page: search.page,
      page_size: search.pageSize,
    })
  );

  const { data: upcomingFixtures = [], isLoading: loadingUpcoming } = useQuery(
    upcomingFixturesQueryOptions(search.competition, search.season)
  );

  const { data: syncStatus } = useQuery(syncStatusQueryOptions());
  const triggerSync = useTriggerApiFootballSyncMutation();

  const { data: matchDetail, isLoading: loadingDetail } = useQuery(
    matchDetailQueryOptions(selectedMatchId)
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
      columnHelper.accessor("competition_code", {
        header: "League",
        cell: (info) => (
          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
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
        id: "matchup",
        header: "Home vs Away",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-2 text-xs">
              <span
                className={
                  r.result === "H"
                    ? "font-bold text-emerald-300"
                    : "text-slate-200"
                }
              >
                {r.home_team}
              </span>
              <span className="rounded bg-slate-950 border border-slate-800 px-2 py-0.5 font-mono font-bold text-slate-100">
                {r.home_goals} – {r.away_goals}
              </span>
              <span
                className={
                  r.result === "A" ? "font-bold text-sky-300" : "text-slate-200"
                }
              >
                {r.away_team}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("result", {
        header: "FTR",
        cell: (info) => {
          const v = info.getValue();
          return (
            <span
              className={`inline-block w-6 text-center rounded py-0.5 font-mono text-xs font-bold ${
                v === "H"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : v === "D"
                    ? "bg-amber-400/20 text-amber-300"
                    : "bg-sky-500/20 text-sky-400"
              }`}
            >
              {v}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "coverage",
        header: "Data Coverage",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              {r.has_statistics && (
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                  Stats
                </span>
              )}
              {r.odds_count > 0 && (
                <span className="rounded bg-amber-500/15 text-amber-300 px-1.5 py-0.5">
                  {r.odds_count} Odds
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedMatchId(r.id)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700 transition"
              >
                <Eye className="h-3 w-3" />
                Inspect
              </button>
              <Link
                to="/predict"
                search={{
                  competition: r.competition_code,
                  seasons: r.season_name,
                  mode: "historical",
                  matchId: r.id,
                  maxGoals: 8,
                }}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-600/30 transition"
              >
                <FlaskConical className="h-3 w-3" />
                Predict (Pre-Kickoff)
              </Link>
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: matchesPage?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1">
            <Database className="h-3.5 w-3.5" />
            <span>Canonical PostgreSQL Corpus & Live API-Football Feed</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            Explore Matches & Live Sync
          </h1>
        </div>

        <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1">
          {(
            [
              { id: "completed", label: "Completed Matches" },
              {
                id: "upcoming",
                label: `Upcoming Fixtures (${upcomingFixtures.length})`,
              },
              { id: "sync", label: "Live API Sync (api-football.com)" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                navigate({
                  search: (prev) => ({ ...prev, tab: t.id }),
                  replace: true,
                })
              }
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                search.tab === t.id
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Completed Historical Matches */}
      {search.tab === "completed" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/75 p-4 md:grid-cols-5">
            <div>
              <label className="block text-[11px] uppercase text-slate-400 mb-1">
                Competition
              </label>
              <select
                value={search.competition ?? ""}
                onChange={(e) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      competition: e.target.value || undefined,
                      season: undefined,
                      page: 1,
                    }),
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              >
                <option value="">All Competitions</option>
                {competitions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase text-slate-400 mb-1">
                Season
              </label>
              <select
                value={search.season ?? ""}
                onChange={(e) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      season: e.target.value || undefined,
                      page: 1,
                    }),
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              >
                <option value="">All Seasons</option>
                {(activeComp?.seasons ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase text-slate-400 mb-1">
                Team Name Filter
              </label>
              <input
                type="text"
                value={search.team ?? ""}
                onChange={(e) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      team: e.target.value || undefined,
                      page: 1,
                    }),
                    replace: true,
                  })
                }
                placeholder="e.g. Arsenal, Inter..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase text-slate-400 mb-1">
                Full-Time Result
              </label>
              <select
                value={search.result ?? ""}
                onChange={(e) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      result: (e.target.value || undefined) as
                        | "H"
                        | "D"
                        | "A"
                        | undefined,
                      page: 1,
                    }),
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              >
                <option value="">Any Result (H / D / A)</option>
                <option value="H">Home Win (H)</option>
                <option value="D">Draw (D)</option>
                <option value="A">Away Win (A)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() =>
                  navigate({
                    search: {
                      tab: "completed",
                      page: 1,
                      pageSize: 25,
                    },
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Matches Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Total Matching Records:{" "}
                <strong className="font-mono text-slate-100">
                  {(matchesPage?.total ?? 0).toLocaleString()}
                </strong>
              </span>
              <span className="font-mono">
                Page {matchesPage?.page ?? 1} of {matchesPage?.total_pages ?? 1}
              </span>
            </div>

            {loadingMatches ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading historical matches...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr
                        key={hg.id}
                        className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400"
                      >
                        {hg.headers.map((header) => (
                          <th key={header.id} className="py-2.5 px-3">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-800/40 transition"
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
            )}

            {/* Server Pagination */}
            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <button
                type="button"
                disabled={(matchesPage?.page ?? 1) <= 1}
                onClick={() =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }),
                  })
                }
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-700"
              >
                ← Previous Page
              </button>
              <button
                type="button"
                disabled={
                  (matchesPage?.page ?? 1) >= (matchesPage?.total_pages ?? 1)
                }
                onClick={() =>
                  navigate({
                    search: (prev) => ({ ...prev, page: prev.page + 1 }),
                  })
                }
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-700"
              >
                Next Page →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Upcoming Scheduled Fixtures (api-football.com) */}
      {search.tab === "upcoming" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Upcoming Scheduled Fixtures (Synced from api-football.com)
              </h3>
              <p className="text-xs text-slate-400">
                Unplayed fixtures stored in <code>scheduled_fixtures</code> before
                full-time completion.
              </p>
            </div>
          </div>

          {loadingUpcoming ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Loading upcoming fixtures...
            </div>
          ) : upcomingFixtures.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 p-10 text-center space-y-2">
              <Calendar className="h-7 w-7 text-slate-500 mx-auto" />
              <div className="text-sm font-medium text-slate-300">
                No Upcoming Fixtures Synced Yet
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Switch to the <strong>Live API Sync (api-football.com)</strong> tab
                to fetch upcoming fixtures and pre-match bookmaker odds.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {upcomingFixtures.map((f) => (
                <div
                  key={f.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span className="text-emerald-400 font-semibold">
                        {f.competition_code}
                      </span>
                      <span>•</span>
                      <span>
                        {f.match_date} {f.kickoff_time ?? ""}
                      </span>
                      {f.round_name && (
                        <>
                          <span>•</span>
                          <span>{f.round_name}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-100">
                      {f.home_team}{" "}
                      <span className="text-slate-500 font-normal">vs</span>{" "}
                      {f.away_team}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Venue: {f.venue_name ?? "TBD"} • Pre-match Odds:{" "}
                      {f.odds_count}
                    </div>
                  </div>

                  <Link
                    to="/predict"
                    search={{
                      competition: f.competition_code,
                      seasons: f.season_name,
                      mode: "upcoming",
                      fixtureId: f.id,
                      maxGoals: 8,
                    }}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    Predict
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Live API-Football v3 Sync Panel */}
      {search.tab === "sync" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Sync League Season from api-football.com (v3)
                </h3>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-mono ${
                  syncStatus?.api_football_configured
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                }`}
              >
                {syncStatus?.api_football_configured
                  ? "API_FOOTBALL_KEY Configured"
                  : "API_FOOTBALL_KEY Not Set in .env"}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Fetches <code>GET /fixtures</code> (and optionally{" "}
              <code>GET /odds</code> & <code>GET /fixtures/statistics</code>) from{" "}
              <code>https://v3.football.api-sports.io</code>. Completed matches
              (status <code>FT</code>) are reconciled with existing CSV team names
              via <code>team_aliases</code> and stored in <code>matches</code>;
              unplayed fixtures (status <code>NS</code>) are stored in{" "}
              <code>scheduled_fixtures</code>.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Competition
                </label>
                <select
                  value={syncComp}
                  onChange={(e) => setSyncComp(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                >
                  {(syncStatus?.supported_leagues ?? []).map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.code} — API ID #{l.api_football_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Canonical Season (e.g. 2025-26)
                </label>
                <input
                  type="text"
                  value={syncSeason}
                  onChange={(e) => setSyncSeason(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-slate-300">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncOdds}
                  onChange={(e) => setSyncOdds(e.target.checked)}
                  className="rounded border-slate-700"
                />
                <span>Include Pre-Match Bookmaker Odds (/odds)</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncStats}
                  onChange={(e) => setSyncStats(e.target.checked)}
                  className="rounded border-slate-700"
                />
                <span>Include New Match Statistics (/fixtures/statistics)</span>
              </label>
            </div>

            <button
              type="button"
              disabled={triggerSync.isPending}
              onClick={() =>
                triggerSync.mutate({
                  competition_code: syncComp,
                  season_name: syncSeason,
                  include_odds: syncOdds,
                  include_statistics_for_new: syncStats,
                })
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
            >
              {triggerSync.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing from v3.football.api-sports.io...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Run API-Football Sync Now
                </>
              )}
            </button>

            {triggerSync.isError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {triggerSync.error instanceof Error
                  ? triggerSync.error.message
                  : "Sync failed"}
              </div>
            )}

            {triggerSync.isSuccess && triggerSync.data && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-sans font-semibold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Sync Completed ({triggerSync.data.competition_code}{" "}
                  {triggerSync.data.season_name})
                </div>
                <div>
                  New FT Matches: {triggerSync.data.created_completed_matches} •
                  Existing FT: {triggerSync.data.existing_completed_matches} •
                  Upcoming Fixtures:{" "}
                  {triggerSync.data.upserted_scheduled_fixtures} • Odds:{" "}
                  {triggerSync.data.synced_odds_records}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">
              Recent API Sync Audit Trail
            </h3>
            {(syncStatus?.recent_logs ?? []).length === 0 ? (
              <div className="text-xs text-slate-500 py-8 text-center">
                No API-Football sync runs logged yet.
              </div>
            ) : (
              <div className="space-y-2">
                {syncStatus?.recent_logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs font-mono flex items-center justify-between"
                  >
                    <div>
                      <span className="text-emerald-400 font-semibold">
                        {log.competition_code} {log.season_name}
                      </span>{" "}
                      <span className="text-slate-400">({log.endpoint})</span>
                      <div className="text-[11px] text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-200">
                        {log.records_processed} fixtures
                      </div>
                      {log.requests_remaining !== null &&
                        log.requests_remaining !== undefined && (
                          <div className="text-[11px] text-slate-500">
                            Quota left: {log.requests_remaining}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match Detail Drawer / Modal */}
      {selectedMatchId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="max-w-3xl w-full max-h-[88vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono uppercase text-emerald-400">
                  Match Record #{selectedMatchId}
                </span>
                <h3 className="text-lg font-bold text-white">
                  Historical Match Inspector
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMatchId(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetail || !matchDetail ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading match statistics and bookmaker odds...
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-slate-400">
                      {matchDetail.competition_name} ({matchDetail.season_name}) •{" "}
                      {matchDetail.match_date}{" "}
                      {matchDetail.kickoff_time ?? ""}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-white">
                      {matchDetail.home_team}{" "}
                      <span className="font-mono text-amber-300 px-2">
                        {matchDetail.home_goals} – {matchDetail.away_goals}
                      </span>{" "}
                      {matchDetail.away_team}
                    </div>
                    <div className="mt-1 text-xs text-slate-400 font-mono">
                      Full-Time Result: {matchDetail.result}
                      {matchDetail.home_half_time_goals !== null &&
                      matchDetail.home_half_time_goals !== undefined
                        ? ` • Half-Time: ${matchDetail.home_half_time_goals}–${matchDetail.away_half_time_goals} (${matchDetail.half_time_result ?? ""})`
                        : ""}
                      {matchDetail.referee_name
                        ? ` • Referee: ${matchDetail.referee_name}`
                        : ""}
                    </div>
                  </div>

                  <Link
                    to="/predict"
                    search={{
                      competition: matchDetail.competition_code,
                      seasons: matchDetail.season_name,
                      mode: "historical",
                      matchId: matchDetail.id,
                      maxGoals: 8,
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                  >
                    <FlaskConical className="h-4 w-4" />
                    Predict in Historical Pre-Kickoff Mode
                  </Link>
                </div>

                {/* Match Statistics */}
                {matchDetail.statistics && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Recorded Match Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5 text-xs font-mono sm:grid-cols-3">
                      <div className="rounded border border-slate-800 bg-slate-900/70 p-2.5">
                        <div className="text-slate-400 text-[11px]">
                          Total Shots (H / A)
                        </div>
                        <div className="text-slate-100 font-bold">
                          {matchDetail.statistics.home_shots ?? "—"} /{" "}
                          {matchDetail.statistics.away_shots ?? "—"}
                        </div>
                      </div>
                      <div className="rounded border border-slate-800 bg-slate-900/70 p-2.5">
                        <div className="text-slate-400 text-[11px]">
                          Shots on Target (H / A)
                        </div>
                        <div className="text-slate-100 font-bold">
                          {matchDetail.statistics.home_shots_on_target ?? "—"} /{" "}
                          {matchDetail.statistics.away_shots_on_target ?? "—"}
                        </div>
                      </div>
                      <div className="rounded border border-slate-800 bg-slate-900/70 p-2.5">
                        <div className="text-slate-400 text-[11px]">
                          Corners (H / A)
                        </div>
                        <div className="text-slate-100 font-bold">
                          {matchDetail.statistics.home_corners ?? "—"} /{" "}
                          {matchDetail.statistics.away_corners ?? "—"}
                        </div>
                      </div>
                      <div className="rounded border border-slate-800 bg-slate-900/70 p-2.5">
                        <div className="text-slate-400 text-[11px]">
                          Fouls (H / A)
                        </div>
                        <div className="text-slate-100 font-bold">
                          {matchDetail.statistics.home_fouls ?? "—"} /{" "}
                          {matchDetail.statistics.away_fouls ?? "—"}
                        </div>
                      </div>
                      <div className="rounded border border-slate-800 bg-slate-900/70 p-2.5">
                        <div className="text-slate-400 text-[11px]">
                          Yellow Cards (H / A)
                        </div>
                        <div className="text-amber-300 font-bold">
                          {matchDetail.statistics.home_yellow_cards ?? "—"} /{" "}
                          {matchDetail.statistics.away_yellow_cards ?? "—"}
                        </div>
                      </div>
                      <div className="rounded border border-slate-800 bg-slate-900/70 p-2.5">
                        <div className="text-slate-400 text-[11px]">
                          Red Cards (H / A)
                        </div>
                        <div className="text-rose-400 font-bold">
                          {matchDetail.statistics.home_red_cards ?? "—"} /{" "}
                          {matchDetail.statistics.away_red_cards ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stored Bookmaker Odds */}
                {matchDetail.odds.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Stored Bookmaker & Market Odds ({matchDetail.odds.length})
                    </h4>
                    <div className="max-h-56 overflow-y-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-[11px] text-slate-500">
                            <th className="py-1.5 px-2">Source</th>
                            <th className="py-1.5 px-2">Market</th>
                            <th className="py-1.5 px-2">Selection</th>
                            <th className="py-1.5 px-2">Line</th>
                            <th className="py-1.5 px-2">Phase</th>
                            <th className="py-1.5 px-2 text-right">
                              Decimal Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {matchDetail.odds.map((o, idx) => (
                            <tr key={idx}>
                              <td className="py-1.5 px-2 text-emerald-400 font-semibold">
                                {o.source}
                              </td>
                              <td className="py-1.5 px-2 text-slate-300">
                                {o.market}
                              </td>
                              <td className="py-1.5 px-2 text-slate-200">
                                {o.selection}
                              </td>
                              <td className="py-1.5 px-2 text-slate-400">
                                {o.line ?? "—"}
                              </td>
                              <td className="py-1.5 px-2 text-slate-400">
                                {o.phase}
                              </td>
                              <td className="py-1.5 px-2 text-right font-bold text-amber-300">
                                {formatOdds(o.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
