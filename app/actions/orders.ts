"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

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

  await db.order.create({
    data: {
      customerId: session.user.id,
      restaurantId,
      total,
      deliveryType,
      address: address || null,
      notes: notes || null,
      proofUrl,
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
