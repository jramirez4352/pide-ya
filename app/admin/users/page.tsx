import { db } from "@/lib/db"

export default async function AdminUsersPage() {
  const [customers, restaurantOwners] = await Promise.all([
    db.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    }),
    db.user.findMany({
      where: { role: "RESTAURANT" },
      orderBy: { createdAt: "desc" },
      include: { restaurant: { select: { name: true, status: true } } },
    }),
  ])

  const STATUS_COLOR: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    REJECTED: "bg-red-100 text-red-600",
  }
  const STATUS_LABEL: Record<string, string> = {
    APPROVED: "Aprobado", PENDING: "Pendiente", REJECTED: "Rechazado",
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Usuarios</h1>
        <p className="text-zinc-400 text-sm mt-0.5">{customers.length + restaurantOwners.length} usuarios registrados</p>
      </div>

      {/* Clientes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">👥</span>
          <h2 className="font-bold text-zinc-900">Clientes</h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{customers.length}</span>
        </div>
        {customers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-100 p-8 text-center">
            <p className="text-sm text-zinc-400">No hay clientes registrados</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-zinc-100 divide-y divide-zinc-50 overflow-hidden shadow-sm">
            {customers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-base flex-shrink-0">
                  <span>{u.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900">{u.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-zinc-600">{u._count.orders} pedidos</p>
                  <p className="text-xs text-zinc-400">{new Date(u.createdAt).toLocaleDateString("es-BO")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Propietarios de restaurantes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🍴</span>
          <h2 className="font-bold text-zinc-900">Dueños de restaurantes</h2>
          <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{restaurantOwners.length}</span>
        </div>
        {restaurantOwners.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-100 p-8 text-center">
            <p className="text-sm text-zinc-400">No hay restaurantes registrados</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-zinc-100 divide-y divide-zinc-50 overflow-hidden shadow-sm">
            {restaurantOwners.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-base flex-shrink-0">
                  <span>{u.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900">{u.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                  {u.restaurant && <p className="text-xs text-zinc-500 font-medium">{u.restaurant.name}</p>}
                </div>
                {u.restaurant && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${STATUS_COLOR[u.restaurant.status]}`}>
                    {STATUS_LABEL[u.restaurant.status]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
