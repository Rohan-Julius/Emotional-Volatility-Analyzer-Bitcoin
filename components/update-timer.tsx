"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

export default function UpdateTimer({ nextUpdate }: { nextUpdate: number }) {
  const [timeLeft, setTimeLeft] = useState<string>("")

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const diff = nextUpdate - now

      if (diff <= 0) {
        setTimeLeft("Updating...")
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [nextUpdate])

  return (
    <div className="mt-6 pt-4 border-t border-border/50 text-xs text-muted-foreground">
      <div className="flex items-center gap-2 mb-1">
        <Clock size={14} />
        <span>Next update in</span>
      </div>
      <div className="font-mono text-primary">{timeLeft}</div>
    </div>
  )
}
