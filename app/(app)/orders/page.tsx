import { getMyOrders } from "@/app/actions/orders"
import Link from "next/link"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY: "Listo",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-orange-100 text-orange-700",
  READY: "bg-green-100 text-green-700",
  DELIVERED: "bg-zinc-100 text-zinc-600",
  CANCELLED: "bg-red-100 text-red-600",
}

export default async function OrdersPage() {
  const orders = await getMyOrders()

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 mb-4">Mis pedidos</h1>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="text-sm">Aún no tienes pedidos</p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-zinc-900 underline">Ver restaurantes</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {order.restaurant.logoUrl && (
                    <img src={order.restaurant.logoUrl} alt={order.restaurant.name} className="w-8 h-8 rounded-lg object-cover" />
                  )}
                  <p className="font-semibold text-sm text-zinc-900">{order.restaurant.name}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {order.items.map((item) => (
                  <p key={item.id} className="text-xs text-zinc-500">{item.quantity}× {item.name}</p>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">{new Date(order.createdAt).toLocaleDateString("es-BO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                <p className="font-bold text-sm">Bs. {order.total.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
