"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { sendOrderConfirmation, sendNewOrderToRestaurant } from "@/lib/email"

type CartItem = { id: string; name: string; price: number; quantity: number }

export async function placeOrder(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "CUSTOMER") return { error: "No autorizado" }

  const restaurantId = formData.get("restaurantId") as string
  const itemsRaw = formData.get("items") as string
  const total = parseFloat(formData.get("total") as string)
  const deliveryType = formData.get("deliveryType") as string
  const address = formData.get("address") as string | null
  const notes = formData.get("notes") as string | null
  const proof = formData.get("proof") as File

  if (!restaurantId || !itemsRaw || !proof) return { error: "Datos incompletos" }

  const items: CartItem[] = JSON.parse(itemsRaw)

  const buffer = await proof.arrayBuffer()
  const base64 = Buffer.from(buffer).toString("base64")
  const proofUrl = `data:${proof.type};base64,${base64}`

  const discountAmt = parseFloat(formData.get("discountAmt") as string) || 0
  const promoCodeId = (formData.get("promoCodeId") as string) || null

  // Calcular comisión del restaurante
  const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId }, select: { commissionPct: true } })
  const commissionAmt = restaurant ? Math.round(total * (restaurant.commissionPct / 100)) : 0

  await db.order.create({
    data: {
      customerId: session.user.id,
      restaurantId,
      total,
      discountAmt,
      commissionAmt,
      deliveryType,
      address: address || null,
      notes: notes || null,
      proofUrl,
      promoCodeId,
      status: "PENDING",
      items: {
        create: items.map((i) => ({
          menuItemId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    },
  })

  // Incrementar contador de uso del código promo
  if (promoCodeId) {
    await db.promoCode.update({ where: { id: promoCodeId }, data: { usedCount: { increment: 1 } } })
  }

  // Emails — no bloqueamos el flujo si fallan
  const [customer, restaurantFull] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } }),
    db.restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true, owner: { select: { email: true } } },
    }),
  ])

  if (customer && restaurantFull) {
    const emailItems = items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))
    sendOrderConfirmation(customer.email, {
      customerName: customer.name,
      restaurantName: restaurantFull.name,
      orderId: restaurantId,
      items: emailItems,
      total,
      deliveryType,
      address,
    })
    sendNewOrderToRestaurant(restaurantFull.owner.email, {
      restaurantName: restaurantFull.name,
      customerName: customer.name,
      customerPhone: null,
      items: emailItems,
      total,
      deliveryType,
      address,
      notes,
    })
  }

  return { success: true }
}

export async function getMyOrders() {
  const session = await auth()
  if (!session) return []

  return db.order.findMany({
    where: { customerId: session.user.id },
    include: {
      restaurant: { select: { name: true, logoUrl: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  })
}
