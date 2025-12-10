"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

interface Stat {
  label: string
  value: string
  change: number | null
}

export default function StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <section className="mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 * index }}
            className="glassmorphism p-6 group hover:border-primary/50 transition"
          >
            <div className="text-sm text-muted-foreground mb-3">{stat.label}</div>
            <div className="text-2xl font-bold mb-2 font-mono">{stat.value}</div>
            {stat.change !== null && (
              <div className={`flex items-center gap-1 text-sm ${stat.change >= 0 ? "text-success" : "text-danger"}`}>
                {stat.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stat.change >= 0 ? "+" : ""}
                {stat.change.toFixed(2)}%
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
