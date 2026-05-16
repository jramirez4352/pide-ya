"use client"

import { useState, useTransition } from "react"
import { setRestaurantZones } from "@/app/actions/zones"

type Zone = { id: string; name: string; city: string }

export function ZoneAssigner({
  restaurantId,
  allZones,
  currentZoneIds,
  compact = false,
}: {
  restaurantId: string
  allZones: Zone[]
  currentZoneIds: string[]
  compact?: boolean
}) {
  const [selected, setSelected] = useState<string[]>(currentZoneIds)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id])
    setSaved(false)
  }

  function save() {
    startTransition(async () => {
      await setRestaurantZones(restaurantId, selected)
      setSaved(true)
    })
  }

  const byCity = allZones.reduce<Record<string, Zone[]>>((acc, z) => {
    if (!acc[z.city]) acc[z.city] = []
    acc[z.city].push(z)
    return acc
  }, {})

  if (allZones.length === 0) return null

  return (
    <div className={compact ? "space-y-2" : "space-y-3 bg-zinc-50 rounded-2xl p-4"}>
      <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">
        Zonas de cobertura
      </p>
      <div className="space-y-2">
        {Object.entries(byCity).map(([city, cityZones]) => (
          <div key={city}>
            <p className="text-xs font-semibold text-zinc-400 mb-1.5">{city}</p>
            <div className="flex flex-wrap gap-2">
              {cityZones.map(zone => {
                const isSelected = selected.includes(zone.id)
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => toggle(zone.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all ${
                      isSelected
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-zinc-500 border-zinc-200 hover:border-orange-300"
                    }`}
                  >
                    {isSelected ? "✓ " : ""}{zone.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={save}
        disabled={isPending}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
          saved
            ? "bg-green-100 text-green-700"
            : "bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50"
        }`}
      >
        {isPending ? "Guardando..." : saved ? "✓ Zonas guardadas" : "Guardar zonas"}
      </button>
    </div>
  )
}
