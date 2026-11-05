import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiGet, apiPost } from "../lib/api-client";
import {
  ApiFootballSyncResponseSchema,
  CompetitionItemSchema,
  EvaluationResponseSchema,
  HealthResponseSchema,
  MatchDetailSchema,
  ModelMetadataSchema,
  OverviewResponseSchema,
  PaginatedMatchesSchema,
  PredictionResponseSchema,
  ScheduledFixtureSchema,
  SyncStatusResponseSchema,
  TeamsResponseSchema,
} from "../schemas/api";

export const healthQueryOptions = () =>
  queryOptions({
    queryKey: ["health"],
    queryFn: () => apiGet("/api/v1/health", HealthResponseSchema),
    staleTime: 30_000,
  });

export const overviewQueryOptions = () =>
  queryOptions({
    queryKey: ["overview"],
    queryFn: () => apiGet("/api/v1/overview", OverviewResponseSchema),
    staleTime: 30_000,
  });

export const modelsQueryOptions = () =>
  queryOptions({
    queryKey: ["models"],
    queryFn: () => apiGet("/api/v1/models", z.array(ModelMetadataSchema)),
    staleTime: 60_000 * 5,
  });

export const competitionsQueryOptions = () =>
  queryOptions({
    queryKey: ["competitions"],
    queryFn: () => apiGet("/api/v1/competitions", z.array(CompetitionItemSchema)),
    staleTime: 60_000,
  });

export const teamsQueryOptions = (competitionCode: string, seasons: string[]) =>
  queryOptions({
    queryKey: ["teams", competitionCode, [...seasons].sort().join(",")],
    queryFn: () =>
      apiGet("/api/v1/teams", TeamsResponseSchema, {
        competition_code: competitionCode,
        season: seasons,
      }),
    enabled: Boolean(competitionCode && seasons.length > 0),
    staleTime: 60_000,
  });

export interface MatchesFilterParams {
  competition_code?: string;
  season?: string;
  team?: string;
  result?: "H" | "D" | "A";
  page?: number;
  page_size?: number;
}

export const matchesQueryOptions = (filters: MatchesFilterParams) =>
  queryOptions({
    queryKey: ["matches", filters],
    queryFn: () =>
      apiGet("/api/v1/matches", PaginatedMatchesSchema, {
        competition_code: filters.competition_code,
        season: filters.season,
        team: filters.team,
        result: filters.result,
        page: filters.page ?? 1,
        page_size: filters.page_size ?? 25,
      }),
    staleTime: 30_000,
  });

export const matchDetailQueryOptions = (matchId: number | null) =>
  queryOptions({
    queryKey: ["match-detail", matchId],
    queryFn: () => apiGet(`/api/v1/matches/${matchId}`, MatchDetailSchema),
    enabled: matchId !== null && matchId > 0,
  });

export const upcomingFixturesQueryOptions = (competitionCode?: string, season?: string) =>
  queryOptions({
    queryKey: ["upcoming-fixtures", competitionCode ?? "all", season ?? "all"],
    queryFn: () =>
      apiGet("/api/v1/fixtures/upcoming", z.array(ScheduledFixtureSchema), {
        competition_code: competitionCode,
        season,
      }),
    staleTime: 30_000,
  });

export const savedPredictionQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["prediction", slug],
    queryFn: () => apiGet(`/api/v1/predictions/${slug}`, PredictionResponseSchema),
    enabled: Boolean(slug),
  });

export const savedEvaluationQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["evaluation", slug],
    queryFn: () => apiGet(`/api/v1/evaluations/${slug}`, EvaluationResponseSchema),
    enabled: Boolean(slug),
  });

export const syncStatusQueryOptions = () =>
  queryOptions({
    queryKey: ["sync-status"],
    queryFn: () => apiGet("/api/v1/sync/status", SyncStatusResponseSchema),
    staleTime: 15_000,
  });

export interface CreatePredictionInput {
  competition_code: string;
  season_names: string[];
  mode: "hypothetical" | "historical" | "upcoming";
  home_team?: string;
  away_team?: string;
  match_id?: number;
  fixture_id?: number;
  max_goals: number;
  save_snapshot?: boolean;
}

export function useCreatePredictionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePredictionInput) =>
      apiPost("/api/v1/predictions", payload, PredictionResponseSchema),
    onSuccess: (data) => {
      if (data.slug) {
        queryClient.setQueryData(["prediction", data.slug], data);
      }
    },
  });
}

export interface CreateEvaluationInput {
  competition_code: string;
  warmup_seasons: string[];
  evaluation_seasons: string[];
  max_goals: number;
  save_snapshot?: boolean;
}

export function useCreateEvaluationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEvaluationInput) =>
      apiPost("/api/v1/evaluations", payload, EvaluationResponseSchema),
    onSuccess: (data) => {
      if (data.slug) {
        queryClient.setQueryData(["evaluation", data.slug], data);
      }
    },
  });
}

export interface TriggerSyncInput {
  competition_code: string;
  season_name: string;
  include_odds: boolean;
  include_statistics_for_new: boolean;
}

export function useTriggerApiFootballSyncMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TriggerSyncInput) =>
      apiPost("/api/v1/sync/api-football", payload, ApiFootballSyncResponseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-fixtures"] });
      queryClient.invalidateQueries({ queryKey: ["sync-status"] });
    },
  });
}
