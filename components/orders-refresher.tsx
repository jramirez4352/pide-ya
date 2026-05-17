"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Refresca la página cada 30s si hay pedidos activos, para que el cliente
// vea el estado actualizado sin tener que recargar manualmente.
export function OrdersRefresher() {
  const router = useRouter()
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 30000)
    return () => clearInterval(interval)
  }, [router])
  return null
}
