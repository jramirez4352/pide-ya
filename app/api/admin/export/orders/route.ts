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
  const restaurantId = searchParams.get("restaurantId")

  const where: Record<string, unknown> = {}
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
    }
  }
  if (restaurantId) where.restaurantId = restaurantId

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      restaurant: { select: { name: true } },
      items: { select: { name: true, quantity: true, price: true } },
    },
  })

  const header = row([
    "ID", "Fecha", "Hora", "Restaurante", "Cliente", "Email", "Teléfono",
    "Estado", "Tipo entrega", "Dirección", "Total", "Descuento", "Comisión",
    "Ítems", "Notas",
  ])

  const STATUS: Record<string, string> = {
    PENDING: "Pendiente", CONFIRMED: "Confirmado", PREPARING: "Preparando",
    READY: "Listo", DELIVERED: "Entregado", CANCELLED: "Cancelado",
  }

  const lines = orders.map(o => {
    const d = new Date(o.createdAt)
    const items = o.items.map(i => `${i.quantity}x ${i.name}`).join(" | ")
    return row([
      o.id,
      d.toLocaleDateString("es-CO"),
      d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      o.restaurant.name,
      o.customer.name,
      o.customer.email,
      o.customer.phone ?? "",
      STATUS[o.status] ?? o.status,
      o.deliveryType === "DELIVERY" ? "Domicilio" : "Recogida",
      o.address ?? "",
      o.total,
      o.discountAmt,
      o.commissionAmt,
      items,
      o.notes ?? "",
    ])
  })

  const csv = [header, ...lines].join("\n")
  const filename = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
