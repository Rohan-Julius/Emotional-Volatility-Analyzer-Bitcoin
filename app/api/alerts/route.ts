import { NextResponse } from "next/server"

export const runtime = 'nodejs'

interface Alert {
  id: string
  type: "sentiment" | "price" | "volume" | "sentiment_shift"
  severity: "low" | "medium" | "high" | "extreme"
  title: string
  message: string
  timestamp: number
  value?: number
  threshold?: number
}

export async function GET(request: Request) {
  try {
    const alerts: Alert[] = []

    // Fetch current Bitcoin price data
    let btcPrice = 0
    let priceChange24h = 0
    let volume24h = 0
    let marketCap = 0

    try {
      const priceResponse = await fetch(
        "https://api.coingecko.com/api/v3/coins/bitcoin?vs_currency=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true",
        {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(5000),
        }
      )
      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        btcPrice = priceData.market_data?.current_price?.usd || 0
        priceChange24h = priceData.market_data?.price_change_percentage_24h || 0
        volume24h = priceData.market_data?.total_volume?.usd || 0
        marketCap = priceData.market_data?.market_cap?.usd || 0
      }
    } catch (error) {
      console.error("Error fetching Bitcoin price:", error)
    }

    // Fetch current sentiment data
    let currentIndex: number | null = null
    let currentLabel: string | null = null
    let previousIndex: number | null = null

    try {
      const sentimentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/sentiment`,
        {
          signal: AbortSignal.timeout(5000),
        }
      )
      if (sentimentResponse.ok) {
        const sentimentData = await sentimentResponse.json()
        currentIndex = sentimentData.currentIndex
        currentLabel = sentimentData.currentLabel
        
        // Get previous index from history if available
        const history = sentimentData.sentimentHistory || []
        if (history.length >= 2) {
          previousIndex = history[history.length - 2]?.value || null
        }
      }
    } catch (error) {
      console.error("Error fetching sentiment data:", error)
    }

    const now = Date.now()

    // 1. Sentiment-based alerts
    if (currentIndex !== null) {
      // Extreme Fear Alert
      if (currentIndex <= 20) {
        alerts.push({
          id: `sentiment-extreme-fear-${now}`,
          type: "sentiment",
          severity: "extreme",
          title: "🚨 Extreme Fear Detected",
          message: `Fear & Greed Index is at ${currentIndex} (Extreme Fear). This could indicate a potential buying opportunity.`,
          timestamp: now,
          value: currentIndex,
          threshold: 20,
        })
      }
      // Extreme Greed Alert
      else if (currentIndex >= 80) {
        alerts.push({
          id: `sentiment-extreme-greed-${now}`,
          type: "sentiment",
          severity: "extreme",
          title: "💰 Extreme Greed Detected",
          message: `Fear & Greed Index is at ${currentIndex} (Extreme Greed). Market may be overbought.`,
          timestamp: now,
          value: currentIndex,
          threshold: 80,
        })
      }
      // High Fear Alert
      else if (currentIndex <= 30) {
        alerts.push({
          id: `sentiment-fear-${now}`,
          type: "sentiment",
          severity: "high",
          title: "⚠️ High Fear Level",
          message: `Fear & Greed Index is at ${currentIndex} (Fear zone). Market sentiment is negative.`,
          timestamp: now,
          value: currentIndex,
          threshold: 30,
        })
      }
      // High Greed Alert
      else if (currentIndex >= 70) {
        alerts.push({
          id: `sentiment-greed-${now}`,
          type: "sentiment",
          severity: "high",
          title: "📈 High Greed Level",
          message: `Fear & Greed Index is at ${currentIndex} (Greed zone). Market sentiment is positive.`,
          timestamp: now,
          value: currentIndex,
          threshold: 70,
        })
      }

      // Sentiment Shift Alert
      if (previousIndex !== null && currentIndex !== null) {
        const shift = Math.abs(currentIndex - previousIndex)
        if (shift >= 15) {
          const direction = currentIndex > previousIndex ? "increased" : "decreased"
          alerts.push({
            id: `sentiment-shift-${now}`,
            type: "sentiment_shift",
            severity: shift >= 25 ? "high" : "medium",
            title: "🔄 Significant Sentiment Shift",
            message: `Fear & Greed Index ${direction} by ${shift} points (${previousIndex} → ${currentIndex}).`,
            timestamp: now,
            value: currentIndex,
            threshold: previousIndex,
          })
        }
      }
    }

    // 2. Price-based alerts
    if (btcPrice > 0) {
      // Major price milestones
      const milestones = [90000, 95000, 100000, 105000, 110000, 115000, 120000]
      for (const milestone of milestones) {
        if (btcPrice >= milestone && btcPrice < milestone + 1000) {
          alerts.push({
            id: `price-milestone-${milestone}-${now}`,
            type: "price",
            severity: "medium",
            title: `🎯 Price Milestone: $${milestone.toLocaleString()}`,
            message: `Bitcoin has reached $${milestone.toLocaleString()}!`,
            timestamp: now,
            value: btcPrice,
            threshold: milestone,
          })
        }
      }

      // Significant price change alerts
      if (Math.abs(priceChange24h) >= 5) {
        alerts.push({
          id: `price-change-${now}`,
          type: "price",
          severity: Math.abs(priceChange24h) >= 10 ? "high" : "medium",
          title: `📊 Significant Price Movement`,
          message: `Bitcoin price ${priceChange24h >= 0 ? "increased" : "decreased"} by ${Math.abs(priceChange24h).toFixed(2)}% in the last 24 hours.`,
          timestamp: now,
          value: priceChange24h,
          threshold: priceChange24h >= 0 ? 5 : -5,
        })
      }
    }

    // 3. Volume alerts
    if (volume24h > 0) {
      // High volume alert (would need baseline, simplified for now)
      const volumeBillions = volume24h / 1e9
      if (volumeBillions >= 50) {
        alerts.push({
          id: `volume-high-${now}`,
          type: "volume",
          severity: "medium",
          title: "📊 High Trading Volume",
          message: `24h trading volume is $${volumeBillions.toFixed(1)}B, indicating high market activity.`,
          timestamp: now,
          value: volumeBillions,
          threshold: 50,
        })
      }
    }

    // Sort alerts by severity and timestamp (most recent first)
    const severityOrder = { extreme: 0, high: 1, medium: 2, low: 3 }
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      return b.timestamp - a.timestamp
    })

    return NextResponse.json({
      alerts,
      currentPrice: btcPrice,
      currentSentiment: currentIndex,
      currentSentimentLabel: currentLabel,
      priceChange24h,
      volume24h,
      marketCap,
      timestamp: now,
    })
  } catch (error: any) {
    console.error("Error generating alerts:", error)
    return NextResponse.json(
      {
        alerts: [],
        error: "Failed to generate alerts",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

