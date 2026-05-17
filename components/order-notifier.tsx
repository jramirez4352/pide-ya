"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

export function OrderNotifier({ restaurantId }: { restaurantId: string }) {
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)
  const lastCountRef = useRef<number | null>(null)

  useEffect(() => {
    function playSound() {
      try {
        const ctx = new AudioContext()
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        oscillator.connect(gain)
        gain.connect(ctx.destination)
        oscillator.frequency.setValueAtTime(880, ctx.currentTime)
        oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.5)
      } catch {}
    }

    async function checkOrders() {
      try {
        const res = await fetch(`/api/restaurant/pending-count?id=${restaurantId}`, { cache: "no-store" })
        if (!res.ok) return
        const { count } = await res.json()
        if (lastCountRef.current !== null && count > lastCountRef.current) {
          playSound()
          if (Notification.permission === "granted") {
            new Notification("¡Nuevo pedido! 🛍️", {
              body: `Tienes ${count} pedido${count !== 1 ? "s" : ""} pendiente${count !== 1 ? "s" : ""}`,
              icon: "/favicon.ico",
            })
          }
          router.refresh()
        } else if (count !== lastCountRef.current) {
          router.refresh()
        }
        lastCountRef.current = count
        setPendingCount(count)
      } catch {}
    }

    if (Notification.permission === "default") {
      Notification.requestPermission()
    }

    checkOrders()
    const interval = setInterval(checkOrders, 20000) // cada 20 segundos
    return () => clearInterval(interval)
  }, [restaurantId, router])

  if (pendingCount === 0) return null

  return (
    <div className="fixed top-16 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
      <div className="bg-orange-500 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-orange-300 flex items-center gap-2 pointer-events-auto animate-bounce">
        <span className="bg-white text-orange-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-black flex-shrink-0">
          {pendingCount}
        </span>
        pedido{pendingCount !== 1 ? "s" : ""} nuevo{pendingCount !== 1 ? "s" : ""} esperando
      </div>
    </div>
  )
}
