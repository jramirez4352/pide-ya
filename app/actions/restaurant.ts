"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { sendOrderStatusUpdate } from "@/lib/email"

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

export async function saveMenuItem(formData: FormData): Promise<{ error?: string; id?: string }> {
  const restaurant = await getRestaurant()
  if (!restaurant) return { error: "No autorizado" }

  const id = formData.get("id") as string | null
  const name = (formData.get("name") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || null
  const price = parseFloat(formData.get("price") as string)
  const categoryId = formData.get("categoryId") as string
  const available = formData.get("available") === "on"

  if (!name || isNaN(price) || !categoryId) return { error: "Datos incompletos" }

  const category = await db.category.findFirst({ where: { id: categoryId, restaurantId: restaurant.id } })
  if (!category) return { error: "Categoría inválida" }

  let imageUrl: string | undefined = undefined
  const imageDataUrl = formData.get("imageDataUrl") as string | null
  if (imageDataUrl && imageDataUrl.startsWith("data:image/")) {
    imageUrl = imageDataUrl
  }

  if (id) {
    const existing = await db.menuItem.findFirst({ where: { id, category: { restaurantId: restaurant.id } } })
    if (!existing) return { error: "Plato no encontrado" }
    await db.menuItem.update({
      where: { id },
      data: { name, description, price, categoryId, available, ...(imageUrl ? { imageUrl } : {}) },
    })
    revalidatePath("/dashboard/menu")
    return { id }
  } else {
    const item = await db.menuItem.create({
      data: { name, description, price, categoryId, available, imageUrl: imageUrl ?? null },
    })
    revalidatePath("/dashboard/menu")
    return { id: item.id }
  }
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

// ─── Modificadores ────────────────────────────────────────────────────────────

export async function addModifierGroup(formData: FormData) {
  const restaurant = await getRestaurant()
  if (!restaurant) return null
  const menuItemId = formData.get("menuItemId") as string
  const name = (formData.get("name") as string)?.trim()
  if (!menuItemId || !name) return null
  const item = await db.menuItem.findFirst({ where: { id: menuItemId, category: { restaurantId: restaurant.id } } })
  if (!item) return null
  const group = await db.modifierGroup.create({
    data: {
      menuItemId,
      name,
      required: formData.get("required") === "on",
      multiSelect: formData.get("multiSelect") === "on",
    },
    include: { options: true },
  })
  revalidatePath("/dashboard/menu")
  return group
}

export async function deleteModifierGroup(id: string): Promise<void> {
  const restaurant = await getRestaurant()
  if (!restaurant) return
  await db.modifierGroup.deleteMany({ where: { id, menuItem: { category: { restaurantId: restaurant.id } } } })
  revalidatePath("/dashboard/menu")
}

export async function addModifierOption(formData: FormData) {
  const restaurant = await getRestaurant()
  if (!restaurant) return null
  const modifierGroupId = formData.get("modifierGroupId") as string
  const name = (formData.get("name") as string)?.trim()
  const price = parseFloat((formData.get("price") as string) || "0") || 0
  if (!modifierGroupId || !name) return null
  const group = await db.modifierGroup.findFirst({ where: { id: modifierGroupId, menuItem: { category: { restaurantId: restaurant.id } } } })
  if (!group) return null
  const option = await db.modifierOption.create({ data: { modifierGroupId, name, price } })
  revalidatePath("/dashboard/menu")
  return option
}

export async function deleteModifierOption(id: string): Promise<void> {
  const restaurant = await getRestaurant()
  if (!restaurant) return
  await db.modifierOption.deleteMany({ where: { id, modifierGroup: { menuItem: { category: { restaurantId: restaurant.id } } } } })
  revalidatePath("/dashboard/menu")
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
  const order = await db.order.update({
    where: { id: orderId, restaurantId: restaurant.id },
    data: { status },
    include: {
      customer: { select: { name: true, email: true } },
      restaurant: { select: { name: true } },
    },
  })
  revalidatePath("/dashboard")
  sendOrderStatusUpdate(order.customer.email, {
    customerName: order.customer.name,
    restaurantName: order.restaurant.name,
    status,
    total: order.total,
  })
}
