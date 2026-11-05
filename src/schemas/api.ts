import { z } from "zod";

export const HealthResponseSchema = z.object({
  status: z.string(),
  database: z.string(),
  model_version: z.string(),
  api_football_configured: z.boolean(),
  timestamp: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const CompetitionItemSchema = z.object({
  code: z.string(),
  name: z.string(),
  seasons: z.array(z.string()),
  match_count: z.number().default(0),
  api_football_id: z.number().nullable().optional(),
  country: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
});
export type CompetitionItem = z.infer<typeof CompetitionItemSchema>;

export const ModelMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  family: z.string(),
  description: z.string(),
  parameters: z.record(z.string(), z.number()),
  assumptions: z.array(z.string()),
  limitations: z.array(z.string()),
  data_leakage_policy: z.string(),
});
export type ModelMetadata = z.infer<typeof ModelMetadataSchema>;

export const OverviewResponseSchema = z.object({
  total_matches: z.number(),
  total_competitions: z.number(),
  total_seasons: z.number(),
  total_teams: z.number(),
  total_odds: z.number(),
  upcoming_fixtures: z.number(),
  earliest_match_date: z.string().nullable(),
  latest_match_date: z.string().nullable(),
  competitions: z.array(CompetitionItemSchema),
  active_model: ModelMetadataSchema,
  api_football_configured: z.boolean(),
});
export type OverviewResponse = z.infer<typeof OverviewResponseSchema>;

export const TeamsResponseSchema = z.object({
  competition_code: z.string(),
  seasons: z.array(z.string()),
  teams: z.array(z.string()),
});
export type TeamsResponse = z.infer<typeof TeamsResponseSchema>;

export const MatchSummarySchema = z.object({
  id: z.number(),
  competition_code: z.string(),
  competition_name: z.string(),
  season_name: z.string(),
  match_date: z.string(),
  kickoff_time: z.string().nullable().optional(),
  home_team: z.string(),
  away_team: z.string(),
  home_goals: z.number(),
  away_goals: z.number(),
  result: z.enum(["H", "D", "A"]),
  home_half_time_goals: z.number().nullable().optional(),
  away_half_time_goals: z.number().nullable().optional(),
  half_time_result: z.string().nullable().optional(),
  referee_name: z.string().nullable().optional(),
  has_statistics: z.boolean(),
  odds_count: z.number(),
});
export type MatchSummary = z.infer<typeof MatchSummarySchema>;

