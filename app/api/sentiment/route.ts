import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Use Python backend for sentiment analysis (PyTorch model support)
export const runtime = 'nodejs'

interface Tweet {
  id: string
  text: string
  created_at?: string
  timestamp?: number
}

interface SentimentResult {
  timestamp: number
  value: number
  label: "Fear" | "Neutral" | "Greed"
}

// Use Python backend for sentiment analysis (PyTorch model support)
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000"

// Check if Python API is available
async function checkPythonAPI(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_API_URL}/`, { 
      signal: AbortSignal.timeout(2000) // 2 second timeout
    })
    return response.ok
  } catch (error) {
    return false
  }
}

// Call Python backend for sentiment analysis
async function analyzeSentimentPython(text: string): Promise<any[]> {
  const response = await fetch(`${PYTHON_API_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  })
  
  if (!response.ok) {
    throw new Error(`Python API error: ${response.status} ${response.statusText}`)
  }
  
  return await response.json()
}

// Analyze sentiment and return the predicted class (0 = negative, 1 = positive)
async function analyzeSentiment(text: string, debug: boolean = false): Promise<0 | 1> {
  try {
    if (debug) {
      console.log(`📝 Analyzing tweet: "${text.substring(0, 100)}..."`)
    }
    
    // Call Python backend
    const result = await analyzeSentimentPython(text)
    
    if (debug) {
      console.log(`🔍 Model output:`, JSON.stringify(result, null, 2))
    }
    
    // Get the top prediction (class with highest probability)
    const topPrediction = result[0]
    const topLabel = String(topPrediction.label).toLowerCase()
    
    // Extract class index from label (e.g., "LABEL_0" → 0, "LABEL_1" → 1)
    const classMatch = topLabel.match(/(\d+)/)
    const classIndex = classMatch ? parseInt(classMatch[1]) : null
    
    if (classIndex === null) {
      console.warn(`⚠️ Could not parse class index from label: ${topLabel}`)
      // Fallback: try to infer from label text
      if (topLabel.includes("negative") || topLabel.includes("fear") || topLabel === "0") {
        return 0
      } else if (topLabel.includes("positive") || topLabel.includes("greed") || topLabel === "1") {
        return 1
      } else {
        console.error(`❌ Unknown label format: ${topLabel}, defaulting to 0`)
        return 0
      }
    }
    
    // Return the class index (0 or 1)
    if (classIndex === 0 || classIndex === 1) {
      if (debug) {
        console.log(`📊 Tweet classified as: ${classIndex} (${classIndex === 0 ? "Negative" : "Positive"}), Confidence: ${topPrediction.score?.toFixed(3) || "N/A"}`)
      }
      return classIndex as 0 | 1
    } else {
      console.error(`❌ Unknown class index: ${classIndex}, defaulting to 0`)
      return 0
    }
  } catch (error: any) {
    console.error("❌ Error analyzing sentiment with model:", error)
    // Fallback to negative (0) if model fails
    return 0
  }
}

function classifySentiment(value: number): "Fear" | "Neutral" | "Greed" {
  // Fear & Greed Index classification:
  // 0-30 → Fear
  // 31-60 → Neutral
  // 61-100 → Greed
  if (value <= 30) return "Fear"
  if (value <= 60) return "Neutral"
  return "Greed"
}

