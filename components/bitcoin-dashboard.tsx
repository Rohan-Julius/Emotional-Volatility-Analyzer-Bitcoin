"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, TrendingUp, Activity, Globe, Clock, RefreshCw } from "lucide-react"
import Link from "next/link"
import PriceWidget from "./price-widget"
import StatsGrid from "./stats-grid"
import MarketMetrics from "./market-metrics"
import UpdateTimer from "./update-timer"

interface BitcoinData {
  price: number
  change24h: number
  change7d?: number
  marketCap: number
  marketCapChange24h?: number
  volume24h: number
  dominance: number
  ath?: number
  atl?: number
  high24h?: number
  low24h?: number
  lastUpdate: number
}

export default function BitcoinDashboard() {
  const [btcData, setBtcData] = useState<BitcoinData>({
    price: 0,
    change24h: 0,
    change7d: 0,
    marketCap: 0,
    marketCapChange24h: 0,
    volume24h: 0,
    dominance: 0,
    ath: 0,
    atl: 0,
    high24h: 0,
    low24h: 0,
    lastUpdate: Date.now(),
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextUpdate, setNextUpdate] = useState<number>(0)

  // 3 hours in milliseconds
  const UPDATE_INTERVAL = 3 * 60 * 60 * 1000 // 10800000ms

  const fetchBitcoinData = async (retryCount = 0) => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 2000 // 2 seconds
    const TIMEOUT = 10000 // 10 seconds

    // Helper to add timeout to fetch
    const fetchWithTimeout = (url: string, options: RequestInit = {}) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          ...options.headers,
        },
      }).finally(() => clearTimeout(timeoutId))
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch Bitcoin data and global market data in parallel
      const [bitcoinResponse, globalResponse] = await Promise.all([
        fetchWithTimeout(
          "https://api.coingecko.com/api/v3/coins/bitcoin?vs_currency=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_7d_change=true&include_ath=true&include_atl=true&include_high_low_24h=true"
        ),
        fetchWithTimeout("https://api.coingecko.com/api/v3/global"),
      ])

      if (!bitcoinResponse.ok) {
        const errorText = await bitcoinResponse.text()
        throw new Error(`CoinGecko API error: ${bitcoinResponse.status} ${bitcoinResponse.statusText}. ${errorText.substring(0, 100)}`)
      }
      if (!globalResponse.ok) {
        const errorText = await globalResponse.text()
        throw new Error(`CoinGecko Global API error: ${globalResponse.status} ${globalResponse.statusText}. ${errorText.substring(0, 100)}`)
      }

      const bitcoinJson = await bitcoinResponse.json()
      const globalJson = await globalResponse.json()

      // Extract BTC dominance from global data
      const btcDominance = globalJson.data?.market_cap_percentage?.btc || 0

      setBtcData({
        price: bitcoinJson.market_data?.current_price?.usd || 0,
        change24h: bitcoinJson.market_data?.price_change_percentage_24h || 0,
        change7d: bitcoinJson.market_data?.price_change_percentage_7d || 0,
        marketCap: bitcoinJson.market_data?.market_cap?.usd || 0,
        marketCapChange24h: bitcoinJson.market_data?.market_cap_change_percentage_24h || 0,
        volume24h: bitcoinJson.market_data?.total_volume?.usd || 0,
        dominance: btcDominance,
        ath: bitcoinJson.market_data?.ath?.usd || 0,
        atl: bitcoinJson.market_data?.atl?.usd || 0,
        high24h: bitcoinJson.market_data?.high_24h?.usd || 0,
        low24h: bitcoinJson.market_data?.low_24h?.usd || 0,
        lastUpdate: Date.now(),
      })

      setNextUpdate(Date.now() + UPDATE_INTERVAL)
      setIsLoading(false)
    } catch (err: any) {
      console.error("[v0] Bitcoin data fetch error:", err)
      
      // Retry logic for network errors or rate limits
      const isRetryableError = 
        err.name === "AbortError" ||
        err.name === "TimeoutError" || 
        err.message?.includes("429") || 
        err.message?.includes("network") ||
        err.message?.includes("fetch") ||
        err.message?.includes("Failed to fetch")

      if (retryCount < MAX_RETRIES && isRetryableError) {
        console.log(`[v0] Retrying Bitcoin data fetch (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
        setTimeout(() => {
          fetchBitcoinData(retryCount + 1)
        }, RETRY_DELAY * (retryCount + 1))
        return
      }

      // Show user-friendly error message
      const errorMessage = err.message?.includes("429") 
        ? "CoinGecko API rate limit reached. Please wait a moment and refresh."
        : err.name === "AbortError" || err.message?.includes("TimeoutError")
        ? "Request timed out. Please check your internet connection."
        : err.message || "Failed to load Bitcoin data. Please try again later."
      
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBitcoinData()
    const interval = setInterval(fetchBitcoinData, UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  const stats = [
    {
      label: "Market Cap",
      value: `$${(btcData.marketCap / 1e12).toFixed(2)}T`,
      change: btcData.marketCapChange24h ?? null,
    },
    {
      label: "24h Volume",
      value: `$${(btcData.volume24h / 1e9).toFixed(2)}B`,
      change: null,
    },
    {
      label: "BTC Dominance",
      value: `${btcData.dominance.toFixed(2)}%`,
      change: null,
    },
    {
      label: "7d Change",
      value: `${btcData.change7d?.toFixed(2) || "0.00"}%`,
      change: btcData.change7d ?? null,
    },
  ]

  const features = [
    {
      title: "Real-time Price",
      body: "Live BTC price with 3-hour update cycle",
      icon: <TrendingUp size={20} />,
    },
    {
      title: "Market Metrics",
      body: "Comprehensive market cap and volume data",
      icon: <Activity size={20} />,
    },
    {
      title: "Global Coverage",
      body: "Aggregated data from major markets",
      icon: <Globe size={20} />,
    },
    {
      title: "Smart Updates",
      body: "Optimized fetching for better performance",
      icon: <Clock size={20} />,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted to-background">
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary rounded-full opacity-20 blur-lg"></div>
                <div className="relative bg-primary rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                  <span className="text-black font-bold text-lg">₿</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold gradient-text">BitcoinPulse</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Where emotion meets data</p>
              </div>
            </motion.div>

            <nav className="hidden md:flex gap-8 items-center text-sm">
              <a href="/dashboard" className="hover:text-primary transition">
                Sentiment
              </a>
              <a href="/analytics" className="hover:text-primary transition">
                Analytics
              </a>
              <a href="#" className="hover:text-primary transition">
                Alerts
              </a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  setIsLoading(true)
                  fetchBitcoinData()
                }}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                Update
              </motion.button>
            </nav>
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

        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
              Bitcoin insights — price, <span className="gradient-text">emotionaly volatility, metrics</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl leading-relaxed">
              Track Bitcoin’s market emotions in real time. Analyze crowd sentiment through live tweet data to measure collective fear and greed. Stay ahead of market trends and make data-driven decisions with real-time emotional intelligence. 
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition"
                >
                  Start Tracking <ArrowRight size={16} />
                </motion.button>
              </Link>
              <button className="border border-border px-6 py-3 rounded-lg hover:bg-muted transition">View Docs</button>
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glassmorphism p-6 flex flex-col justify-between"
          >
            <PriceWidget btcData={btcData} isLoading={isLoading} />
            {nextUpdate > 0 && <UpdateTimer nextUpdate={nextUpdate} />}
          </motion.div>
        </section>

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Market Metrics */}
        <MarketMetrics btcData={btcData} isLoading={isLoading} />

        {/* Features */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold mb-8">Why BitcoinPulse?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -8 }}
                className="glassmorphism p-6 group cursor-pointer hover:border-primary/50 transition"
              >
                <div className="text-primary group-hover:scale-110 transition mb-4">{feature.icon}</div>
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.body}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          Built with Bitcoin intelligence • Data from CoinGecko • © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
