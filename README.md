# Emotional Volatility Analyzer for Bitcoin Using Real-Time Twitter Sentiment

## What this project does
- Tracks live Bitcoin conversation on X/Twitter, storing recent tweets in `bitcoin_tweets.json`.
- Runs a Python-based sentiment service to classify tweets (fear vs. greed).
- Calculates a Fear & Greed Index over time and visualizes it in the dashboard.
- Surfaces stats like total tweets, likes/retweets, and most recent messages.

## Data pipeline & workflow
1) **Ingest tweets** – `fetchTweets.mjs` polls X/Twitter via `rettiwt-api`, normalizes results, and atomically writes/updates `bitcoin_tweets.json`. Configure with `RETTIWT_API_KEY`, `SEARCH_QUERY`, `POLL_INTERVAL_MS`, `PER_POLL_LIMIT`, `OUTPUT_FILE`.
2) **Serve raw data** – `app/api/tweets/route.ts` reads `bitcoin_tweets.json`, returns latest tweets plus summary stats (counts, likes/retweets, users, date range).
3) **Sentiment analysis** – `app/api/sentiment/route.ts`:
   - Checks the Python API (`sentiment_api.py`) at `PYTHON_API_URL` (default `http://localhost:8000`).
   - Batches tweet texts to the Python model; classifies as 0/1 (negative/positive).
   - Converts to a Fear & Greed Index (0-100) and labels (Fear/Neutral/Greed) grouped in 2-minute buckets for charting.
4) **UI/dashboard** – `app/dashboard/page.tsx` renders `FearGreedDashboard`, showing the index, charts, stats, and latest tweets (components under `components/`).

## Running everything locally
- **Prereqs**: Node 18+, pnpm or npm; Python 3.10+ with PyTorch/transformers (see `requirements.txt` and `sentiment_api.py`).
- **Install deps**: `pnpm install` (or `npm install`).
- **Start tweet collector** (writes `bitcoin_tweets.json`):
  - `RETTIWT_API_KEY=... pnpm node fetchTweets.mjs`
- **Start Python sentiment API** (separate terminal):
  - `pip install -r requirements.txt`
  - `PYTHON_API_URL=http://localhost:8000 python sentiment_api.py`
- **Start Next.js app**:
  - `pnpm dev` (or `npm run dev`), then open http://localhost:3000.
- **Build**: `pnpm build` (or `npm run build`) then `pnpm start`.
- **Lint**: `pnpm lint` (or `npm run lint`).
## Local development

- Prereqs: Node 18+ (Next.js 16), pnpm or npm installed.
- Install deps (pick one): `pnpm install` or `npm install`
- Run dev server: `pnpm dev` (or `npm run dev`) then open http://localhost:3000
- Build: `pnpm build` (or `npm run build`) and start with `pnpm start`
- Lint: `pnpm lint` (or `npm run lint`)
