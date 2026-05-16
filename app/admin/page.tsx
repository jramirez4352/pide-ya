import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

async function approveRestaurant(id: string) {
  "use server"
  await db.restaurant.update({ where: { id }, data: { status: "APPROVED" } })
  revalidatePath("/admin")
}

async function rejectRestaurant(id: string) {
  "use server"
  await db.restaurant.update({ where: { id }, data: { status: "REJECTED" } })
  revalidatePath("/admin")
}

export default async function AdminPage() {
  const [pending, approved, rejected] = await Promise.all([
    db.restaurant.findMany({ where: { status: "PENDING" }, include: { owner: { select: { name: true, email: true, phone: true } } }, orderBy: { createdAt: "desc" } }),
    db.restaurant.findMany({ where: { status: "APPROVED" }, include: { owner: { select: { name: true, email: true } } }, orderBy: { name: "asc" } }),
    db.restaurant.findMany({ where: { status: "REJECTED" }, include: { owner: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } }),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-zinc-900">Panel de administración</h1>

      {/* Pendientes */}
      <section>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
          Solicitudes pendientes ({pending.length})
        </p>
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-400">No hay solicitudes pendientes</p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-yellow-200 p-4 space-y-3">
                <div>
                  <p className="font-semibold text-zinc-900">{r.name}</p>
                  <p className="text-xs text-zinc-500">{r.address}</p>
                  <p className="text-xs text-zinc-500">Tel: {r.phone}</p>
                </div>
                <div className="text-xs text-zinc-400 border-t border-zinc-100 pt-2">
                  <p>Propietario: {r.owner.name}</p>
                  <p>{r.owner.email}</p>
                  {r.owner.phone && <p>{r.owner.phone}</p>}
                </div>
                <div className="flex gap-2">
                  <form action={approveRestaurant.bind(null, r.id)} className="flex-1">
                    <button type="submit" className="w-full bg-green-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-green-700 transition-colors">
                      Aprobar
                    </button>
                  </form>
                  <form action={rejectRestaurant.bind(null, r.id)} className="flex-1">
                    <button type="submit" className="w-full bg-red-50 text-red-600 border border-red-200 rounded-xl py-2 text-sm font-medium hover:bg-red-100 transition-colors">
                      Rechazar
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
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
          Restaurantes activos ({approved.length})
        </p>
        {approved.length === 0 ? (
          <p className="text-sm text-zinc-400">Ninguno aprobado aún</p>
        ) : (
          <div className="space-y-2">
            {approved.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-zinc-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{r.name}</p>
                  <p className="text-xs text-zinc-400">{r.owner.email}</p>
                </div>
                <form action={rejectRestaurant.bind(null, r.id)}>
                  <button type="submit" className="text-xs text-red-400 hover:text-red-600">Suspender</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rechazados */}
      {rejected.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            Rechazados ({rejected.length})
          </p>
          <div className="space-y-2">
            {rejected.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-zinc-200 px-4 py-3 flex items-center justify-between opacity-60">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{r.name}</p>
                  <p className="text-xs text-zinc-400">{r.owner.email}</p>
                </div>
                <form action={approveRestaurant.bind(null, r.id)}>
                  <button type="submit" className="text-xs text-green-600 hover:text-green-700">Aprobar</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
