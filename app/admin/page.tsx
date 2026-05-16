import { db } from "@/lib/db"
import Link from "next/link"
import { formatCOP } from "@/lib/currency"

export default async function AdminPage() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalRestaurants, pendingRestaurants, approvedRestaurants,
    totalUsers, totalOrders, monthOrders,
    subscriptionRevenue, commissionRevenue,
    recentOrders, recentPending, activeSubscriptions,
  ] = await Promise.all([
    db.restaurant.count(),
    db.restaurant.count({ where: { status: "PENDING" } }),
    db.restaurant.count({ where: { status: "APPROVED" } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.order.count(),
    db.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.restaurant.findMany({ where: { status: "APPROVED", planId: { not: null } }, include: { plan: true } }),
    db.order.aggregate({ _sum: { commissionAmt: true }, where: { createdAt: { gte: startOfMonth } } }),
    db.order.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } }, restaurant: { select: { name: true } } },
    }),
    db.restaurant.findMany({
      where: { status: "PENDING" }, take: 3, orderBy: { createdAt: "desc" },
      include: { owner: { select: { name: true, email: true } } },
    }),
    db.restaurant.count({ where: { status: "APPROVED", planId: { not: null }, paidUntil: { gte: now } } }),
  ])

  const monthlySubRevenue = subscriptionRevenue
    .filter(r => r.plan && r.paidUntil && r.paidUntil >= now)
    .reduce((s, r) => s + (r.plan?.price ?? 0), 0)
  const monthCommission = commissionRevenue._sum.commissionAmt ?? 0
  const expiringSoon = subscriptionRevenue.filter(r => r.paidUntil && r.paidUntil >= now && r.paidUntil < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

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
        <p className="text-zinc-400 text-sm">{now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {/* Ingresos del mes */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">💰 Ingresos este mes</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-400">Suscripciones activas</p>
            <p className="text-2xl font-black text-orange-500">{formatCOP(monthlySubRevenue)}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{activeSubscriptions} restaurante{activeSubscriptions !== 1 ? "s" : ""} activo{activeSubscriptions !== 1 ? "s" : ""}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Comisiones por pedidos</p>
            <p className="text-2xl font-black text-green-600">{formatCOP(monthCommission)}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{monthOrders} pedido{monthOrders !== 1 ? "s" : ""} este mes</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
          <p className="text-sm font-black text-zinc-900">Total estimado del mes</p>
          <p className="text-xl font-black text-zinc-900">{formatCOP(monthlySubRevenue + monthCommission)}</p>
        </div>
      </div>

      {/* Alerta vencimientos */}
      {expiringSoon.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-sm font-black text-yellow-800 mb-2">⚠️ Vencen en 7 días ({expiringSoon.length})</p>
          {expiringSoon.map(r => (
            <p key={r.id} className="text-xs text-yellow-700">• {r.name} — {r.paidUntil ? new Date(r.paidUntil).toLocaleDateString("es-CO") : ""}</p>
          ))}
          <Link href="/admin/plans" className="text-xs font-bold text-yellow-700 underline mt-2 block">Gestionar suscripciones →</Link>
        </div>
      )}

      {/* Stats generales */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Restaurantes activos", value: approvedRestaurants, icon: "🍽️", href: "/admin/restaurants", color: "bg-green-50 text-green-600" },
          { label: "Solicitudes pendientes", value: pendingRestaurants, icon: "⏳", href: "/admin/restaurants", color: "bg-orange-50 text-orange-600" },
          { label: "Clientes registrados", value: totalUsers, icon: "👥", href: "/admin/users", color: "bg-blue-50 text-blue-600" },
          { label: "Pedidos totales", value: totalOrders, icon: "🛍️", href: "/admin/orders", color: "bg-purple-50 text-purple-600" },
        ].map(s => (
          <Link key={s.label} href={s.href} className={`${s.color} rounded-3xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-xs font-medium leading-tight mt-0.5 opacity-80">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Solicitudes pendientes */}
      {recentPending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-zinc-900">Solicitudes pendientes</h2>
            <Link href="/admin/restaurants" className="text-xs text-orange-500 font-bold">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {recentPending.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-orange-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">🍴</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-zinc-900">{r.name}</p>
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
          <Link href="/admin/orders" className="text-xs text-orange-500 font-bold">Ver todos →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-100 p-8 text-center shadow-sm">
            <p className="text-3xl mb-2">📭</p><p className="text-sm text-zinc-400">Aún no hay pedidos</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-zinc-100 divide-y divide-zinc-50 overflow-hidden shadow-sm">
            {recentOrders.map(o => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 truncate">{o.customer.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{o.restaurant.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                  <p className="text-xs font-bold text-zinc-700 mt-1">{formatCOP(o.total)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/plans" className="bg-white rounded-2xl border border-zinc-100 p-4 flex items-center gap-3 hover:border-orange-200 transition-colors shadow-sm">
          <span className="text-2xl">💳</span>
          <div><p className="font-bold text-sm text-zinc-900">Planes</p><p className="text-xs text-zinc-400">Suscripciones</p></div>
        </Link>
        <Link href="/admin/zones" className="bg-white rounded-2xl border border-zinc-100 p-4 flex items-center gap-3 hover:border-orange-200 transition-colors shadow-sm">
          <span className="text-2xl">🗺️</span>
          <div><p className="font-bold text-sm text-zinc-900">Zonas</p><p className="text-xs text-zinc-400">Cobertura</p></div>
        </Link>
      </div>
    </div>
  )
}
