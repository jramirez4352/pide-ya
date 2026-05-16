import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

async function setStatus(id: string, status: string) {
  "use server"
  await db.restaurant.update({ where: { id }, data: { status } })
  revalidatePath("/admin/restaurants")
  revalidatePath("/admin")
}

export default async function AdminRestaurantsPage() {
  const [pending, approved, rejected] = await Promise.all([
    db.restaurant.findMany({ where: { status: "PENDING" }, include: { owner: { select: { name: true, email: true, phone: true } } }, orderBy: { createdAt: "desc" } }),
    db.restaurant.findMany({ where: { status: "APPROVED" }, include: { owner: { select: { name: true, email: true } }, _count: { select: { orders: true } } }, orderBy: { name: "asc" } }),
    db.restaurant.findMany({ where: { status: "REJECTED" }, include: { owner: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Restaurantes</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Gestiona las solicitudes y restaurantes activos</p>
      </div>

      {/* Pendientes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">⏳</span>
          <h2 className="font-bold text-zinc-900">Solicitudes pendientes</h2>
          {pending.length > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-100 p-8 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-sm text-zinc-400">No hay solicitudes pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="bg-white rounded-3xl border border-orange-100 p-5 shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">🍴</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900">{r.name}</p>
                    <p className="text-sm text-zinc-500">{r.address}</p>
                    <p className="text-sm text-zinc-500">📞 {r.phone}</p>
                  </div>
                </div>
                <div className="bg-zinc-50 rounded-2xl p-3 space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Propietario</p>
                  <p className="text-sm font-medium text-zinc-900">{r.owner.name}</p>
                  <p className="text-sm text-zinc-500">{r.owner.email}</p>
                  {r.owner.phone && <p className="text-sm text-zinc-500">{r.owner.phone}</p>}
                </div>
                <div className="flex gap-2">
                  <form action={setStatus.bind(null, r.id, "APPROVED")} className="flex-1">
                    <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl py-3 text-sm transition-colors shadow-sm shadow-green-200">
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
          <div className="bg-white rounded-3xl border border-zinc-100 divide-y divide-zinc-50 overflow-hidden shadow-sm">
            {approved.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg flex-shrink-0">🍴</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900">{r.name}</p>
                  <p className="text-xs text-zinc-400">{r.owner.email} · {r._count.orders} pedidos</p>
                </div>
                <form action={setStatus.bind(null, r.id, "REJECTED")}>
                  <button type="submit" className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">Suspender</button>
                </form>
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
            <h2 className="font-bold text-zinc-900">Rechazados / Suspendidos</h2>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{rejected.length}</span>
          </div>
          <div className="bg-white rounded-3xl border border-zinc-100 divide-y divide-zinc-50 overflow-hidden shadow-sm opacity-75">
            {rejected.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900">{r.name}</p>
                  <p className="text-xs text-zinc-400">{r.owner.email}</p>
                </div>
                <form action={setStatus.bind(null, r.id, "APPROVED")}>
                  <button type="submit" className="text-xs text-green-600 hover:text-green-700 font-medium transition-colors">Reactivar</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
