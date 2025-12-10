"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react"
import Link from "next/link"
import FearGreedChart from "./fear-greed-chart"

interface SentimentData {
  timestamp: number
  value: number
  label: "Fear" | "Neutral" | "Greed"
}

export default function FearGreedDashboard() {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [currentLabel, setCurrentLabel] = useState<"Fear" | "Neutral" | "Greed" | null>(null)

  const fetchSentimentData = async () => {
    try {
      const response = await fetch("/api/sentiment")
      if (!response.ok) throw new Error("Failed to fetch sentiment data")

      const data = await response.json()
      setSentimentData(data.sentimentHistory || [])
      
      if (data.currentIndex !== null) {
        setCurrentIndex(data.currentIndex)
        setCurrentLabel(data.currentLabel)
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching sentiment data:", error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSentimentData()
    // Poll every 15 seconds to match tweet fetching interval
    const interval = setInterval(fetchSentimentData, 15000)
    return () => clearInterval(interval)
  }, [])

  const getLabelColor = (label: "Fear" | "Neutral" | "Greed") => {
    switch (label) {
      case "Fear":
        return "text-red-400"
      case "Neutral":
        return "text-yellow-400"
      case "Greed":
        return "text-green-400"
    }
  }

  const getLabelIcon = (label: "Fear" | "Neutral" | "Greed") => {
    switch (label) {
      case "Fear":
        return <TrendingDown size={24} className="text-red-400" />
      case "Neutral":
        return <Minus size={24} className="text-yellow-400" />
      case "Greed":
        return <TrendingUp size={24} className="text-green-400" />
    }
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
                <h1 className="text-xl sm:text-2xl font-bold gradient-text">Fear & Greed Index</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Real-time sentiment analysis</p>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Current Index Display */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="glassmorphism p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm text-muted-foreground mb-2">Current Fear & Greed Index</h2>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-12 w-32 bg-muted rounded"></div>
                  </div>
                ) : currentIndex !== null ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="text-5xl font-bold font-mono">{currentIndex}</div>
                      {currentLabel && (
                        <div className="flex items-center gap-2">
                          {getLabelIcon(currentLabel)}
                          <span className={`text-2xl font-semibold ${getLabelColor(currentLabel)}`}>
                            {currentLabel}
                          </span>
                        </div>
                      )}
                    </div>
                      <div className="mt-4 w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            currentIndex <= 30
                              ? "bg-red-500"
                              : currentIndex <= 60
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${currentIndex}%` }}
                        ></div>
                      </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glassmorphism p-6"
        >
          <h2 className="text-xl font-bold mb-6">Historical Fear & Greed Index</h2>
          {isLoading ? (
            <div className="animate-pulse h-64 bg-muted rounded"></div>
          ) : sentimentData.length > 0 ? (
            <FearGreedChart data={sentimentData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>No sentiment data available yet. Tweets are being analyzed...</p>
            </div>
          )}
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 glassmorphism p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Index Classification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <div>
                <div className="font-semibold text-red-400">Fear (0-30)</div>
                <div className="text-sm text-muted-foreground">Negative sentiment</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <div>
                <div className="font-semibold text-yellow-400">Neutral (31-60)</div>
                <div className="text-sm text-muted-foreground">Mixed sentiment</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <div>
                <div className="font-semibold text-green-400">Greed (61-100)</div>
                <div className="text-sm text-muted-foreground">Positive sentiment</div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

