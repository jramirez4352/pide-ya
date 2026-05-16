"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

const DAYS = [
  { key: "mon", label: "Lunes" }, { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" }, { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" }, { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
]

type DaySchedule = { open: boolean; from: string; to: string }
type Schedule = Record<string, DaySchedule>

function parseSchedule(raw: string | null): Schedule {
  const defaults: Schedule = {}
  DAYS.forEach(d => { defaults[d.key] = { open: false, from: "08:00", to: "22:00" } })
  if (!raw) return defaults
  try {
    const parsed = JSON.parse(raw)
    DAYS.forEach(d => {
      if (parsed[d.key]) defaults[d.key] = parsed[d.key]
    })
  } catch {}
  return defaults
}

export function ScheduleForm({ restaurant }: { restaurant: { id: string; schedule: string | null; isOpen: boolean; name: string } }) {
  const router = useRouter()
  const [schedule, setSchedule] = useState<Schedule>(parseSchedule(restaurant.schedule))
  const [isOpen, setIsOpen] = useState(restaurant.isOpen)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function updateDay(key: string, field: keyof DaySchedule, value: string | boolean) {
    setSchedule(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const res = await fetch("/api/restaurant/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule, isOpen }),
      })
      if (res.ok) { setSaved(true); router.refresh() }
    })
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-black text-zinc-900">Horarios de atención</h1>
        <p className="text-zinc-400 text-sm">Los clientes solo podrán pedir cuando estés abierto</p>
      </div>

      {/* Toggle abierto/cerrado ahora */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-zinc-900">Estado ahora</p>
            <p className="text-sm text-zinc-400 mt-0.5">{isOpen ? "Visible y aceptando pedidos" : "Cerrado — no apareces en el listado"}</p>
          </div>
          <button
            onClick={() => { setIsOpen(v => !v); setSaved(false) }}
            className={`w-14 h-7 rounded-full transition-colors relative flex-shrink-0 ${isOpen ? "bg-green-500" : "bg-zinc-200"}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isOpen ? "left-7" : "left-0.5"}`} />
          </button>
        </div>
        <div className={`mt-3 text-center text-sm font-bold py-2 rounded-xl ${isOpen ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {isOpen ? "🟢 Abierto" : "🔴 Cerrado"}
        </div>
      </div>

      {/* Horario por días */}
      <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-50">
          <p className="font-black text-zinc-900">Horario semanal</p>
          <p className="text-xs text-zinc-400 mt-0.5">Activa los días que trabajas y define las horas</p>
        </div>
        <div className="divide-y divide-zinc-50">
          {DAYS.map(day => {
            const s = schedule[day.key]
            return (
              <div key={day.key} className={`flex items-center gap-3 px-5 py-3.5 ${!s.open ? "opacity-50" : ""}`}>
                <button
                  onClick={() => updateDay(day.key, "open", !s.open)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${s.open ? "bg-orange-500" : "bg-zinc-200"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${s.open ? "left-5" : "left-0.5"}`} />
                </button>
                <p className="text-sm font-bold text-zinc-900 w-24">{day.label}</p>
                {s.open ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={s.from} onChange={e => updateDay(day.key, "from", e.target.value)}
                      className="flex-1 rounded-xl border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-zinc-50" />
                    <span className="text-zinc-400 text-sm">a</span>
                    <input type="time" value={s.to} onChange={e => updateDay(day.key, "to", e.target.value)}
                      className="flex-1 rounded-xl border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-zinc-50" />
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 flex-1">Cerrado</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className={`w-full font-black rounded-2xl py-4 text-sm transition-all ${
          saved ? "bg-green-500 text-white" : "text-white"
        }`}
        style={{ background: saved ? undefined : "linear-gradient(135deg,#f97316,#ea580c)" }}
      >
        {isPending ? "Guardando..." : saved ? "✓ Guardado" : "Guardar horarios"}
      </button>
    </div>
  )
}
