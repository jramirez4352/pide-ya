"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

async function getRestaurant() {
  const session = await auth()
  if (!session || session.user.role !== "RESTAURANT") return null
  return db.restaurant.findUnique({ where: { ownerId: session.user.id } })
}

// ─── Categorías ───────────────────────────────────────────────────────────────

export async function addCategory(formData: FormData): Promise<void> {
  const restaurant = await getRestaurant()
  if (!restaurant) return
  const name = (formData.get("name") as string)?.trim()
  if (!name) return
  await db.category.create({ data: { restaurantId: restaurant.id, name } })
  revalidatePath("/dashboard/menu")
}

export async function deleteCategory(id: string) {
  const restaurant = await getRestaurant()
  if (!restaurant) return
  await db.category.delete({ where: { id, restaurantId: restaurant.id } })
  revalidatePath("/dashboard/menu")
}

// ─── Ítems de menú ────────────────────────────────────────────────────────────

const itemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01),
  categoryId: z.string(),
})

export async function addMenuItem(formData: FormData): Promise<void> {
  const restaurant = await getRestaurant()
  if (!restaurant) return
  const raw = Object.fromEntries(formData)
  const result = itemSchema.safeParse(raw)
  if (!result.success) return
  const category = await db.category.findFirst({ where: { id: result.data.categoryId, restaurantId: restaurant.id } })
  if (!category) return
  await db.menuItem.create({ data: { ...result.data, description: result.data.description || null } })
  revalidatePath("/dashboard/menu")
}

export async function toggleMenuItem(id: string, available: boolean) {
  const restaurant = await getRestaurant()
  if (!restaurant) return
  await db.menuItem.updateMany({
    where: { id, category: { restaurantId: restaurant.id } },
    data: { available },
  })
  revalidatePath("/dashboard/menu")
}

export async function deleteMenuItem(id: string) {
  const restaurant = await getRestaurant()
  if (!restaurant) return
  await db.menuItem.deleteMany({ where: { id, category: { restaurantId: restaurant.id } } })
  revalidatePath("/dashboard/menu")
}

// ─── Métodos de pago ──────────────────────────────────────────────────────────

export async function addPaymentMethod(formData: FormData): Promise<void> {
  const restaurant = await getRestaurant()
  if (!restaurant) return
  const type = formData.get("type") as string
  const label = (formData.get("label") as string)?.trim()
  const details = (formData.get("details") as string)?.trim() || null
  if (!type || !label) return

  let qrImageUrl: string | null = null
  const qrFile = formData.get("qrImage") as File | null
  if (qrFile && qrFile.size > 0) {
    const buf = await qrFile.arrayBuffer()
    qrImageUrl = `data:${qrFile.type};base64,${Buffer.from(buf).toString("base64")}`
  }

  await db.paymentMethod.create({ data: { restaurantId: restaurant.id, type, label, details, qrImageUrl } })
  revalidatePath("/dashboard/payments")
}

export async function deletePaymentMethod(id: string) {
  const restaurant = await getRestaurant()
  if (!restaurant) return
  await db.paymentMethod.delete({ where: { id, restaurantId: restaurant.id } })
  revalidatePath("/dashboard/payments")
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export async function getRestaurantOrders() {
  const restaurant = await getRestaurant()
  if (!restaurant) return []
  return db.order.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      customer: { select: { name: true, phone: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function updateOrderStatus(orderId: string, status: string) {
  const restaurant = await getRestaurant()
  if (!restaurant) return
  await db.order.update({
    where: { id: orderId, restaurantId: restaurant.id },
    data: { status },
  })
  revalidatePath("/dashboard")
}
