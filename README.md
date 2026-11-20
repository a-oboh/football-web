# Football Engine Lab — Web Frontend (`football-web`)

Public-facing interactive football analytics lab built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, **Axios**, **Zod**, and the **TanStack ecosystem** (`@tanstack/react-router`, `@tanstack/react-query`, `@tanstack/react-table`, `@tanstack/react-form`).

Consumes the FastAPI `/api/v1` backend provided by [`../football-engine`](../football-engine).

## Features

- **Lab Overview (`/`)**: Real-time corpus summary (matches, bookmaker odds rows, upcoming fixtures), competition coverage cards, and quick-launch actions.
- **Prediction Lab (`/predict`, `/p/$slug`)**:
  - **Three Evaluation Modes**:
    - `Hypothetical`: Fit on all completed matches in the selected training seasons.
    - `Historical (Walk-Forward Cutoff)`: Fit strictly on matches played *before* a historical match's date and compare predicted probabilities against the actual full-time score and closing bookmaker odds.
    - `Upcoming Fixture`: Fit on current + historical seasons for an upcoming `api-football.com` scheduled fixture and compare model fair odds against live pre-match bookmaker odds.
  - **Visualizations**: Full-time expected goals ($\lambda_{\text{home}}, \lambda_{\text{away}}$), calibrated half-time expected goals, 1X2 / Over-Under 2.5 / BTTS cards with bookmaker edge indicators, interactive $7 \times 7$ exact scoreline probability matrix, and a full **Model Explainability Inspector** (venue attack/defense multipliers, shrinkage parameter $\alpha$, half-time share).
  - **Social Media Sharing**: Persistent permalink snapshots (`/p/$slug`) and 1-click **1200×630 PNG Social Card Export** (`html-to-image`).
- **Walk-Forward Evaluation Lab (`/evaluate`, `/e/$slug`)**:
  - Chronological out-of-sample backtesting with strict warm-up and target season separation.
  - Compares the Sequential Poisson model against both a **Naive League-Average Baseline** and **Bookmaker Closing Implied Probabilities** (1X2 Log-Loss, Multi-class Brier Score, Hit Rate, Goals RMSE/MAE, Over 2.5 & BTTS Brier/Log-Loss).
  - Interactive 10-bin **Reliability / Calibration Curve** (`recharts`), predicted vs. observed H/D/A frequencies, and a filterable `@tanstack/react-table` match-by-match table with 1-click drill-down into the Prediction Lab.
- **Match & Fixture Explorer (`/explore`)**:
  - Paginated browser of historical matches with statistics & bookmaker odds badges, match detail drawer, upcoming `api-football.com` fixtures tab, and an interactive **Live API Sync** panel.
- **Methodology & Assumptions (`/model`)**:
  - Transparent mathematical documentation of the Sequential Independent Poisson model, venue strength estimation, exponential time decay, walk-forward evaluation protocol, and known baseline limitations.

## Tech Stack

- **HTTP Client**: `axios` ([`src/lib/api-client.ts`](./src/lib/api-client.ts)) with `paramsSerializer: { indexes: null }` and runtime **Zod** response validation ([`src/schemas/api.ts`](./src/schemas/api.ts))
- **Routing & URL Search State**: `@tanstack/react-router` + `@tanstack/zod-adapter` ([`src/router.tsx`](./src/router.tsx), [`src/schemas/search.ts`](./src/schemas/search.ts))
- **Server State & Caching**: `@tanstack/react-query` ([`src/queries/index.ts`](./src/queries/index.ts))
- **Data Grids**: `@tanstack/react-table`
- **Forms**: `@tanstack/react-form`
- **Charts & Export**: `recharts`, `html-to-image`, `lucide-react`

## Getting Started

1. **Ensure the FastAPI backend is running on `http://127.0.0.1:8000`**:
   ```bash
   cd ../football-engine
   uv run football-analytics serve --reload
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server (`http://localhost:5173`)**:
   ```bash
   npm run dev
   ```
   *(Vite proxies `/api` requests to `http://127.0.0.1:8000` by default, or you can set `VITE_API_BASE_URL` in `.env`.)*

4. **Type-check and build for production**:
   ```bash
   npm run build
   ```
