"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("No autorizado")
  return session
}

export async function createZone(formData: FormData): Promise<void> {
  await requireAdmin()
  const name = (formData.get("name") as string)?.trim()
  const city = (formData.get("city") as string)?.trim()
  if (!name || !city) return
  await db.zone.create({ data: { name, city } })
  revalidatePath("/admin/zones")
}

export async function deleteZone(id: string): Promise<void> {
  await requireAdmin()
  await db.zone.delete({ where: { id } })
  revalidatePath("/admin/zones")
}

export async function toggleZoneActive(id: string, active: boolean): Promise<void> {
  await requireAdmin()
  await db.zone.update({ where: { id }, data: { active } })
  revalidatePath("/admin/zones")
}

export async function setRestaurantZones(restaurantId: string, zoneIds: string[]): Promise<void> {
  await requireAdmin()
  await db.restaurant.update({
    where: { id: restaurantId },
    data: { zones: { set: zoneIds.map(id => ({ id })) } },
  })
  revalidatePath("/admin/restaurants")
}

export async function getAllZones() {
  return db.zone.findMany({ where: { active: true }, orderBy: [{ city: "asc" }, { name: "asc" }] })
}

export async function setUserZone(zoneId: string): Promise<void> {
  const session = await auth()
  if (!session) return
  await db.user.update({ where: { id: session.user.id }, data: { zoneId } })
  revalidatePath("/")
  revalidatePath("/profile")
}
