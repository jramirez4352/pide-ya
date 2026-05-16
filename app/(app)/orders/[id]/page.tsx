import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { formatCOP } from "@/lib/currency"

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"]

const STATUS_CONFIG: Record<string, { label: string; description: string; icon: string; color: string; bg: string }> = {
  PENDING:   { label: "Pendiente",     description: "Esperando confirmación del restaurante", icon: "⏳", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  CONFIRMED: { label: "Confirmado",    description: "El restaurante aceptó tu pedido",         icon: "✅", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  PREPARING: { label: "En preparación",description: "Están preparando tu pedido",               icon: "🔥", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  READY:     { label: "¡Listo!",       description: "Tu pedido está listo para entrega",        icon: "🎉", color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  DELIVERED: { label: "Entregado",     description: "Tu pedido fue entregado. ¡Buen provecho!", icon: "🍽️", color: "text-zinc-600",   bg: "bg-zinc-50 border-zinc-200" },
  CANCELLED: { label: "Cancelado",     description: "El pedido fue cancelado",                  icon: "❌", color: "text-red-600",    bg: "bg-red-50 border-red-200" },
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect("/login")

  const { id } = await params

  const order = await db.order.findFirst({
    where: { id, customerId: session.user.id },
    include: {
      restaurant: { select: { name: true, logoUrl: true, phone: true, address: true } },
      items: true,
    },
  })

  if (!order) notFound()

  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
  const stepIndex = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === "CANCELLED"
  const isActive = !["DELIVERED", "CANCELLED"].includes(order.status)

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/orders" className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 text-xl font-bold flex-shrink-0">
          ‹
        </Link>
        <div>
          <h1 className="text-xl font-black text-zinc-900">Detalle del pedido</h1>
          <p className="text-xs text-zinc-400">{new Date(order.createdAt).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      {/* Estado actual */}
      <div className={`rounded-3xl border p-5 space-y-4 ${status.bg}`}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{status.icon}</span>
          <div>
            <p className={`font-black text-lg ${status.color}`}>{status.label}</p>
            <p className={`text-sm ${status.color} opacity-80`}>{status.description}</p>
          </div>
        </div>

        {/* Barra de progreso */}
        {!isCancelled && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {STATUS_STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    i <= stepIndex ? "bg-current opacity-80" : "bg-black/10"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs font-medium opacity-70">
              <span>Recibido</span>
              <span>Confirmado</span>
              <span>Preparando</span>
              <span>Listo</span>
              <span>Entregado</span>
            </div>
          </div>
        )}
      </div>

      {/* Restaurante */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-4 flex items-center gap-3 shadow-sm">
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-orange-50 flex items-center justify-center flex-shrink-0 border border-zinc-100">
          {order.restaurant.logoUrl
            ? <img src={order.restaurant.logoUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-xl">🍴</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-zinc-900">{order.restaurant.name}</p>
          <p className="text-xs text-zinc-400 truncate">{order.restaurant.address}</p>
        </div>
        <a href={`tel:${order.restaurant.phone}`} className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
          📞
        </a>
      </div>

      {/* Ítems del pedido */}
      <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-zinc-50">
          <p className="font-black text-zinc-900 text-sm">Tu pedido</p>
        </div>
        <div className="divide-y divide-zinc-50">
          {order.items.map((item) => {
            let modifiers: { groupName: string; optionName: string; price: number }[] = []
            try { modifiers = item.modifiers ? JSON.parse(item.modifiers) : [] } catch {}
            return (
              <div key={item.id} className="px-4 py-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-zinc-900">
                      <span className="text-orange-500 font-black">{item.quantity}×</span> {item.name}
                    </p>
                    {modifiers.length > 0 && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {modifiers.map(m => m.optionName).join(", ")}
                      </p>
                    )}
                    {item.comment && (
                      <p className="text-xs text-zinc-400 italic mt-0.5">"{item.comment}"</p>
                    )}
                  </div>
                  <p className="font-bold text-sm text-zinc-900 flex-shrink-0">{formatCOP(item.price * item.quantity)}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 border-t border-zinc-100">
          <p className="font-black text-zinc-900">Total pagado</p>
          <p className="font-black text-lg text-orange-500">{formatCOP(order.total)}</p>
        </div>
      </div>

      {/* Info de entrega */}
      {(order.deliveryType || order.address || order.notes) && (
        <div className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm space-y-2">
          <p className="font-black text-zinc-900 text-sm mb-3">Información de entrega</p>
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span>{order.deliveryType === "DELIVERY" ? "🛵 Domicilio" : "🏪 Recoger en tienda"}</span>
          </div>
          {order.address && (
            <div className="flex items-start gap-2 text-sm text-zinc-600">
              <span className="flex-shrink-0">📍</span>
              <span>{order.address}</span>
            </div>
          )}
          {order.notes && (
            <div className="flex items-start gap-2 text-sm text-zinc-500 italic">
              <span className="flex-shrink-0">💬</span>
              <span>"{order.notes}"</span>
            </div>
          )}
        </div>
      )}

      {/* Comprobante de pago */}
      {order.proofUrl && (
        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-zinc-50">
            <p className="font-black text-zinc-900 text-sm">Comprobante de pago</p>
          </div>
          <div className="p-4">
            <img src={order.proofUrl} alt="Comprobante" className="w-full rounded-2xl object-contain max-h-64 border border-zinc-100" />
          </div>
        </div>
      )}

      {/* Link a todos los pedidos */}
      <Link href="/orders" className="block text-center text-sm text-zinc-400 hover:text-zinc-600 py-2">
        ← Ver todos mis pedidos
      </Link>
    </div>
  )
}
