import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatCOP } from "@/lib/currency"
import { ZonePicker } from "./zone-picker"
import { HomeClient } from "./home-client"

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"]
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente de confirmación", CONFIRMED: "Confirmado ✓",
  PREPARING: "En preparación 🔥", READY: "¡Listo para entrega! 🎉",
  DELIVERED: "Entregado ✓", CANCELLED: "Cancelado",
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

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, zoneId: true, zone: { select: { id: true, name: true, city: true } } },
  })

  const allZones = await db.zone.findMany({ where: { active: true }, orderBy: [{ city: "asc" }, { name: "asc" }] })

  const restaurantWhere = user?.zoneId
    ? { status: "APPROVED", zones: { some: { id: user.zoneId } } }
    : { status: "APPROVED" }

  const [restaurantsRaw, activeOrders, itemsRaw, ratingsRaw] = await Promise.all([
    db.restaurant.findMany({
      where: restaurantWhere,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    }),
    db.order.findMany({
      where: { customerId: session.user.id, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      include: {
        restaurant: { select: { name: true, logoUrl: true } },
        items: { take: 2, select: { name: true, quantity: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    user?.zoneId ? db.menuItem.findMany({
      where: {
        available: true,
        category: { restaurant: { ...restaurantWhere } },
      },
      select: {
        id: true, name: true, description: true, price: true, imageUrl: true, available: true,
        category: {
          select: {
            name: true,
            restaurant: { select: { id: true, name: true, logoUrl: true, isOpen: true } },
          },
        },
      },
      orderBy: { order: "asc" },
      take: 200,
    }) : Promise.resolve([]),
    db.review.groupBy({
      by: ["restaurantId"],
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ])

  // Mapa de ratings por restaurante
  const ratingMap = new Map(ratingsRaw.map(r => [
    r.restaurantId,
    { avg: r._avg.rating ?? 0, count: r._count.rating },
  ]))

  // Formatear restaurantes
  const restaurants = restaurantsRaw.map(r => ({
    id: r.id, name: r.name, description: r.description,
    logoUrl: r.logoUrl, coverUrl: r.coverUrl, openHours: r.openHours,
    isOpen: r.isOpen, orderCount: r._count.orders,
    rating: ratingMap.get(r.id)?.avg ?? 0,
    reviewCount: ratingMap.get(r.id)?.count ?? 0,
  }))

  // Top 8 más solicitados (mínimo 1 pedido)
  const topRestaurants = [...restaurants]
    .filter(r => r.orderCount > 0)
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 8)

  // Formatear items con categoryName
  const items = itemsRaw.map(i => ({
    id: i.id, name: i.name, description: i.description,
    price: i.price, imageUrl: i.imageUrl, available: i.available,
    categoryName: i.category.name,
    restaurant: i.category.restaurant,
  }))

  // Categorías únicas ordenadas por cantidad de platos disponibles
  const catMap = new Map<string, number>()
  items.filter(i => i.restaurant.isOpen).forEach(i => {
    catMap.set(i.categoryName, (catMap.get(i.categoryName) ?? 0) + 1)
  })
  const categories = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }))

  const firstName = user?.name?.split(" ")[0] ?? "allí"

  return (
    <div>
      {/* Saludo */}
      <div className="mb-5">
        <p className="text-zinc-400 text-sm">Hola, {firstName} 👋</p>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-0.5">¿Qué vas a pedir hoy?</h1>
      </div>

      {/* Selector de zona */}
      <ZonePicker currentZone={user?.zone ?? null} allZones={allZones} />

      {/* Sin zona seleccionada */}
      {!user?.zoneId && allZones.length > 0 && (
        <div className="mb-5 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
          <p className="text-sm font-bold text-orange-700">📍 Selecciona tu zona para ver los restaurantes disponibles en tu barrio</p>
        </div>
      )}

      {/* Pedidos activos */}
      {activeOrders.length > 0 && (
        <div className="mb-6 space-y-3">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Pedidos en curso</p>
          {activeOrders.map((order) => {
            const stepIndex = STATUS_STEPS.indexOf(order.status)
            return (
              <Link key={order.id} href={`/orders/${order.id}`}
                className={`block rounded-2xl border p-4 space-y-3 ${STATUS_COLOR[order.status] ?? "bg-zinc-50 border-zinc-200"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    {order.restaurant.logoUrl
                      ? <img src={order.restaurant.logoUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-lg">🍴</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm">{order.restaurant.name}</p>
                    <p className="text-xs opacity-70 truncate">{order.items.map(i => `${i.quantity}× ${i.name}`).join(", ")}</p>
                  </div>
                  <span className="text-xs font-bold opacity-70">{formatCOP(order.total)}</span>
                </div>
                <div className="font-bold text-sm">{STATUS_LABEL[order.status]}</div>
                {order.status !== "CANCELLED" && (
                  <div className="space-y-1">
                    <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <div className="h-full bg-current rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(((stepIndex + 1) / STATUS_STEPS.length) * 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs opacity-60">
                      {["Recibido", "Confirmado", "Preparando", "Listo"].map(s => <span key={s}>{s}</span>)}
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Contenido interactivo: buscador + categorías + restaurantes */}
      <HomeClient
        restaurants={restaurants}
        topRestaurants={topRestaurants}
        items={items}
        categories={categories}
      />
    </div>
  )
}
