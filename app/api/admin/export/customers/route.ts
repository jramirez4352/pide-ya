import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest } from "next/server"

function escapeCSV(val: unknown): string {
  const s = val == null ? "" : String(val)
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function row(cells: unknown[]): string {
  return cells.map(escapeCSV).join(",")
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return new Response("No autorizado", { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const zoneId = searchParams.get("zoneId")

  const where: Record<string, unknown> = { role: "CUSTOMER" }
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
    }
  }
  if (zoneId) where.zoneId = zoneId

  const customers = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      zone: { select: { name: true, city: true } },
      orders: {
        select: { total: true, createdAt: true, restaurant: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const header = row([
    "Nombre", "Email", "Teléfono", "Zona", "Ciudad",
    "Fecha de registro", "Total pedidos", "Total gastado (COP)",
    "Último pedido", "Restaurante favorito",
  ])

  const lines = customers.map(c => {
    const totalSpent = c.orders.reduce((s, o) => s + o.total, 0)
    const lastOrder = c.orders[0]

    // restaurante más frecuente
    const freq: Record<string, number> = {}
    c.orders.forEach(o => { freq[o.restaurant.name] = (freq[o.restaurant.name] ?? 0) + 1 })
    const favorite = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ""

    return row([
      c.name,
      c.email,
      c.phone ?? "",
      c.zone?.name ?? "",
      c.zone?.city ?? "",
      new Date(c.createdAt).toLocaleDateString("es-CO"),
      c.orders.length,
      Math.round(totalSpent),
      lastOrder ? new Date(lastOrder.createdAt).toLocaleDateString("es-CO") : "",
      favorite,
    ])
  })

  const csv = [header, ...lines].join("\n")
  const filename = `clientes_${new Date().toISOString().slice(0, 10)}.csv`

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
