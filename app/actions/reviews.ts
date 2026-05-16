"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function submitReview(formData: FormData): Promise<{ error?: string }> {
  const session = await auth()
  if (!session) return { error: "No autorizado" }
  const orderId = formData.get("orderId") as string
  const rating = parseInt(formData.get("rating") as string)
  const comment = (formData.get("comment") as string)?.trim() || null
  if (!orderId || isNaN(rating) || rating < 1 || rating > 5) return { error: "Datos inválidos" }
  const order = await db.order.findFirst({
    where: { id: orderId, customerId: session.user.id, status: "DELIVERED" },
  })
  if (!order) return { error: "Solo puedes reseñar pedidos entregados" }
  const existing = await db.review.findUnique({ where: { orderId } })
  if (existing) return { error: "Ya reseñaste este pedido" }
  await db.review.create({
    data: { orderId, customerId: session.user.id, restaurantId: order.restaurantId, rating, comment },
  })
  revalidatePath(`/orders/${orderId}`)
  return {}
}
