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

## Sentiment model (Hugging Face)
- The sentiment API uses a fine-tuned BERTweet model for Bitcoin tweets: [rohan10juli/bertweet-finetuned-bitcoin](https://huggingface.co/rohan10juli/bertweet-finetuned-bitcoin).
- It outputs binary labels (0 = negative, 1 = positive) that power the Fear & Greed Index.

## Home Dashboard – Real-Time Bitcoin Market Overview
Displays Bitcoin price, 24-hour percentage change, and trading volume fetched from CoinGecko API.

<img width="1580" height="847" alt="Screenshot 2025-12-10 at 6 28 12 PM" src="https://github.com/user-attachments/assets/a89d7b67-49f9-4f29-92f2-6c1870d46b7f" />

## Sentiment Dashboard – Live Greed–Fear Index Visualization
Shows the real-time Greed–Fear Index updated every 5 minutes based on sentiment analysis from fine-tuned BERTweet.

<img width="1580" height="847" alt="Screenshot 2025-12-10 at 6 33 19 PM" src="https://github.com/user-attachments/assets/4492cd71-1a8c-4c90-bc8f-dd6d6dde08d5" />

## Analytics Dashboard – Tweet Insights and Engagement Metrics
Presents total tweets analyzed, latest sample tweets, sentiment labels, and engagement rates extracted from Rettiwt API.

<img width="1580" height="847" alt="Screenshot 2025-12-10 at 6 34 32 PM" src="https://github.com/user-attachments/assets/c4845536-0e12-4001-838d-18da3020f340" />

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
