import fs from "fs";
import { Rettiwt } from "rettiwt-api";

const rettiwt = new Rettiwt({
  apiKey: process.env.RETTIWT_API_KEY,
  logging: true,
  // Based on docs recommendations to reduce random 404s and flakiness
  delay: 1000,
  maxRetries: 5,
});

const QUERY = process.env.SEARCH_QUERY || "bitcoin";
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 600000); // 15s default
const PER_POLL_LIMIT = Number(process.env.PER_POLL_LIMIT || 30);
const OUTPUT_FILE = process.env.OUTPUT_FILE || "bitcoin_tweets.json";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeReadExistingTweets() {
  try {
    if (!fs.existsSync(OUTPUT_FILE)) return [];
    const raw = fs.readFileSync(OUTPUT_FILE, "utf8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTweetsAtomic(tweets) {
  const tmp = `${OUTPUT_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(tweets, null, 2));
  fs.renameSync(tmp, OUTPUT_FILE);
}

function toPlainTweet(t) {
  const obj = typeof t?.toJSON === "function" ? t.toJSON() : t;
  return {
    id: obj?.id,
    user: obj?.tweetBy?.userName,
    text: obj?.fullText,
    likes: obj?.likeCount ?? 0,
    retweets: obj?.retweetCount ?? 0,
    created_at: obj?.createdAt,
  };
}

async function fetchOnce(cursor) {
  const res = await rettiwt.tweet.search({ includeWords: [QUERY] }, PER_POLL_LIMIT, cursor);
  const list = res?.list ?? [];
  return { tweets: list.map(toPlainTweet), next: res?.next };
}

async function startStreaming() {
  console.log(`🚀 Starting simulated stream for "${QUERY}" — polling every ${POLL_INTERVAL_MS}ms`);

  const existing = safeReadExistingTweets();
  const seenIds = new Set(existing.map((t) => t.id));

  let stored = existing;
  let lastLogTime = Date.now();

  const logHeartbeat = () => {
    const now = Date.now();
    if (now - lastLogTime >= 60000) {
      console.log(`⏱️ Still polling... stored=${stored.length}`);
      lastLogTime = now;
    }
  };

  let keepRunning = true;
  process.on("SIGINT", () => {
    keepRunning = false;
    console.log("\n👋 Stopping stream. Finalizing writes...");
    try {
      writeTweetsAtomic(stored);
      console.log(`✅ Wrote ${stored.length} total tweets to ${OUTPUT_FILE}`);
    } catch (e) {
      console.error("❌ Failed to finalize writes:", e?.message ?? e);
    } finally {
      process.exit(0);
    }
  });

  // Cursor-based pagination is mostly for within a poll. For streaming, we reset
  // the cursor each poll and rely on de-duplication via seenIds.
  while (keepRunning) {
    try {
      let cursor = undefined;
      let fetchedAny = false;
      const newlyArrived = [];

      // Fetch a couple of pages quickly to reduce miss chance
      for (let i = 0; i < 3; i++) {
        const { tweets, next } = await fetchOnce(cursor);
        if (!tweets.length) break;
        fetchedAny = true;
        for (const t of tweets) {
          if (t?.id && !seenIds.has(t.id)) {
            seenIds.add(t.id);
            newlyArrived.push(t);
          }
        }
        if (!next) break;
        cursor = next;
      }

      if (newlyArrived.length) {
        // Prepend new tweets assuming API returns newest first
        stored = [...newlyArrived, ...stored];
        writeTweetsAtomic(stored);
        newlyArrived.forEach((tweet) => {
          console.log(`🆕 @${tweet.user} — ❤️ ${tweet.likes} — ${tweet.text?.slice(0, 120) || ""}`);
        });
        console.log(`💾 Saved ${stored.length} total (${newlyArrived.length} new) → ${OUTPUT_FILE}`);
      } else if (!fetchedAny) {
        console.log("😴 No results this cycle.");
      }

      logHeartbeat();
    } catch (error) {
      console.error("❌ Poll error:", error?.message ?? error);
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

startStreaming();


