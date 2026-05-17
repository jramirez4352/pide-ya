import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { formatCOP } from "@/lib/currency"

export default async function StatsPage() {
  const session = await auth()
  if (!session || session.user.role !== "RESTAURANT") redirect("/login")

  const restaurant = await db.restaurant.findUnique({ where: { ownerId: session.user.id } })
  if (!restaurant) redirect("/login")

  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startWeek = new Date(now)
  startWeek.setDate(now.getDate() - now.getDay())
  startWeek.setHours(0, 0, 0, 0)
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalOrders, todayOrders, weekOrders, monthOrders,
    totalRevenue, todayRevenue, weekRevenue, monthRevenue,
    ordersByStatus,
    topItems,
    recentOrders,
  ] = await Promise.all([
    db.order.count({ where: { restaurantId: restaurant.id } }),
    db.order.count({ where: { restaurantId: restaurant.id, createdAt: { gte: startToday } } }),
    db.order.count({ where: { restaurantId: restaurant.id, createdAt: { gte: startWeek } } }),
    db.order.count({ where: { restaurantId: restaurant.id, createdAt: { gte: startMonth } } }),
    db.order.aggregate({ where: { restaurantId: restaurant.id, status: "DELIVERED" }, _sum: { total: true } }),
    db.order.aggregate({ where: { restaurantId: restaurant.id, status: "DELIVERED", createdAt: { gte: startToday } }, _sum: { total: true } }),
    db.order.aggregate({ where: { restaurantId: restaurant.id, status: "DELIVERED", createdAt: { gte: startWeek } }, _sum: { total: true } }),
    db.order.aggregate({ where: { restaurantId: restaurant.id, status: "DELIVERED", createdAt: { gte: startMonth } }, _sum: { total: true } }),
    db.order.groupBy({ by: ["status"], where: { restaurantId: restaurant.id }, _count: true }),
    db.orderItem.groupBy({
      by: ["name"],
      where: { order: { restaurantId: restaurant.id, status: "DELIVERED" } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    db.order.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: "desc" },
      take: 7,
      select: { id: true, total: true, status: true, createdAt: true, customer: { select: { name: true } } },
    }),
  ])

  const STATUS_LABEL: Record<string, string> = {
    PENDING: "Pendiente", CONFIRMED: "Confirmado", PREPARING: "Preparando",
    READY: "Listo", DELIVERED: "Entregado", CANCELLED: "Cancelado",
  }
  const STATUS_COLOR: Record<string, string> = {
    PENDING: "bg-yellow-400", CONFIRMED: "bg-blue-400", PREPARING: "bg-orange-400",
    READY: "bg-green-400", DELIVERED: "bg-zinc-400", CANCELLED: "bg-red-400",
  }

  const maxItems = Math.max(...topItems.map(i => i._sum.quantity ?? 0), 1)
  const cancelledCount = ordersByStatus.find(s => s.status === "CANCELLED")?._count ?? 0
  const deliveredCount = ordersByStatus.find(s => s.status === "DELIVERED")?._count ?? 0
  const completionRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Estadísticas</h1>
        <p className="text-zinc-400 text-sm">Rendimiento de tu negocio</p>
      </div>

      {/* Ingresos */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm space-y-4">
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">💰 Ingresos (pedidos entregados)</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Hoy", value: todayRevenue._sum.total ?? 0 },
            { label: "Esta semana", value: weekRevenue._sum.total ?? 0 },
            { label: "Este mes", value: monthRevenue._sum.total ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-orange-50 rounded-2xl p-3 text-center">
              <p className="text-lg font-black text-orange-500 leading-tight">{formatCOP(value)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-zinc-50 flex justify-between items-center">
          <p className="text-xs text-zinc-400">Total histórico</p>
          <p className="font-black text-zinc-900">{formatCOP(totalRevenue._sum.total ?? 0)}</p>
        </div>
      </div>

      {/* Pedidos */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm space-y-4">
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">🛍️ Pedidos</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Hoy", value: todayOrders, color: "text-orange-500" },
            { label: "Semana", value: weekOrders, color: "text-blue-500" },
            { label: "Mes", value: monthOrders, color: "text-green-600" },
            { label: "Total", value: totalOrders, color: "text-zinc-900" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-50 rounded-2xl p-3 text-center">
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t border-zinc-50">
          <span className="text-zinc-400 text-xs">Tasa de completación</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: `${completionRate}%` }} />
            </div>
            <span className="text-xs font-black text-zinc-700">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Estado de pedidos */}
      {ordersByStatus.length > 0 && (
        <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm space-y-3">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">📊 Por estado</p>
          <div className="space-y-2">
            {ordersByStatus.sort((a, b) => b._count - a._count).map(s => (
              <div key={s.status} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_COLOR[s.status] ?? "bg-zinc-300"}`} />
                <span className="text-sm text-zinc-600 flex-1">{STATUS_LABEL[s.status] ?? s.status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${STATUS_COLOR[s.status] ?? "bg-zinc-300"}`}
                      style={{ width: `${Math.round((s._count / totalOrders) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-zinc-700 w-8 text-right">{s._count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top platos */}
      {topItems.length > 0 && (
        <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm space-y-3">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">🏆 Platos más pedidos</p>
          <div className="space-y-3">
            {topItems.map((item, i) => {
              const qty = item._sum.quantity ?? 0
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-sm font-black text-zinc-300 w-5 flex-shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-800 truncate">{item.name}</p>
                    <div className="mt-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full transition-all"
                        style={{ width: `${Math.round((qty / maxItems) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-black text-orange-500 flex-shrink-0">{qty} uds</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Últimos pedidos */}
      {recentOrders.length > 0 && (
        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-50">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">🕐 Últimos pedidos</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {recentOrders.map(o => (
              <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLOR[o.status] ?? "bg-zinc-300"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 truncate">{o.customer.name}</p>
                  <p className="text-xs text-zinc-400">
                    {new Date(o.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <p className="text-sm font-black text-zinc-700 flex-shrink-0">{formatCOP(o.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
