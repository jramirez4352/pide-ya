import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ReportsClient } from "./reports-client"

export default async function ReportsPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const [restaurants, zones, stats] = await Promise.all([
    db.restaurant.findMany({
      where: { status: "APPROVED" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.zone.findMany({
      where: { active: true },
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
    }),
    Promise.all([
      db.order.count(),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.order.aggregate({ _sum: { total: true } }),
    ]),
  ])

  const [totalOrders, totalCustomers, totalRevenue] = stats

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Reportes</h1>
        <p className="text-zinc-400 text-sm">Exporta datos para análisis y marketing</p>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-orange-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-orange-500">{totalOrders.toLocaleString("es-CO")}</p>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">Pedidos totales</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{totalCustomers.toLocaleString("es-CO")}</p>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">Clientes</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-green-600">{restaurants.length}</p>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">Negocios activos</p>
        </div>
      </div>

      <ReportsClient restaurants={restaurants} zones={zones} />
    </div>
  )
}
