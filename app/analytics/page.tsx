"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, TrendingUp, MessageSquare, Heart, Repeat2, Users, Calendar, BarChart3 } from "lucide-react"
import Link from "next/link"

interface Tweet {
  id: string
  user: string
  text: string
  likes: number
  retweets: number
  created_at: string
}

interface TweetStats {
  totalTweets: number
  totalLikes: number
  totalRetweets: number
  averageLikes: number
  averageRetweets: number
  uniqueUsers: number
  oldestTweet: string | null
  newestTweet: string | null
}

export default function AnalyticsPage() {
  const [latestTweets, setLatestTweets] = useState<Tweet[]>([])
  const [stats, setStats] = useState<TweetStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTweetsData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/tweets")
      if (!response.ok) throw new Error("Failed to fetch tweets data")

      const data = await response.json()
      setLatestTweets(data.latestTweets || [])
      setStats(data.statistics || null)
      setIsLoading(false)
    } catch (err: any) {
      console.error("Error fetching tweets:", err)
      setError(err.message || "Failed to load tweets data")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTweetsData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchTweetsData, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted to-background">
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-border bg-black/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-4"
            >
              <Link href="/" className="hover:opacity-80 transition">
                <ArrowLeft size={20} className="text-muted-foreground" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold gradient-text">Tweet Analytics</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Bitcoin tweet data insights</p>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {error && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="glassmorphism p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-primary">
                  <MessageSquare size={24} />
                </div>
                <div className="text-2xl font-bold">{formatNumber(stats.totalTweets)}</div>
              </div>
              <div className="text-sm text-muted-foreground">Total Tweets</div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glassmorphism p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-primary">
                  <Users size={24} />
                </div>
                <div className="text-2xl font-bold">{formatNumber(stats.uniqueUsers)}</div>
              </div>
              <div className="text-sm text-muted-foreground">Unique Users</div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glassmorphism p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-primary">
                  <Heart size={24} />
                </div>
                <div className="text-2xl font-bold">{formatNumber(stats.totalLikes)}</div>
              </div>
              <div className="text-sm text-muted-foreground">Total Likes</div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="glassmorphism p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-primary">
                  <Repeat2 size={24} />
                </div>
                <div className="text-2xl font-bold">{formatNumber(stats.totalRetweets)}</div>
              </div>
              <div className="text-sm text-muted-foreground">Total Retweets</div>
            </motion.div>
          </div>
        )}

        {/* Additional Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="glassmorphism p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 size={20} className="text-primary" />
                <div className="text-sm font-semibold">Average Engagement</div>
              </div>
              <div className="text-2xl font-bold">{formatNumber(stats.averageLikes + stats.averageRetweets)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.averageLikes} likes + {stats.averageRetweets} retweets per tweet
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="glassmorphism p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <Calendar size={20} className="text-primary" />
                <div className="text-sm font-semibold">Date Range</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold mb-1">Oldest: {formatDate(stats.oldestTweet)}</div>
                <div className="font-semibold">Newest: {formatDate(stats.newestTweet)}</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="glassmorphism p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={20} className="text-primary" />
                <div className="text-sm font-semibold">Engagement Rate</div>
              </div>
              <div className="text-2xl font-bold">
                {stats.totalTweets > 0
                  ? ((stats.totalLikes + stats.totalRetweets) / stats.totalTweets).toFixed(1)
                  : "0"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Engagements per tweet</div>
            </motion.div>
          </div>
        )}

        {/* Latest Tweets Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="glassmorphism p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Latest 5 Tweets</h2>
            {isLoading && (
              <div className="text-sm text-muted-foreground animate-pulse">Refreshing...</div>
            )}
          </div>

          {isLoading && latestTweets.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : latestTweets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>No tweets available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {latestTweets.map((tweet, index) => (
                <motion.div
                  key={tweet.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-primary">@{tweet.user}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(tweet.created_at)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{tweet.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart size={14} />
                      <span>{tweet.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Repeat2 size={14} />
                      <span>{tweet.retweets || 0}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

