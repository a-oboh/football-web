import {
  Link,
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  useParams,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { type QueryClient, useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Database,
  FlaskConical,
  LayoutDashboard,
  Terminal,
} from "lucide-react";
import {
  evaluateSearchSchema,
  exploreSearchSchema,
  predictSearchSchema,
} from "./schemas/search";
import {
  healthQueryOptions,
  savedEvaluationQueryOptions,
  savedPredictionQueryOptions,
} from "./queries";
import { OverviewPage } from "./features/overview/OverviewPage";
import { PredictionLabPage } from "./features/predictions/PredictionLabPage";
import { PredictionResultView } from "./features/predictions/PredictionResultView";
import { EvaluationLabPage } from "./features/evaluations/EvaluationLabPage";
import { EvaluationResultView } from "./features/evaluations/EvaluationResultView";
import { ExplorePage } from "./features/explore/ExplorePage";
import { MethodologyPage } from "./features/methodology/MethodologyPage";

export interface RouterContext {
  queryClient: QueryClient;
}

function RootLayout() {
  const { data: health } = useQuery(healthQueryOptions());

  const navItems = [
    { to: "/", label: "Overview", icon: LayoutDashboard },
    { to: "/predict", label: "Predict", icon: FlaskConical },
    { to: "/evaluate", label: "Evaluate", icon: Activity },
    { to: "/explore", label: "Explore & Sync", icon: Database },
    { to: "/model", label: "Methodology", icon: BookOpen },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Analytical Lab Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/25 transition">
                <Terminal className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-white">
                  Football Engine Lab
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  sequential-poisson-v1
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeProps={{
                      className:
                        "bg-slate-800/90 text-emerald-400 border-slate-700",
                    }}
                    inactiveProps={{
                      className:
                        "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent",
                    }}
                    activeOptions={{ exact: item.to === "/" }}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-mono">
              <span
                className={`h-2 w-2 rounded-full ${
                  health?.status === "ok"
                    ? "bg-emerald-400"
                    : "bg-amber-400 animate-pulse"
                }`}
              />
              <span className="text-slate-300">
                API: {health?.status === "ok" ? "Online" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="flex md:hidden overflow-x-auto border-t border-slate-900 px-4 py-2 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{
                  className: "bg-slate-800 text-emerald-400",
                }}
                inactiveProps={{
                  className: "text-slate-400",
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            Football Engine Lab • Quantitative Football Analytics & Reproducible
            Backtesting
          </div>
          <div className="font-mono">
            Engine: Python 3.14 + FastAPI v1 • UI: React + TanStack + Zod
          </div>
        </div>
      </footer>
    </div>
  );
}

function SharedPredictionPermalinkPage() {
  const { slug } = useParams({ from: "/p/$slug" });
  const { data: prediction, isLoading, isError } = useQuery(
    savedPredictionQueryOptions(slug)
  );

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">
        Loading shared prediction snapshot <code>{slug}</code>...
      </div>
    );
  }

  if (isError || !prediction) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-8 text-center space-y-3">
        <div className="text-base font-bold text-rose-300">
          Prediction Snapshot Not Found ({slug})
        </div>
        <Link
          to="/predict"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Open Prediction Lab
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono uppercase text-emerald-400">
            Reproducible Shared Snapshot • {slug}
          </span>
          <h1 className="text-2xl font-bold text-white">
            {prediction.home_team} vs {prediction.away_team}
          </h1>
        </div>
        <Link
          to="/predict"
          search={{
            competition: prediction.competition_code,
            seasons: prediction.seasons_used.join(","),
            mode: prediction.mode,
            homeTeam: prediction.home_team,
            awayTeam: prediction.away_team,
            maxGoals: prediction.score_matrix.max_goals,
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
        >
          Open in Interactive Prediction Lab →
        </Link>
      </div>
      <PredictionResultView prediction={prediction} isReadOnlyPermalink />
    </div>
  );
}

function SharedEvaluationPermalinkPage() {
  const { slug } = useParams({ from: "/e/$slug" });
  const { data: evaluation, isLoading, isError } = useQuery(
    savedEvaluationQueryOptions(slug)
  );

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">
        Loading shared evaluation snapshot <code>{slug}</code>...
      </div>
    );
  }

  if (isError || !evaluation) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-8 text-center space-y-3">
        <div className="text-base font-bold text-rose-300">
          Evaluation Snapshot Not Found ({slug})
        </div>
        <Link
          to="/evaluate"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Open Evaluation Lab
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono uppercase text-emerald-400">
            Reproducible Walk-Forward Experiment • {slug}
          </span>
          <h1 className="text-2xl font-bold text-white">
            {evaluation.competition_code} Backtest (
            {evaluation.evaluation_seasons.join(", ")})
          </h1>
        </div>
        <Link
          to="/evaluate"
          search={{
            competition: evaluation.competition_code,
            warmup: evaluation.warmup_seasons.join(","),
            target: evaluation.evaluation_seasons.join(","),
            maxGoals: 8,
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
        >
          Open in Evaluation Lab →
        </Link>
      </div>
      <EvaluationResultView evaluation={evaluation} />
    </div>
  );
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewPage,
});

const predictRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/predict",
  validateSearch: zodValidator(predictSearchSchema),
  component: PredictionLabPage,
});

const sharedPredictionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/p/$slug",
  component: SharedPredictionPermalinkPage,
});

const evaluateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/evaluate",
  validateSearch: zodValidator(evaluateSearchSchema),
  component: EvaluationLabPage,
});

const sharedEvaluationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/e/$slug",
  component: SharedEvaluationPermalinkPage,
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore",
  validateSearch: zodValidator(exploreSearchSchema),
  component: ExplorePage,
});

const modelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/model",
  component: MethodologyPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  predictRoute,
  sharedPredictionRoute,
  evaluateRoute,
  sharedEvaluationRoute,
  exploreRoute,
  modelRoute,
]);

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
