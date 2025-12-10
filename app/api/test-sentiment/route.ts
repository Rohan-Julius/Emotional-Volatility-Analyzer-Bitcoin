import { NextResponse } from "next/server"
import { pipeline } from "@xenova/transformers"

let sentimentPipeline: any = null

async function getSentimentPipeline() {
  if (!sentimentPipeline) {
    console.log("🤖 Loading Hugging Face model for testing...")
    sentimentPipeline = await pipeline(
      "text-classification",
      "rohan10juli/bertweet-finetuned-bitcoin",
      {
        quantized: false,
      }
    )
    console.log("✅ Model loaded for testing")
  }
  return sentimentPipeline
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get("text") || "Bitcoin is going to the moon! 🚀"

    console.log(`🧪 Testing model with text: "${text}"`)

    const classifier = await getSentimentPipeline()
    const result = await classifier(text, { topk: 3 })

    console.log(`📊 Model output:`, JSON.stringify(result, null, 2))

    return NextResponse.json({
      success: true,
      inputText: text,
      modelOutput: result,
      modelInfo: {
        modelId: "rohan10juli/bertweet-finetuned-bitcoin",
        loaded: !!sentimentPipeline,
      },
    })
  } catch (error: any) {
    console.error("❌ Test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error",
        details: error?.stack,
      },
      { status: 500 }
    )
  }
}

