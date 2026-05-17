import { formatCOP } from "@/lib/currency"
import { getMyOrders } from "@/app/actions/orders"
import Link from "next/link"
import { OrdersRefresher } from "@/components/orders-refresher"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente", CONFIRMED: "Confirmado", PREPARING: "Preparando",
  READY: "¡Listo!", DELIVERED: "Entregado", CANCELLED: "Cancelado",
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700", CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-orange-100 text-orange-700", READY: "bg-green-100 text-green-700",
  DELIVERED: "bg-zinc-100 text-zinc-500", CANCELLED: "bg-red-100 text-red-500",
}

export default async function OrdersPage() {
  const orders = await getMyOrders()

  const active = orders.filter(o => !["DELIVERED", "CANCELLED"].includes(o.status))
  const done = orders.filter(o => ["DELIVERED", "CANCELLED"].includes(o.status))

  return (
    <div>
      <h1 className="text-xl font-black text-zinc-900 mb-5">Mis pedidos</h1>

      {active.length > 0 && <OrdersRefresher />}
      {orders.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-5xl mb-3">🛍️</p>
          <p className="text-sm font-medium">Aún no tienes pedidos</p>
          <Link href="/" className="mt-4 inline-block text-sm font-bold text-orange-500">
            Ver restaurantes →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">En curso</p>
              {active.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
          {done.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Historial</p>
              {done.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OrderCard({ order }: { order: Awaited<ReturnType<typeof getMyOrders>>[number] }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="block bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm hover:shadow-md hover:border-orange-200 transition-all active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-orange-50 flex items-center justify-center flex-shrink-0">
            {order.restaurant.logoUrl
              ? <img src={order.restaurant.logoUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-base">🍴</span>}
          </div>
          <p className="font-bold text-sm text-zinc-900">{order.restaurant.name}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLOR[order.status] ?? "bg-zinc-100 text-zinc-500"}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>
      <div className="space-y-0.5 mb-3">
        {order.items.slice(0, 2).map(item => (
          <p key={item.id} className="text-xs text-zinc-500">{item.quantity}× {item.name}</p>
        ))}
        {order.items.length > 2 && (
          <p className="text-xs text-zinc-400">+{order.items.length - 2} más</p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">
          {new Date(order.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </p>
        <div className="flex items-center gap-2">
          <p className="font-black text-sm text-zinc-900">{formatCOP(order.total)}</p>
          <span className="text-zinc-300 text-sm">›</span>
        </div>
      </div>
    </Link>
  )
}
