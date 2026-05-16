import { db } from "@/lib/db"
import { createZone, deleteZone, toggleZoneActive } from "@/app/actions/zones"

export default async function AdminZonesPage() {
  const zones = await db.zone.findMany({
    orderBy: [{ city: "asc" }, { name: "asc" }],
    include: { _count: { select: { restaurants: true, users: true } } },
  })

  const byCity = zones.reduce<Record<string, typeof zones>>((acc, z) => {
    if (!acc[z.city]) acc[z.city] = []
    acc[z.city].push(z)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Zonas de cobertura</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Define los barrios y sectores donde opera PideYa</p>
      </div>

      {/* Crear zona */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
        <p className="font-black text-sm text-zinc-500 uppercase tracking-widest mb-4">+ Nueva zona</p>
        <form action={createZone} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500">Barrio / Sector</label>
              <input name="name" placeholder="Ej: Barrio El Pinal" required
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500">Ciudad</label>
              <input name="city" placeholder="Ej: Bogotá" required
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400" />
            </div>
          </div>
          <button type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl py-3 text-sm transition-colors">
            Crear zona
          </button>
        </form>
      </div>

      {/* Lista de zonas */}
      {zones.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-100 p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-zinc-500 font-semibold">Sin zonas aún</p>
          <p className="text-zinc-400 text-sm mt-1">Agrega las primeras zonas de cobertura</p>
        </div>
      ) : (
        Object.entries(byCity).map(([city, cityZones]) => (
          <div key={city} className="space-y-2">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1">{city}</p>
            <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm divide-y divide-zinc-50">
              {cityZones.map(zone => (
                <div key={zone.id} className="flex items-center gap-3 px-5 py-4">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${zone.active ? "bg-green-400" : "bg-zinc-300"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-zinc-900">{zone.name}</p>
                    <p className="text-xs text-zinc-400">
                      {zone._count.restaurants} restaurante{zone._count.restaurants !== 1 ? "s" : ""} ·{" "}
                      {zone._count.users} cliente{zone._count.users !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <form action={toggleZoneActive.bind(null, zone.id, !zone.active)}>
                      <button type="submit" className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
                        zone.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}>
                        {zone.active ? "Activa" : "Inactiva"}
                      </button>
                    </form>
                    <form action={deleteZone.bind(null, zone.id)}>
                      <button type="submit" className="text-xs text-red-400 hover:text-red-600 font-medium">Eliminar</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
