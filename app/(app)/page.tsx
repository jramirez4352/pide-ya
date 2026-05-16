import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatCOP } from "@/lib/currency"

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"]
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente de confirmación",
  CONFIRMED: "Confirmado ✓",
  PREPARING: "En preparación 🔥",
  READY: "¡Listo para entrega! 🎉",
  DELIVERED: "Entregado ✓",
  CANCELLED: "Cancelado",
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-50 border-yellow-200 text-yellow-700",
  CONFIRMED: "bg-blue-50 border-blue-200 text-blue-700",
  PREPARING: "bg-orange-50 border-orange-200 text-orange-700",
  READY: "bg-green-50 border-green-200 text-green-700",
  DELIVERED: "bg-zinc-50 border-zinc-200 text-zinc-500",
  CANCELLED: "bg-red-50 border-red-200 text-red-600",
}

export default async function HomePage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role === "ADMIN") redirect("/admin")
  if (session.user.role === "RESTAURANT") redirect("/dashboard")

  const [restaurants, activeOrders] = await Promise.all([
    db.restaurant.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" } }),
    db.order.findMany({
      where: { customerId: session.user.id, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      include: {
        restaurant: { select: { name: true, logoUrl: true } },
        items: { take: 2, select: { name: true, quantity: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const firstName = session.user.name?.split(" ")[0] ?? "allí"

  return (
    <div>
      {/* Saludo */}
      <div className="mb-5">
        <p className="text-zinc-400 text-sm">Hola, {firstName} 👋</p>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-0.5">¿Qué vas a pedir hoy?</h1>
      </div>

      {/* Pedidos activos — notificaciones de estado */}
      {activeOrders.length > 0 && (
        <div className="mb-6 space-y-3">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Pedidos en curso</p>
          {activeOrders.map((order) => {
            const stepIndex = STATUS_STEPS.indexOf(order.status)
            const progress = order.status === "CANCELLED" ? 0 : Math.round(((stepIndex + 1) / STATUS_STEPS.length) * 100)
            return (
              <Link key={order.id} href={`/orders/${order.id}`} className={`block rounded-2xl border p-4 space-y-3 ${STATUS_COLOR[order.status] ?? "bg-zinc-50 border-zinc-200"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    {order.restaurant.logoUrl
                      ? <img src={order.restaurant.logoUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-lg">🍴</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm">{order.restaurant.name}</p>
                    <p className="text-xs opacity-70 truncate">
                      {order.items.map(i => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>
                  </div>
                  <span className="text-xs font-bold opacity-70">{formatCOP(order.total)}</span>
                </div>

                {/* Estado actual */}
                <div className="font-bold text-sm">{STATUS_LABEL[order.status]}</div>

                {/* Barra de progreso */}
                {order.status !== "CANCELLED" && (
                  <div className="space-y-1">
                    <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-current rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      {STATUS_STEPS.slice(0, -1).map((s, i) => (
                        <span key={s} className={`text-xs ${i <= stepIndex ? "opacity-100 font-semibold" : "opacity-30"}`}>
                          {s === "PENDING" ? "Recibido" : s === "CONFIRMED" ? "Confirmado" : s === "PREPARING" ? "Preparando" : "Listo"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Restaurantes */}
      {restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center mb-4">
            <span className="text-4xl">🍽️</span>
          </div>
          <p className="font-semibold text-zinc-700">Pronto habrá restaurantes</p>
          <p className="text-sm text-zinc-400 mt-1">Estamos incorporando nuevos locales</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">
            {restaurants.length} restaurante{restaurants.length !== 1 ? "s" : ""} disponible{restaurants.length !== 1 ? "s" : ""}
          </p>
          {restaurants.map((r) => (
            <Link
              key={r.id}
              href={`/restaurant/${r.id}`}
              className="block bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm hover:shadow-md hover:border-orange-200 transition-all active:scale-[0.98]"
            >
              <div className="h-40 bg-gradient-to-br from-orange-100 to-orange-50 relative overflow-hidden">
                {r.coverUrl
                  ? <img src={r.coverUrl} alt={r.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><span className="text-6xl opacity-30">🍽️</span></div>}
                {r.openHours && (
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-medium text-zinc-600">
                    {r.openHours}
                  </div>
                )}
              </div>
              <div className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-orange-50 flex items-center justify-center -mt-8 relative z-10">
                  {r.logoUrl ? <img src={r.logoUrl} alt={r.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🍴</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-900">{r.name}</p>
                  {r.description && <p className="text-xs text-zinc-400 truncate mt-0.5">{r.description}</p>}
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-500 text-sm font-bold">›</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