export const PaginatedMatchesSchema = z.object({
  items: z.array(MatchSummarySchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
});
export type PaginatedMatches = z.infer<typeof PaginatedMatchesSchema>;

export const MatchStatisticsSchema = z.object({
  home_shots: z.number().nullable().optional(),
  away_shots: z.number().nullable().optional(),
  home_shots_on_target: z.number().nullable().optional(),
  away_shots_on_target: z.number().nullable().optional(),
  home_fouls: z.number().nullable().optional(),
  away_fouls: z.number().nullable().optional(),
  home_corners: z.number().nullable().optional(),
  away_corners: z.number().nullable().optional(),
  home_yellow_cards: z.number().nullable().optional(),
  away_yellow_cards: z.number().nullable().optional(),
  home_red_cards: z.number().nullable().optional(),
  away_red_cards: z.number().nullable().optional(),
});
export type MatchStatistics = z.infer<typeof MatchStatisticsSchema>;

export const OddsEntrySchema = z.object({
  source: z.string(),
  market: z.string(),
  selection: z.string(),
  line: z.number().nullable().optional(),
  phase: z.string(),
  price: z.number(),
});
export type OddsEntry = z.infer<typeof OddsEntrySchema>;

export const MatchDetailSchema = z.object({
  id: z.number(),
  api_football_fixture_id: z.number().nullable().optional(),
  competition_code: z.string(),
  competition_name: z.string(),
  season_name: z.string(),
  match_date: z.string(),
  kickoff_time: z.string().nullable().optional(),
  home_team: z.string(),
  away_team: z.string(),
  home_team_logo: z.string().nullable().optional(),
  away_team_logo: z.string().nullable().optional(),
  home_goals: z.number(),
  away_goals: z.number(),
  result: z.enum(["H", "D", "A"]),
  home_half_time_goals: z.number().nullable().optional(),
  away_half_time_goals: z.number().nullable().optional(),
  half_time_result: z.string().nullable().optional(),
  referee_name: z.string().nullable().optional(),
  statistics: MatchStatisticsSchema.nullable().optional(),
  odds: z.array(OddsEntrySchema).default([]),
});
export type MatchDetail = z.infer<typeof MatchDetailSchema>;

export const ScheduledFixtureSchema = z.object({
  id: z.number(),
  api_football_fixture_id: z.number(),
  competition_code: z.string(),
  competition_name: z.string(),
  season_name: z.string(),
  home_team: z.string(),
  away_team: z.string(),
  home_team_logo: z.string().nullable().optional(),
  away_team_logo: z.string().nullable().optional(),
  match_date: z.string(),
  kickoff_time: z.string().nullable().optional(),
  venue_name: z.string().nullable().optional(),
  round_name: z.string().nullable().optional(),
  referee_name: z.string().nullable().optional(),
  status_short: z.string(),
  completed_match_id: z.number().nullable().optional(),
  last_synced_at: z.string(),
  odds_count: z.number().default(0),
});
export type ScheduledFixture = z.infer<typeof ScheduledFixtureSchema>;

export const ExpectedGoalsSchema = z.object({
  home: z.number(),
  away: z.number(),
});

export const OutcomeProbabilitiesSchema = z.object({
  home_win: z.number(),
  draw: z.number(),
  away_win: z.number(),
});

export const PredictedScoreSchema = z.object({
  home_goals: z.number(),
  away_goals: z.number(),
  probability: z.number(),
});

export const MarketSelectionSchema = z.object({
  probability: z.number(),
  fair_odds: z.number().nullable().optional(),
});

export const BettingMarketsSchema = z.object({
  home_win: MarketSelectionSchema,
  draw: MarketSelectionSchema,
  away_win: MarketSelectionSchema,
  over_2_5_goals: MarketSelectionSchema,
  under_2_5_goals: MarketSelectionSchema,
  btts_yes: MarketSelectionSchema,
  btts_no: MarketSelectionSchema,
});

export const TeamVenueStrengthSchema = z.object({
  matches_played: z.number(),
  goals_for: z.number(),
  goals_against: z.number(),
  goals_for_per_match: z.number().nullable().optional(),
  goals_against_per_match: z.number().nullable().optional(),
  attack_multiplier: z.number(),
  defence_multiplier: z.number(),
  used_neutral_fallback: z.boolean(),
});

export const MatchupExplanationSchema = z.object({
  total_league_matches: z.number(),
  league_home_goals: z.number(),
  league_away_goals: z.number(),
  used_initial_league_rates: z.boolean(),
  home_team_home_strength: TeamVenueStrengthSchema,
  away_team_away_strength: TeamVenueStrengthSchema,
});

export const HistoricalMatchContextSchema = z.object({
  match_id: z.number(),
  match_date: z.string(),
  season_name: z.string(),
  actual_home_goals: z.number(),
  actual_away_goals: z.number(),
  actual_result: z.enum(["H", "D", "A"]),
  actual_ht_home_goals: z.number().nullable().optional(),
  actual_ht_away_goals: z.number().nullable().optional(),
});

export const Bookmaker1X2ComparisonSchema = z.object({
  source: z.string(),
  phase: z.string(),
  home_price: z.number(),
  draw_price: z.number(),
  away_price: z.number(),
  overround: z.number(),
  implied_home_win: z.number(),
  implied_draw: z.number(),
  implied_away_win: z.number(),
});

export const PredictionResponseSchema = z.object({
  slug: z.string().nullable().optional(),
  model_version: z.string(),
  data_snapshot_hash: z.string(),
  created_at: z.string(),
  mode: z.enum(["hypothetical", "historical", "upcoming"]),
  competition_code: z.string(),
  seasons_used: z.array(z.string()),
  home_team: z.string(),
  away_team: z.string(),
  as_of_date: z.string().nullable().optional(),
  expected_goals: ExpectedGoalsSchema,
  outcome_probabilities: OutcomeProbabilitiesSchema,
  probability_mass: z.number(),
  full_time_score: PredictedScoreSchema,
  top_scores: z.array(PredictedScoreSchema),
  half_time: z.object({
    expected_goals: ExpectedGoalsSchema,
    score: PredictedScoreSchema,
  }),
  markets: BettingMarketsSchema,
  score_matrix: z.object({
    max_goals: z.number(),
    probabilities: z.array(z.array(z.number())),
  }),
  explanation: MatchupExplanationSchema,
  historical_context: HistoricalMatchContextSchema.nullable().optional(),
  bookmaker_comparison: Bookmaker1X2ComparisonSchema.nullable().optional(),
});
export type PredictionResponse = z.infer<typeof PredictionResponseSchema>;

export const OutcomeMetricsSchema = z.object({
  matches: z.number(),
  log_loss: z.number(),
  brier_score: z.number(),
  accuracy: z.number(),
  mean_probability_mass: z.number(),
});
export type OutcomeMetrics = z.infer<typeof OutcomeMetricsSchema>;

export const BookmakerEvaluationBenchmarkSchema = z.object({
  evaluated_matches_with_odds: z.number(),
  source_summary: z.string(),
  bookmaker_metrics: OutcomeMetricsSchema,
  model_metrics_on_same_matches: OutcomeMetricsSchema,
});

export const CalibrationBinSchema = z.object({
  bin_index: z.number(),
  bin_lower: z.number(),
  bin_upper: z.number(),
  sample_count: z.number(),
  mean_predicted_probability: z.number(),
  observed_frequency: z.number(),
});

export const OutcomeFrequencySummarySchema = z.object({
  predicted_home: z.number(),
  predicted_draw: z.number(),
  predicted_away: z.number(),
  observed_home: z.number(),
  observed_draw: z.number(),
  observed_away: z.number(),
});

export const SeasonMetricsItemSchema = z.object({
  season_name: z.string(),
  metrics: OutcomeMetricsSchema,
});

export const EvaluatedMatchPredictionSchema = z.object({
  match_id: z.number().nullable().optional(),
  season_name: z.string(),
  match_date: z.string(),
  home_team: z.string(),
  away_team: z.string(),
  home_goals: z.number(),
  away_goals: z.number(),
  actual_result: z.enum(["H", "D", "A"]),
  expected_home_goals: z.number(),
  expected_away_goals: z.number(),
  home_win_probability: z.number(),
  draw_probability: z.number(),
  away_win_probability: z.number(),
  predicted_result: z.enum(["H", "D", "A"]),
  correct: z.boolean(),
  bookmaker_source: z.string().nullable().optional(),
  bookmaker_home_prob: z.number().nullable().optional(),
  bookmaker_draw_prob: z.number().nullable().optional(),
  bookmaker_away_prob: z.number().nullable().optional(),
});
export type EvaluatedMatchPrediction = z.infer<typeof EvaluatedMatchPredictionSchema>;

export const EvaluationResponseSchema = z.object({
  slug: z.string().nullable().optional(),
  status: z.enum(["queued", "running", "completed", "failed"]),
  model_version: z.string(),
  data_snapshot_hash: z.string(),
  created_at: z.string(),
  competition_code: z.string(),
  warmup_seasons: z.array(z.string()),
  evaluation_seasons: z.array(z.string()),
  model_metrics: OutcomeMetricsSchema,
  league_baseline_metrics: OutcomeMetricsSchema,
  bookmaker_benchmark: BookmakerEvaluationBenchmarkSchema.nullable().optional(),
  outcome_frequencies: OutcomeFrequencySummarySchema,
  calibration_curve: z.array(CalibrationBinSchema),
  season_breakdown: z.array(SeasonMetricsItemSchema),
  predictions: z.array(EvaluatedMatchPredictionSchema),
});
export type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>;

export const SyncStatusResponseSchema = z.object({
  api_football_configured: z.boolean(),
  supported_leagues: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      api_football_id: z.number(),
      country: z.string(),
    })
  ),
  recent_logs: z.array(
    z.object({
      id: z.number(),
      provider: z.string(),
      endpoint: z.string(),
      competition_code: z.string().nullable().optional(),
      season_name: z.string().nullable().optional(),
      status: z.string(),
      requests_remaining: z.number().nullable().optional(),
      records_processed: z.number(),
      created_at: z.string(),
    })
  ),
});
export type SyncStatusResponse = z.infer<typeof SyncStatusResponseSchema>;

export const ApiFootballSyncResponseSchema = z.object({
  competition_code: z.string(),
  season_name: z.string(),
  api_football_league_id: z.number(),
  api_football_season_year: z.number(),
  created_completed_matches: z.number(),
  existing_completed_matches: z.number(),
  upserted_scheduled_fixtures: z.number(),
  synced_odds_records: z.number(),
  requests_remaining: z.number().nullable().optional(),
});
export type ApiFootballSyncResponse = z.infer<typeof ApiFootballSyncResponseSchema>;
