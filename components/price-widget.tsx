"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PriceWidgetProps {
  btcData: {
    price: number
    change24h: number
    high24h?: number
    low24h?: number
  }
  isLoading: boolean
}

export default function PriceWidget({ btcData, isLoading }: PriceWidgetProps) {
  const isPositive = btcData.change24h >= 0

  if (isLoading && btcData.price === 0) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-3/4"></div>
        <div className="h-12 bg-muted rounded w-full"></div>
        <div className="h-6 bg-muted rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground text-sm">Live BTC Price</div>

      <motion.div
        key={btcData.price}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="text-4xl sm:text-5xl font-bold"
      >
        ${btcData.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </motion.div>

      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? "text-success" : "text-danger"}`}>
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {isPositive ? "+" : ""}
          {btcData.change24h.toFixed(2)}% (24h)
        </div>
      </div>

      {btcData.high24h && btcData.low24h && (
        <div className="space-y-2 pt-4 border-t border-border/50">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>24h High</span>
            <span>${btcData.high24h.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>24h Low</span>
            <span>${btcData.low24h.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      )}
    </div>
  )
}
