import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const runtime = 'nodejs'

interface Tweet {
  id: string
  user: string
  text: string
  likes: number
  retweets: number
  created_at: string
}

export async function GET(request: Request) {
  try {
    const tweetsPath = path.join(process.cwd(), "bitcoin_tweets.json")

    // Check if file exists
    if (!fs.existsSync(tweetsPath)) {
      return NextResponse.json({
        tweets: [],
        totalCount: 0,
        latestTweets: [],
        message: "No tweets file found.",
      })
    }

    // Read and parse tweets
    const fileContent = fs.readFileSync(tweetsPath, "utf-8")
    if (!fileContent.trim()) {
      return NextResponse.json({
        tweets: [],
        totalCount: 0,
        latestTweets: [],
        message: "Tweets file is empty.",
      })
    }

    const tweets: Tweet[] = JSON.parse(fileContent)

    if (!Array.isArray(tweets) || tweets.length === 0) {
      return NextResponse.json({
        tweets: [],
        totalCount: 0,
        latestTweets: [],
        message: "No tweets available.",
      })
    }

    // Get latest 5 tweets (first 5 in array since they're prepended)
    const latestTweets = tweets.slice(0, 5)

    // Calculate statistics
    const totalLikes = tweets.reduce((sum, tweet) => sum + (tweet.likes || 0), 0)
    const totalRetweets = tweets.reduce((sum, tweet) => sum + (tweet.retweets || 0), 0)
    const uniqueUsers = new Set(tweets.map(tweet => tweet.user)).size

    // Get date range
    const dates = tweets
      .map(tweet => tweet.created_at ? new Date(tweet.created_at).getTime() : 0)
      .filter(time => time > 0)
      .sort((a, b) => a - b)
    
    const oldestDate = dates.length > 0 ? new Date(dates[0]) : null
    const newestDate = dates.length > 0 ? new Date(dates[dates.length - 1]) : null

    return NextResponse.json({
      tweets,
      totalCount: tweets.length,
      latestTweets,
      statistics: {
        totalTweets: tweets.length,
        totalLikes,
        totalRetweets,
        averageLikes: tweets.length > 0 ? Math.round(totalLikes / tweets.length) : 0,
        averageRetweets: tweets.length > 0 ? Math.round(totalRetweets / tweets.length) : 0,
        uniqueUsers,
        oldestTweet: oldestDate?.toISOString() || null,
        newestTweet: newestDate?.toISOString() || null,
      },
    })
  } catch (error: any) {
    console.error("Error reading tweets:", error)
    return NextResponse.json(
      {
        error: "Failed to read tweets",
        message: error?.message || "Unknown error",
        tweets: [],
        totalCount: 0,
        latestTweets: [],
      },
      { status: 500 }
    )
  }
}

