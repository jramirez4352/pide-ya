"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("No autorizado")
}

export async function createPlan(formData: FormData): Promise<void> {
  await requireAdmin()
  const name = (formData.get("name") as string).trim()
  const price = parseFloat(formData.get("price") as string)
  const commissionPct = parseFloat(formData.get("commissionPct") as string) || 0
  const maxZones = parseInt(formData.get("maxZones") as string) || 1
  const featuresRaw = (formData.get("features") as string).trim()
  const features = featuresRaw ? featuresRaw.split("\n").map(f => f.trim()).filter(Boolean) : []
  if (!name || isNaN(price)) return
  await db.plan.create({ data: { name, price, commissionPct, maxZones, features } })
  revalidatePath("/admin/plans")
}

export async function deletePlan(id: string): Promise<void> {
  await requireAdmin()
  await db.plan.update({ where: { id }, data: { active: false } })
  revalidatePath("/admin/plans")
}

export async function assignPlan(formData: FormData): Promise<void> {
  await requireAdmin()
  const restaurantId = formData.get("restaurantId") as string
  const planId = formData.get("planId") as string
  const months = parseInt(formData.get("months") as string) || 1
  const plan = await db.plan.findUnique({ where: { id: planId } })
  if (!plan) return
  const paidUntil = new Date()
  paidUntil.setMonth(paidUntil.getMonth() + months)
  await db.restaurant.update({
    where: { id: restaurantId },
    data: { planId, paidUntil, commissionPct: plan.commissionPct },
  })
  revalidatePath("/admin/plans")
  revalidatePath("/admin/restaurants")
}

export async function removePlan(restaurantId: string): Promise<void> {
  await requireAdmin()
  await db.restaurant.update({
    where: { id: restaurantId },
    data: { planId: null, paidUntil: null, commissionPct: 0 },
  })
  revalidatePath("/admin/plans")
}
