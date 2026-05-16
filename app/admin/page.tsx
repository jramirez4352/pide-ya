import { db } from "@/lib/db"
import Link from "next/link"

export default async function AdminPage() {
  const [
    totalRestaurants,
    pendingRestaurants,
    approvedRestaurants,
    totalUsers,
    totalOrders,
    recentOrders,
    recentPending,
  ] = await Promise.all([
    db.restaurant.count(),
    db.restaurant.count({ where: { status: "PENDING" } }),
    db.restaurant.count({ where: { status: "APPROVED" } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.order.count(),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        restaurant: { select: { name: true } },
      },
    }),
    db.restaurant.findMany({
      where: { status: "PENDING" },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { name: true, email: true } } },
    }),
  ])

  const stats = [
    { label: "Restaurantes activos", value: approvedRestaurants, icon: "🍽️", color: "bg-green-50 text-green-600", href: "/admin/restaurants" },
    { label: "Solicitudes pendientes", value: pendingRestaurants, icon: "⏳", color: "bg-orange-50 text-orange-600", href: "/admin/restaurants" },
    { label: "Clientes registrados", value: totalUsers, icon: "👥", color: "bg-blue-50 text-blue-600", href: "/admin/users" },
    { label: "Pedidos totales", value: totalOrders, icon: "🛍️", color: "bg-purple-50 text-purple-600", href: "/admin/orders" },
  ]

  const STATUS_LABEL: Record<string, string> = {
    PENDING: "Pendiente", CONFIRMED: "Confirmado", PREPARING: "Preparando",
    READY: "Listo", DELIVERED: "Entregado", CANCELLED: "Cancelado",
  }
  const STATUS_COLOR: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700", CONFIRMED: "bg-blue-100 text-blue-700",
    PREPARING: "bg-orange-100 text-orange-700", READY: "bg-green-100 text-green-700",
    DELIVERED: "bg-zinc-100 text-zinc-500", CANCELLED: "bg-red-100 text-red-500",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Panel de control</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Administra toda la plataforma desde aquí</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm hover:shadow-md hover:border-orange-200 transition-all active:scale-[0.98]">
            <div className={`w-10 h-10 rounded-2xl ${s.color} flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <p className="text-2xl font-black text-zinc-900">{s.value}</p>
            <p className="text-xs text-zinc-400 mt-0.5 leading-tight">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Solicitudes pendientes */}
      {recentPending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-zinc-900">Solicitudes pendientes</h2>
            <Link href="/admin/restaurants" className="text-xs text-orange-500 font-semibold">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {recentPending.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-orange-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">🍴</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 text-sm">{r.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{r.owner.email}</p>
                </div>
                <Link href="/admin/restaurants" className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-xl">Revisar</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pedidos recientes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-zinc-900">Pedidos recientes</h2>
          <Link href="/admin/orders" className="text-xs text-orange-500 font-semibold">Ver todos →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-100 p-8 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm text-zinc-400">Aún no hay pedidos</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-zinc-100 divide-y divide-zinc-50 overflow-hidden shadow-sm">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate">{o.customer.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{o.restaurant.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[o.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                  <p className="text-xs text-zinc-400 mt-1">{new Date(o.createdAt).toLocaleDateString("es-BO")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
