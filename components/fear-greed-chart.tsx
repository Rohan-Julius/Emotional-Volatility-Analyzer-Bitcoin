"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface SentimentData {
  timestamp: number
  value: number
  label: "Fear" | "Neutral" | "Greed"
}

interface FearGreedChartProps {
  data: SentimentData[]
}

export default function FearGreedChart({ data }: FearGreedChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: item.value,
      label: item.label,
    }))
  }, [data])

  const getColor = (value: number) => {
    if (value <= 30) return "#ef4444" // red for Fear
    if (value <= 60) return "#eab308" // yellow for Neutral
    return "#22c55e" // green for Greed
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{data.time}</p>
          <p className="text-lg font-bold">
            Index: <span style={{ color: getColor(data.value) }}>{data.value}</span>
          </p>
          <p className="text-sm" style={{ color: getColor(data.value) }}>
            {data.label}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.05 250)" />
        <XAxis
          dataKey="time"
          stroke="oklch(0.68 0 0)"
          tick={{ fill: "oklch(0.68 0 0)" }}
          style={{ fontSize: "12px" }}
        />
        <YAxis
          domain={[0, 100]}
          stroke="oklch(0.68 0 0)"
          tick={{ fill: "oklch(0.68 0 0)" }}
          style={{ fontSize: "12px" }}
        />
        <Tooltip content={<CustomTooltip />} />
        {/* Reference lines for Fear/Neutral/Greed boundaries */}
        <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
        <ReferenceLine y={60} stroke="#eab308" strokeDasharray="3 3" opacity={0.5} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#FFC107"
          strokeWidth={2}
          dot={{ fill: "#FFC107", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

