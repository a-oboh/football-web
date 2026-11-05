import { z } from "zod";

export const predictSearchSchema = z.object({
  competition: z.string().optional(),
  seasons: z.string().optional(),
  mode: z.enum(["hypothetical", "historical", "upcoming"]).default("hypothetical"),
  homeTeam: z.string().optional(),
  awayTeam: z.string().optional(),
  matchId: z.coerce.number().int().optional(),
  fixtureId: z.coerce.number().int().optional(),
  maxGoals: z.coerce.number().int().min(4).max(15).default(8),
});
export type PredictSearch = z.infer<typeof predictSearchSchema>;

export const evaluateSearchSchema = z.object({
  competition: z.string().optional(),
  warmup: z.string().optional(),
  target: z.string().optional(),
  maxGoals: z.coerce.number().int().min(4).max(15).default(8),
});
export type EvaluateSearch = z.infer<typeof evaluateSearchSchema>;

export const exploreSearchSchema = z.object({
  tab: z.enum(["completed", "upcoming", "sync"]).default("completed"),
  competition: z.string().optional(),
  season: z.string().optional(),
  team: z.string().optional(),
  result: z.enum(["H", "D", "A"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25),
});
export type ExploreSearch = z.infer<typeof exploreSearchSchema>;
