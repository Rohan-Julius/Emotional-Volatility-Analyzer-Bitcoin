"use client"

import { motion } from "framer-motion"
import { Award, TrendingUp } from "lucide-react"

interface MarketMetricsProps {
  btcData: {
    ath?: number
    atl?: number
    marketCap: number
  }
  isLoading: boolean
}

export default function MarketMetrics({ btcData, isLoading }: MarketMetricsProps) {
  const metrics = [
    {
      label: "All-Time High",
      value: `$${btcData.ath?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "—"}`,
      icon: <Award size={20} />,
    },
    {
      label: "All-Time Low",
      value: `$${btcData.atl?.toLocaleString("en-US", { maximumFractionDigits: 2 }) || "—"}`,
      icon: <TrendingUp size={20} />,
    },
    {
      label: "Market Cap",
      value: `$${(btcData.marketCap / 1e12).toFixed(2)}T`,
      icon: <Award size={20} />,
    },
  ]

  return (
    <section className="mt-12">
      <h3 className="text-xl font-bold mb-6">Market Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 * index }}
            className="glassmorphism p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm text-muted-foreground font-semibold">{metric.label}</h4>
              <div className="text-primary/50">{metric.icon}</div>
            </div>
            <div className="text-3xl font-bold font-mono">{metric.value}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
