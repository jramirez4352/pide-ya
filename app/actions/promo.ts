"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function validatePromoCode(code: string, restaurantId: string, total: number): Promise<{
  valid: boolean; discountPct?: number; discountAmt?: number; promoCodeId?: string; error?: string
}> {
  const promo = await db.promoCode.findUnique({
    where: { code: code.toUpperCase().trim() },
  })
  if (!promo || !promo.active) return { valid: false, error: "Código no válido" }
  if (promo.expiresAt && promo.expiresAt < new Date()) return { valid: false, error: "Código vencido" }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return { valid: false, error: "Código agotado" }
  if (promo.restaurantId && promo.restaurantId !== restaurantId) return { valid: false, error: "Código no válido para este restaurante" }
  if (total < promo.minOrder) return { valid: false, error: `Mínimo de pedido: $${promo.minOrder.toLocaleString("es-CO")}` }
  const discountAmt = Math.round(total * (promo.discountPct / 100))
  return { valid: true, discountPct: promo.discountPct, discountAmt, promoCodeId: promo.id }
}

export async function createPromoCode(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return
  const code = (formData.get("code") as string).toUpperCase().trim()
  const discountPct = parseFloat(formData.get("discountPct") as string)
  const maxUses = formData.get("maxUses") ? parseInt(formData.get("maxUses") as string) : null
  const minOrder = parseFloat(formData.get("minOrder") as string) || 0
  const expiresAtRaw = formData.get("expiresAt") as string
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null
  const description = (formData.get("description") as string)?.trim() || null
  if (!code || isNaN(discountPct)) return
  await db.promoCode.create({ data: { code, discountPct, maxUses, minOrder, expiresAt, description } })
  revalidatePath("/admin/promos")
}

export async function togglePromoCode(id: string, active: boolean): Promise<void> {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return
  await db.promoCode.update({ where: { id }, data: { active } })
  revalidatePath("/admin/promos")
}
