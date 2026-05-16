"use client"

import { useState, useTransition } from "react"
import { setUserZone } from "@/app/actions/zones"

type Zone = { id: string; name: string; city: string }

export function ZonePicker({
  currentZone,
  allZones,
}: {
  currentZone: Zone | null
  allZones: Zone[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (allZones.length === 0) return null

  function select(zoneId: string) {
    startTransition(async () => {
      await setUserZone(zoneId)
      setOpen(false)
    })
  }

  const byCity = allZones.reduce<Record<string, Zone[]>>((acc, z) => {
    if (!acc[z.city]) acc[z.city] = []
    acc[z.city].push(z)
    return acc
  }, {})

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-4 flex items-center gap-3 bg-white rounded-2xl border border-zinc-200 px-4 py-3 hover:border-orange-300 transition-colors"
      >
        <span className="text-xl">📍</span>
        <div className="flex-1 text-left">
          <p className="text-xs text-zinc-400 font-medium">Tu zona</p>
          <p className={`text-sm font-black ${currentZone ? "text-zinc-900" : "text-orange-500"}`}>
            {currentZone ? `${currentZone.name}, ${currentZone.city}` : "Selecciona tu barrio"}
          </p>
        </div>
        <span className="text-zinc-400 text-sm">›</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-black text-zinc-900">¿En qué zona estás?</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Solo verás restaurantes que lleguen a tu barrio</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {isPending ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                Object.entries(byCity).map(([city, cityZones]) => (
                  <div key={city}>
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">{city}</p>
                    <div className="space-y-2">
                      {cityZones.map(zone => (
                        <button
                          key={zone.id}
                          onClick={() => select(zone.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
                            currentZone?.id === zone.id
                              ? "border-orange-400 bg-orange-50"
                              : "border-zinc-200 bg-white hover:border-orange-200"
                          }`}
                        >
                          <span className="text-lg">{currentZone?.id === zone.id ? "⭐" : "📍"}</span>
                          <span className="font-bold text-sm text-zinc-900">{zone.name}</span>
                          {currentZone?.id === zone.id && (
                            <span className="ml-auto text-xs text-orange-500 font-bold">Actual</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
