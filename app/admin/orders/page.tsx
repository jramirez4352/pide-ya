import { formatCOP } from "@/lib/currency"
import { db } from "@/lib/db"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente", CONFIRMED: "Confirmado", PREPARING: "Preparando",
  READY: "Listo", DELIVERED: "Entregado", CANCELLED: "Cancelado",
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700", CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-orange-100 text-orange-700", READY: "bg-green-100 text-green-700",
  DELIVERED: "bg-zinc-100 text-zinc-500", CANCELLED: "bg-red-100 text-red-500",
}

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, email: true } },
      restaurant: { select: { name: true } },
      items: true,
    },
  })

  const byStatus = {
    active: orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)),
    done: orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status)),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Todos los pedidos</h1>
        <p className="text-zinc-400 text-sm mt-0.5">{orders.length} pedidos en total</p>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Activos", value: byStatus.active.length, color: "bg-orange-50 text-orange-600" },
          { label: "Entregados", value: orders.filter(o => o.status === "DELIVERED").length, color: "bg-green-50 text-green-600" },
          { label: "Cancelados", value: orders.filter(o => o.status === "CANCELLED").length, color: "bg-red-50 text-red-600" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
            <p className="text-xl font-black">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-100 p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm text-zinc-400">Aún no hay pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm text-zinc-900">{o.customer.name}</p>
                  <p className="text-xs text-zinc-400">{o.restaurant.name}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLOR[o.status]}`}>
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              <div className="text-xs text-zinc-500 space-y-0.5">
                {o.items.map((i) => <p key={i.id}>{i.quantity}× {i.name}</p>)}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-zinc-50">
                <p className="text-xs text-zinc-400">{new Date(o.createdAt).toLocaleDateString("es-BO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                <p className="font-bold text-sm text-zinc-900">{formatCOP(o.total)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
