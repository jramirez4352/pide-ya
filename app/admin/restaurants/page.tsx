import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { ZoneAssigner } from "./zone-assigner"

async function setStatus(id: string, status: string) {
  "use server"
  await db.restaurant.update({ where: { id }, data: { status } })
  revalidatePath("/admin/restaurants")
  revalidatePath("/admin")
}

export default async function AdminRestaurantsPage() {
  const [pending, approved, rejected, zones] = await Promise.all([
    db.restaurant.findMany({
      where: { status: "PENDING" },
      include: { owner: { select: { name: true, email: true, phone: true } }, zones: true },
      orderBy: { createdAt: "desc" },
    }),
    db.restaurant.findMany({
      where: { status: "APPROVED" },
      include: { owner: { select: { name: true, email: true } }, zones: true, _count: { select: { orders: true } } },
      orderBy: { name: "asc" },
    }),
    db.restaurant.findMany({
      where: { status: "REJECTED" },
      include: { owner: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.zone.findMany({ where: { active: true }, orderBy: [{ city: "asc" }, { name: "asc" }] }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Restaurantes</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Aprueba solicitudes y asigna zonas de cobertura</p>
      </div>

      {zones.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 text-sm text-yellow-700">
          ⚠️ No tienes zonas creadas. <a href="/admin/zones" className="font-bold underline">Crea zonas primero</a> para asignarlas a los restaurantes.
        </div>
      )}

      {/* Pendientes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">⏳</span>
          <h2 className="font-bold text-zinc-900">Solicitudes pendientes</h2>
          {pending.length > 0 && <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>}
        </div>
        {pending.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-100 p-8 text-center shadow-sm">
            <p className="text-3xl mb-2">✅</p><p className="text-sm text-zinc-400">No hay solicitudes pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(r => (
              <div key={r.id} className="bg-white rounded-3xl border border-orange-100 p-5 shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">🍴</div>
                  <div className="flex-1">
                    <p className="font-black text-zinc-900">{r.name}</p>
                    <p className="text-sm text-zinc-500">📍 {r.address}</p>
                    <p className="text-sm text-zinc-500">📞 {r.phone}</p>
                  </div>
                </div>
                <div className="bg-zinc-50 rounded-2xl p-3 space-y-1 text-sm">
                  <p className="text-xs font-black text-zinc-400 uppercase tracking-wide mb-2">Propietario</p>
                  <p className="font-medium text-zinc-900">{r.owner.name}</p>
                  <p className="text-zinc-500">{r.owner.email}</p>
                  {r.owner.phone && <p className="text-zinc-500">{r.owner.phone}</p>}
                </div>

                {/* Asignación de zonas */}
                <ZoneAssigner restaurantId={r.id} allZones={zones} currentZoneIds={r.zones.map(z => z.id)} />

                <div className="flex gap-2">
                  <form action={setStatus.bind(null, r.id, "APPROVED")} className="flex-1">
                    <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl py-3 text-sm transition-colors shadow-sm">
                      ✓ Aprobar
                    </button>
                  </form>
                  <form action={setStatus.bind(null, r.id, "REJECTED")} className="flex-1">
                    <button type="submit" className="w-full bg-white hover:bg-red-50 text-red-500 border border-red-200 font-bold rounded-2xl py-3 text-sm transition-colors">
                      ✕ Rechazar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Aprobados */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🟢</span>
          <h2 className="font-bold text-zinc-900">Restaurantes activos</h2>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{approved.length}</span>
        </div>
        {approved.length === 0 ? (
          <p className="text-sm text-zinc-400 px-1">Ninguno aprobado aún</p>
        ) : (
          <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm divide-y divide-zinc-50">
            {approved.map(r => (
              <div key={r.id} className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-zinc-900">{r.name}</p>
                    <p className="text-xs text-zinc-400">{r.owner.email} · {r._count.orders} pedidos</p>
                  </div>
                  <form action={setStatus.bind(null, r.id, "REJECTED")}>
                    <button type="submit" className="text-xs text-red-400 hover:text-red-600 font-medium">Suspender</button>
                  </form>
                </div>
                {/* Zonas del restaurante */}
                <div className="flex flex-wrap gap-1.5">
                  {r.zones.length === 0
                    ? <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">Sin zonas asignadas</span>
                    : r.zones.map(z => <span key={z.id} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">{z.name}</span>)
                  }
                </div>
                <ZoneAssigner restaurantId={r.id} allZones={zones} currentZoneIds={r.zones.map(z => z.id)} compact />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rechazados */}
      {rejected.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔴</span>
            <h2 className="font-bold text-zinc-900">Rechazados</h2>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{rejected.length}</span>
          </div>
          <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm opacity-70 divide-y divide-zinc-50">
            {rejected.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-zinc-900">{r.name}</p>
                  <p className="text-xs text-zinc-400">{r.owner.email}</p>
                </div>
                <form action={setStatus.bind(null, r.id, "APPROVED")}>
                  <button type="submit" className="text-xs text-green-600 hover:text-green-700 font-medium">Reactivar</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
