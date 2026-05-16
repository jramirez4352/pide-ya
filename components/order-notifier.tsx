"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

export function OrderNotifier({ restaurantId }: { restaurantId: string }) {
  const router = useRouter()
  const [newOrders, setNewOrders] = useState(0)
  const lastCountRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Crear audio context para el sonido de notificación
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
        const res = await fetch(`/api/restaurant/pending-count?id=${restaurantId}`)
        if (!res.ok) return
        const { count } = await res.json()
        if (lastCountRef.current !== null && count > lastCountRef.current) {
          playSound()
          setNewOrders(count)
          if (Notification.permission === "granted") {
            new Notification("¡Nuevo pedido! 🛍️", {
              body: `Tienes ${count} pedido${count !== 1 ? "s" : ""} pendiente${count !== 1 ? "s" : ""}`,
              icon: "/favicon.ico",
            })
          }
          router.refresh()
        } else {
          setNewOrders(count)
        }
        lastCountRef.current = count
      } catch {}
    }

    // Pedir permiso de notificaciones
    if (Notification.permission === "default") {
      Notification.requestPermission()
    }

    checkOrders()
    const interval = setInterval(checkOrders, 30000) // cada 30 segundos
    return () => clearInterval(interval)
  }, [restaurantId, router])

  if (newOrders === 0) return null

  return (
    <div className="fixed top-16 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
      <div className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg shadow-orange-300 flex items-center gap-2 pointer-events-auto animate-bounce">
        <span>🛍️</span>
        {newOrders} pedido{newOrders !== 1 ? "s" : ""} pendiente{newOrders !== 1 ? "s" : ""}
      </div>
    </div>
  )
}
