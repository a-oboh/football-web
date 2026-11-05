import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Code2,
  GitBranch,
  Layers,
  Scale,
} from "lucide-react";
import { modelsQueryOptions } from "../../queries";

export function MethodologyPage() {
  const { data: models = [] } = useQuery(modelsQueryOptions());
  const model = models[0];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Model Specification & Quantitative Assumptions</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">
          Model & Methodology
        </h1>
        <p className="text-sm text-slate-400">
          Transparent documentation of how the engine estimates expected goals,
          constructs score probability matrices, and enforces chronological
          walk-forward evaluation.
        </p>
      </div>

      {/* Mathematical Formulation */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-6 space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-slate-100">
          <Layers className="h-5 w-5 text-emerald-400" />
          <h2>1. Venue-Conditioned Sequential Poisson Formulation</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Football scoring rates exhibit strong venue dependence. Rather than
          pooling home and away matches into a single team rating,{" "}
          <code className="text-emerald-300">SequentialPoissonModel</code>{" "}
          maintains separate home and away venue records for every club across
          the selected historical window.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 font-mono text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
            <div className="text-emerald-400 font-semibold">
              Home Expected Goals (λ_home)
            </div>
            <div className="text-slate-200">
              λ_home = μ_league_home × α_home(H) × β_away(A)
            </div>
            <p className="font-sans text-slate-400 text-[11px] leading-relaxed">
              Where <code>α_home(H)</code> is the home side&apos;s home goals
              scored per match divided by <code>μ_league_home</code>, and{" "}
              <code>β_away(A)</code> is the away side&apos;s away goals conceded
              per match divided by <code>μ_league_home</code>.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
            <div className="text-sky-400 font-semibold">
              Away Expected Goals (λ_away)
            </div>
            <div className="text-slate-200">
              λ_away = μ_league_away × α_away(A) × β_home(H)
            </div>
            <p className="font-sans text-slate-400 text-[11px] leading-relaxed">
              Where <code>α_away(A)</code> is the away side&apos;s away goals
              scored per match divided by <code>μ_league_away</code>, and{" "}
              <code>β_home(H)</code> is the home side&apos;s home goals conceded
              per match divided by <code>μ_league_away</code>.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-2 text-xs text-slate-300">
          <div className="font-semibold text-slate-100">
            Exact Scoreline Joint Probability & Truncation Policy
          </div>
          <p className="text-slate-400 leading-relaxed">
            Conditional on <code>(λ_home, λ_away)</code>, full-time goals{" "}
            <code>(i, j)</code> are modeled as independent Poisson random
            variables on a finite grid <code>0 ≤ i, j ≤ max_goals</code>:
          </p>
          <div className="font-mono text-emerald-300 py-1">
            P(Home = i, Away = j) = [exp(-λ_home) · λ_home^i / i!] ×
            [exp(-λ_away) · λ_away^j / j!]
          </div>
          <p className="text-slate-400 leading-relaxed">
            The matrix is intentionally <strong>not renormalized</strong> on raw
            output so that tail truncation remains inspectable via{" "}
            <code>probability_mass</code>. During multiclass Log Loss and Brier
            Score evaluation, outcome probabilities are normalized by retained
            grid mass so proper scoring rules evaluate a valid 3-way simplex.
          </p>
        </div>
      </div>

      {/* Assumptions & Limitations */}
      {model && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4" />
              <span>Core Model Assumptions</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              {model.assumptions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-emerald-400 font-bold">
                    0{idx + 1}.
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4" />
              <span>Disclosed Baseline Limitations</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              {model.limitations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-amber-400 font-bold">
                    0{idx + 1}.
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Walk-Forward Protocol & API Docs Link */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-6 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-sky-400">
            <GitBranch className="h-4 w-4" />
            <span>Chronological Walk-Forward Protocol</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Football matches form a non-stationary time series. Random K-fold
            splits leak future team strength into earlier predictions. Our
            evaluator sorts matches by <code>(match_date, id)</code>, warms up on
            designated prior seasons, and for every target match predicts{" "}
            <em>before</em> calling <code>model.record_result(...)</code>.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-6 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <Code2 className="h-4 w-4 text-emerald-400" />
              <span>Interactive OpenAPI v1 Documentation</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every endpoint powering this React application is documented via
              FastAPI OpenAPI schemas under <code>/api/v1/*</code>.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-emerald-400 hover:bg-slate-700"
            >
              Open Swagger UI (/docs) ↗
            </a>
            <a
              href="http://127.0.0.1:8000/redoc"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-300 hover:bg-slate-700"
            >
              Open ReDoc (/redoc) ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