export async function GET(request: Request) {
  try {
    // Check for debug parameter
    const { searchParams } = new URL(request.url)
    const debug = searchParams.get("debug") === "true"
    
    if (debug) {
      console.log("🔍 Debug mode enabled - showing detailed model predictions")
    }
    
    // Check if Python API is available
    const pythonAvailable = await checkPythonAPI()
    if (!pythonAvailable) {
      return NextResponse.json(
        {
          error: "Python sentiment API is not available",
          message: "Please start the Python API server by running: python sentiment_api.py",
          sentimentHistory: [],
          currentIndex: null,
          currentLabel: null,
        },
        { status: 503 }
      )
    }
    
    console.log(`📥 API request received - Using Python backend at ${PYTHON_API_URL}`)
    
    const tweetsPath = path.join(process.cwd(), "bitcoin_tweets.json")

    // Check if file exists
    if (!fs.existsSync(tweetsPath)) {
      return NextResponse.json({
        sentimentHistory: [],
        currentIndex: null,
        currentLabel: null,
        message: "No tweets file found. Waiting for tweets to be collected...",
      }, { status: 200 })
    }

    // Read and parse tweets
    const fileContent = fs.readFileSync(tweetsPath, "utf-8")
    if (!fileContent.trim()) {
      return NextResponse.json({
        sentimentHistory: [],
        currentIndex: null,
        currentLabel: null,
        message: "Tweets file is empty.",
      })
    }

    const tweets: Tweet[] = JSON.parse(fileContent)

    if (!Array.isArray(tweets) || tweets.length === 0) {
      return NextResponse.json({
        sentimentHistory: [],
        currentIndex: null,
        currentLabel: null,
        message: "No tweets available.",
      })
    }

    // Analyze each tweet and classify as 0 (negative) or 1 (positive)
    const tweetsToAnalyze = tweets.filter((tweet) => tweet.text)
    
    if (tweetsToAnalyze.length === 0) {
      return NextResponse.json({
        sentimentHistory: [],
        currentIndex: null,
        currentLabel: null,
        message: "No tweets with text to analyze.",
      })
    }
    
    // Process tweets in batches to avoid overwhelming the model
    const classifications: Array<{ tweet: Tweet, class: 0 | 1 }> = []
    const batchSize = 10
    
    for (let i = 0; i < tweetsToAnalyze.length; i += batchSize) {
      const batch = tweetsToAnalyze.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (tweet, idx) => {
          // Only debug first tweet of first batch
          const shouldDebug = debug && i === 0 && idx === 0
          const classResult = await analyzeSentiment(tweet.text, shouldDebug)
          return { tweet, class: classResult }
        })
      )
      
      if (debug && i === 0) {
        console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1} - ${batchResults.length} tweets analyzed`)
      }
      classifications.push(...batchResults)
    }
    
    // Calculate Fear & Greed Index = percentage of positive tweets (class 1)
    const positiveCount = classifications.filter(c => c.class === 1).length
    const totalCount = classifications.length
    const currentIndex = Math.round((positiveCount / totalCount) * 100)
    const currentLabel = classifySentiment(currentIndex)
    
    // Create sentiment history with timestamps for charting
    // Group tweets by time intervals (every 2 minutes) to create data points
    const sentimentResults: SentimentResult[] = []
    const intervalMs = 2 * 60 * 1000 // 2 minutes in milliseconds
    
    // Group classifications by time interval
    const groupedByInterval = new Map<number, number[]>()
    
    classifications.forEach(({ tweet, class: classResult }) => {
      const timestamp = tweet.timestamp || (tweet.created_at ? new Date(tweet.created_at).getTime() : Date.now())
      const intervalKey = Math.floor(timestamp / intervalMs) * intervalMs
      
      if (!groupedByInterval.has(intervalKey)) {
        groupedByInterval.set(intervalKey, [])
      }
      groupedByInterval.get(intervalKey)!.push(classResult)
    })
    
    // Calculate index for each interval
    groupedByInterval.forEach((classes, intervalKey) => {
      const positiveInInterval = classes.filter(c => c === 1).length
      const intervalIndex = Math.round((positiveInInterval / classes.length) * 100)
      
      sentimentResults.push({
        timestamp: intervalKey,
        value: intervalIndex,
        label: classifySentiment(intervalIndex),
      })
    })
    
    sentimentResults.sort((a, b) => a.timestamp - b.timestamp) // Sort by timestamp

    console.log(`✅ Sentiment analysis complete: ${totalCount} tweets analyzed`)
    console.log(`   Positive tweets: ${positiveCount} (${((positiveCount / totalCount) * 100).toFixed(1)}%)`)
    console.log(`   Current Fear & Greed Index: ${currentIndex} (${currentLabel})`)

    return NextResponse.json({
      sentimentHistory: sentimentResults,
      currentIndex,
      currentLabel,
      totalTweets: tweets.length,
      analyzedTweets: totalCount,
      positiveTweets: positiveCount,
      negativeTweets: totalCount - positiveCount,
      positivePercentage: ((positiveCount / totalCount) * 100).toFixed(1),
      modelUsed: pythonAvailable,
      backend: "Python FastAPI",
      debug: debug ? {
        pythonBackend: pythonAvailable,
        pythonApiUrl: PYTHON_API_URL,
        sampleClassifications: classifications.slice(0, 5).map(c => ({
          text: c.tweet.text.substring(0, 50) + "...",
          class: c.class,
        })),
      } : undefined,
    })
  } catch (error: any) {
    console.error("Error processing sentiment:", error)
    return NextResponse.json(
      {
        error: "Failed to process sentiment data",
        message: error?.message || "Unknown error",
        sentimentHistory: [],
        currentIndex: null,
        currentLabel: null,
      },
      { status: 500 }
    )
  }
}

