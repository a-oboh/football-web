import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRightLeft,
  Calendar,
  FlaskConical,
  Loader2,
  Play,
  Sparkles,
} from "lucide-react";
import {
  competitionsQueryOptions,
  matchesQueryOptions,
  teamsQueryOptions,
  upcomingFixturesQueryOptions,
  useCreatePredictionMutation,
} from "../../queries";
import { PredictionResultView } from "./PredictionResultView";
import type { PredictionResponse } from "../../schemas/api";

export function PredictionLabPage() {
  const search = useSearch({ from: "/predict" });
  const navigate = useNavigate({ from: "/predict" });
  const { data: competitions = [], isLoading: loadingComps } = useQuery(
    competitionsQueryOptions()
  );

  const defaultComp = competitions[0]?.code ?? "EPL";
  const activeCompCode = search.competition || defaultComp;
  const activeComp = useMemo(
    () =>
      competitions.find((c) => c.code === activeCompCode) ?? competitions[0],
    [competitions, activeCompCode]
  );

  const selectedSeasons = useMemo(() => {
    if (search.seasons) {
      const parsed = search.seasons
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    if (activeComp && activeComp.seasons.length > 0) {
      return activeComp.seasons.slice(-2);
    }
    return [];
  }, [search.seasons, activeComp]);

  const { data: teamsData, isLoading: loadingTeams } = useQuery(
    teamsQueryOptions(activeCompCode, selectedSeasons)
  );
  const availableTeams = teamsData?.teams ?? [];

  const { data: recentMatchesData } = useQuery(
    matchesQueryOptions({
      competition_code: activeCompCode,
      season: selectedSeasons[selectedSeasons.length - 1],
      page: 1,
      page_size: 40,
    })
  );
  const historicalMatches = recentMatchesData?.items ?? [];

  const { data: upcomingFixtures = [] } = useQuery(
    upcomingFixturesQueryOptions(activeCompCode)
  );

  const createPrediction = useCreatePredictionMutation();
  const [activeResult, setActiveResult] = useState<PredictionResponse | null>(
    null
  );
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      mode: search.mode ?? ("hypothetical" as "hypothetical" | "historical" | "upcoming"),
      homeTeam: search.homeTeam ?? "",
      awayTeam: search.awayTeam ?? "",
      matchId: search.matchId ?? (undefined as number | undefined),
      fixtureId: search.fixtureId ?? (undefined as number | undefined),
      maxGoals: search.maxGoals ?? 8,
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      if (selectedSeasons.length === 0) {
        setFormError("Select at least one historical season to train the model.");
        return;
      }

      if (value.mode === "hypothetical") {
        if (!value.homeTeam || !value.awayTeam) {
          setFormError("Please select both a Home team and an Away team.");
          return;
        }
        if (value.homeTeam === value.awayTeam) {
          setFormError("Home team and Away team must be different.");
          return;
        }
      } else if (value.mode === "historical" && !value.matchId) {
        setFormError("Please select a historical match to evaluate.");
        return;
      } else if (value.mode === "upcoming" && !value.fixtureId) {
        setFormError("Please select an upcoming synced fixture.");
        return;
      }

      navigate({
        search: {
          competition: activeCompCode,
          seasons: selectedSeasons.join(","),
          mode: value.mode,
          homeTeam: value.homeTeam || undefined,
          awayTeam: value.awayTeam || undefined,
          matchId: value.matchId,
          fixtureId: value.fixtureId,
          maxGoals: value.maxGoals,
        },
        replace: true,
      });

      const result = await createPrediction.mutateAsync({
        competition_code: activeCompCode,
        season_names: selectedSeasons,
        mode: value.mode,
        home_team: value.homeTeam || undefined,
        away_team: value.awayTeam || undefined,
        match_id: value.matchId,
        fixture_id: value.fixtureId,
        max_goals: value.maxGoals,
        save_snapshot: true,
      });
      setActiveResult(result);
    },
  });

  // Auto-populate default home and away teams when teams list loads
  useEffect(() => {
    if (availableTeams.length >= 2) {
      const currHome = form.state.values.homeTeam;
      const currAway = form.state.values.awayTeam;
      if (!currHome || !availableTeams.includes(currHome)) {
        form.setFieldValue("homeTeam", availableTeams[0]);
      }
      if (
        !currAway ||
        !availableTeams.includes(currAway) ||
        currAway === availableTeams[0]
      ) {
        form.setFieldValue("awayTeam", availableTeams[1]);
      }
    }
  }, [availableTeams, form]);

  // If deep-linked with a historical matchId, auto-select historical mode
  useEffect(() => {
    if (search.matchId) {
      form.setFieldValue("mode", "historical");
      form.setFieldValue("matchId", search.matchId);
    } else if (search.fixtureId) {
      form.setFieldValue("mode", "upcoming");
      form.setFieldValue("fixtureId", search.fixtureId);
    }
  }, [search.matchId, search.fixtureId, form]);

  const toggleSeason = (seasonName: string) => {
    const exists = selectedSeasons.includes(seasonName);
    const next = exists
      ? selectedSeasons.filter((s) => s !== seasonName)
      : [...selectedSeasons, seasonName];
    if (next.length === 0) return;
    navigate({
      search: (prev) => ({
        ...prev,
        competition: activeCompCode,
        seasons: next.join(","),
      }),
      replace: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1">
            <FlaskConical className="h-3.5 w-3.5" />
            <span>Interactive Matchup Forecasting</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Prediction Lab</h1>
          <p className="text-sm text-slate-400">
            Configure training seasons, select a matchup or historical fixture, and
            inspect the Sequential Poisson rate decomposition and score grid.
          </p>
        </div>
      </div>

      {/* Control Panel Card */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="rounded-xl border border-slate-800 bg-slate-900/75 p-6 space-y-5"
      >
        {/* Row 1: Competition, Seasons & Prediction Mode */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Competition Selector */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              1. Competition
            </label>
            <select
              value={activeCompCode}
              disabled={loadingComps}
              onChange={(e) => {
                const newComp = competitions.find(
                  (c) => c.code === e.target.value
                );
                const defaultSeasons = newComp
                  ? newComp.seasons.slice(-2).join(",")
                  : undefined;
                navigate({
                  search: (prev) => ({
                    ...prev,
                    competition: e.target.value,
                    seasons: defaultSeasons,
                    matchId: undefined,
                    fixtureId: undefined,
                  }),
                  replace: true,
                });
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              {competitions.map((comp) => (
                <option key={comp.code} value={comp.code}>
                  {comp.name} ({comp.code})
                </option>
              ))}
            </select>
          </div>

          {/* Season Window Pills */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                2. Historical Seasons in Model State ({selectedSeasons.length})
              </label>
              {activeComp && activeComp.seasons.length > 2 && (
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        competition: activeCompCode,
                        seasons: activeComp.seasons.join(","),
                      }),
                      replace: true,
                    })
                  }
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Select All ({activeComp.seasons.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 rounded-lg bg-slate-950/60 border border-slate-800/80">
              {activeComp?.seasons.map((season) => {
                const active = selectedSeasons.includes(season);
                return (
                  <button
                    key={season}
                    type="button"
                    onClick={() => toggleSeason(season)}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs transition ${
                      active
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                        : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {season}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prediction Mode Selector */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              3. Prediction Mode
            </label>
            <form.Field name="mode">
              {(field) => (
                <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-950 p-1 border border-slate-800">
                  {(
                    [
                      { id: "hypothetical", label: "Hypothetical" },
                      { id: "historical", label: "Historical" },
                      { id: "upcoming", label: "Upcoming" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => field.handleChange(item.id)}
                      className={`rounded-md py-1.5 text-xs font-medium transition ${
                        field.state.value === item.id
                          ? "bg-emerald-600 text-white shadow"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </form.Field>
          </div>
        </div>

        {/* Row 2: Matchup / Historical Match / Upcoming Fixture Picker */}
        <form.Subscribe selector={(state) => state.values.mode}>
          {(mode) => (
            <div className="grid grid-cols-1 gap-4 pt-3 border-t border-slate-800/80 lg:grid-cols-12 items-end">
              {mode === "hypothetical" && (
                <>
                  <div className="lg:col-span-4">
                    <label className="block text-xs font-medium text-emerald-400 mb-1.5">
                      Home Team
                    </label>
                    <form.Field name="homeTeam">
                      {(field) => (
                        <select
                          value={field.state.value}
                          disabled={loadingTeams}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                        >
                          {availableTeams.map((team) => (
                            <option key={team} value={team}>
                              {team}
                            </option>
                          ))}
                        </select>
                      )}
                    </form.Field>
                  </div>

                  <div className="lg:col-span-1 flex justify-center">
                    <button
                      type="button"
                      title="Swap Home and Away Teams"
                      onClick={() => {
                        const h = form.state.values.homeTeam;
                        const a = form.state.values.awayTeam;
                        form.setFieldValue("homeTeam", a);
                        form.setFieldValue("awayTeam", h);
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-300 hover:bg-slate-700 transition"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="lg:col-span-4">
                    <label className="block text-xs font-medium text-sky-400 mb-1.5">
                      Away Team
                    </label>
                    <form.Field name="awayTeam">
                      {(field) => (
                        <select
                          value={field.state.value}
                          disabled={loadingTeams}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                        >
                          {availableTeams.map((team) => (
                            <option key={team} value={team}>
                              {team}
                            </option>
                          ))}
                        </select>
                      )}
                    </form.Field>
                  </div>
                </>
              )}

              {mode === "historical" && (
                <div className="lg:col-span-9">
                  <label className="block text-xs font-medium text-amber-300 mb-1.5">
                    Select Completed Historical Match (Model will replay only matches
                    strictly prior to kickoff date)
                  </label>
                  <form.Field name="matchId">
                    {(field) => (
                      <select
                        value={field.state.value ?? ""}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:border-amber-400 focus:outline-none"
                      >
                        <option value="">
                          — Choose a historical fixture from {activeCompCode} —
                        </option>
                        {historicalMatches.map((m) => (
                          <option key={m.id} value={m.id}>
                            [{m.match_date}] {m.home_team} {m.home_goals}–
                            {m.away_goals} {m.away_team} ({m.season_name}
                            {m.odds_count > 0 ? " • Odds Available" : ""})
                          </option>
                        ))}
                      </select>
                    )}
                  </form.Field>
                </div>
              )}

              {mode === "upcoming" && (
                <div className="lg:col-span-9">
                  <label className="block text-xs font-medium text-emerald-300 mb-1.5">
                    Select Upcoming Synced Fixture (from api-football.com)
                  </label>
                  <form.Field name="fixtureId">
                    {(field) => (
                      <select
                        value={field.state.value ?? ""}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">
                          {upcomingFixtures.length === 0
                            ? `— No upcoming fixtures synced for ${activeCompCode} yet (Sync in Explore → Live API tab) —`
                            : `— Select an upcoming ${activeCompCode} fixture —`}
                        </option>
                        {upcomingFixtures.map((f) => (
                          <option key={f.id} value={f.id}>
                            [{f.match_date} {f.kickoff_time ?? ""}] {f.home_team}{" "}
                            vs {f.away_team} ({f.round_name ?? f.season_name})
                          </option>
                        ))}
                      </select>
                    )}
                  </form.Field>
                </div>
              )}

              {/* Max Goals Grid Setting */}
              <div className="lg:col-span-1">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Max Goals
                </label>
                <form.Field name="maxGoals">
                  {(field) => (
                    <input
                      type="number"
                      min={4}
                      max={15}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value) || 8)
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2.5 text-center font-mono text-sm text-slate-100"
                    />
                  )}
                </form.Field>
              </div>

              {/* Submit Button */}
              <div className="lg:col-span-2">
                <button
                  type="submit"
                  disabled={createPrediction.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
                >
                  {createPrediction.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Computing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form.Subscribe>

        {(formError || createPrediction.isError) && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {formError ||
                (createPrediction.error instanceof Error
                  ? createPrediction.error.message
                  : "Failed to generate prediction")}
            </span>
          </div>
        )}
      </form>

      {/* Prediction Output or Empty State */}
      {activeResult ? (
        <PredictionResultView prediction={activeResult} />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
          <Sparkles className="h-8 w-8 text-emerald-400/70 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">
            Ready to Generate Matchup Probabilities
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Select a competition, training seasons, and two clubs above, then click{" "}
            <strong className="text-slate-200">Generate</strong> to inspect expected
            goals, fair odds, the exact score matrix, and rate decomposition.
          </p>
        </div>
      )}
    </div>
  );
}
