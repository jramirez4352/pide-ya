"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function getUser() {
  const session = await auth()
  if (!session || session.user.role !== "CUSTOMER") return null
  return session.user
}

export async function updateProfile(formData: FormData): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: "No autorizado" }
  const name = (formData.get("name") as string)?.trim()
  const phone = (formData.get("phone") as string)?.trim() || null
  if (!name) return { error: "El nombre es requerido" }
  await db.user.update({ where: { id: user.id }, data: { name, phone } })
  revalidatePath("/profile")
  return {}
}

export async function addAddress(formData: FormData): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: "No autorizado" }
  const label = (formData.get("label") as string)?.trim()
  const address = (formData.get("address") as string)?.trim()
  if (!label || !address) return { error: "Completa todos los campos" }
  const isFirst = (await db.savedAddress.count({ where: { userId: user.id } })) === 0
  await db.savedAddress.create({ data: { userId: user.id, label, address, isDefault: isFirst } })
  revalidatePath("/profile")
  return {}
}

export async function deleteAddress(id: string): Promise<void> {
  const user = await getUser()
  if (!user) return
  const addr = await db.savedAddress.findFirst({ where: { id, userId: user.id } })
  if (!addr) return
  await db.savedAddress.delete({ where: { id } })
  if (addr.isDefault) {
    const next = await db.savedAddress.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } })
    if (next) await db.savedAddress.update({ where: { id: next.id }, data: { isDefault: true } })
  }
  revalidatePath("/profile")
}

export async function setDefaultAddress(id: string): Promise<void> {
  const user = await getUser()
  if (!user) return
  await db.savedAddress.updateMany({ where: { userId: user.id }, data: { isDefault: false } })
  await db.savedAddress.update({ where: { id, userId: user.id }, data: { isDefault: true } })
  revalidatePath("/profile")
}

export async function getSavedAddresses() {
  const session = await auth()
  if (!session) return []
  return db.savedAddress.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  })
}
