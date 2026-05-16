import { formatCOP } from "@/lib/currency"
import { getRestaurantOrders, updateOrderStatus } from "@/app/actions/restaurant"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY: "Listo",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
}

const NEXT_STATUS: Record<string, string> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "DELIVERED",
}

export default async function DashboardPage() {
  const orders = await getRestaurantOrders()
  const active = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status))
  const done = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status))

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 mb-4">Pedidos</h1>

      {active.length === 0 && done.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">No hay pedidos todavía</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-3 mb-6">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Activos</p>
          {active.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Historial</p>
          {done.map((order) => (
            <OrderCard key={order.id} order={order} showHistory />
          ))}
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, showHistory = false }: { order: Awaited<ReturnType<typeof getRestaurantOrders>>[number]; showHistory?: boolean }) {
  const nextStatus = NEXT_STATUS[order.status]
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm text-zinc-900">{order.customer.name}</p>
          {order.customer.phone && <p className="text-xs text-zinc-400">{order.customer.phone}</p>}
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          order.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
          order.status === "CONFIRMED" ? "bg-blue-100 text-blue-700" :
          order.status === "PREPARING" ? "bg-orange-100 text-orange-700" :
          order.status === "READY" ? "bg-green-100 text-green-700" :
          "bg-zinc-100 text-zinc-600"
        }`}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="space-y-1">
        {order.items.map((item) => (
          <p key={item.id} className="text-xs text-zinc-600">{item.quantity}× {item.name} — {formatCOP(item.price * item.quantity)}</p>
        ))}
      </div>

      {order.deliveryType === "DELIVERY" && order.address && (
        <p className="text-xs text-zinc-500">📍 {order.address}</p>
      )}
      {order.notes && <p className="text-xs text-zinc-400 italic">"{order.notes}"</p>}

      <div className="flex items-center justify-between">
        <p className="font-bold text-sm">{formatCOP(order.total)}</p>
        <p className="text-xs text-zinc-400">{new Date(order.createdAt).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}</p>
      </div>

      {order.proofUrl && (
        <details className="text-xs">
          <summary className="cursor-pointer text-zinc-500 hover:text-zinc-700">Ver comprobante</summary>
          <img src={order.proofUrl} alt="Comprobante" className="mt-2 rounded-lg w-full max-h-48 object-contain border border-zinc-100" />
        </details>
      )}

      {!showHistory && nextStatus && (
        <form action={async () => { "use server"; await updateOrderStatus(order.id, nextStatus) }}>
          <button type="submit" className="w-full bg-zinc-900 text-white text-sm font-medium rounded-xl py-2.5 hover:bg-zinc-800 transition-colors">
            Marcar como {STATUS_LABEL[nextStatus]}
          </button>
        </form>
      )}
      {!showHistory && order.status !== "CANCELLED" && (
        <form action={async () => { "use server"; await updateOrderStatus(order.id, "CANCELLED") }}>
          <button type="submit" className="w-full text-sm text-red-500 hover:text-red-700 py-1">Cancelar pedido</button>
        </form>
      )}
    </div>
  )
}
