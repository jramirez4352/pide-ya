"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { signIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "node:crypto"

const customerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  phone: z.string().optional(),
})

const restaurantSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  phone: z.string().min(6, "Teléfono requerido"),
  restaurantName: z.string().min(2, "El nombre del restaurante es requerido"),
  address: z.string().min(5, "La dirección es requerida"),
  restaurantPhone: z.string().min(6, "Teléfono del restaurante requerido"),
})

export type ActionState = { errors?: Record<string, string[]>; message?: string } | undefined

export async function registerCustomer(_: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData)
  const result = customerSchema.safeParse(raw)

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { name, email, password, phone } = result.data
  const exists = await db.user.findUnique({ where: { email } })
  if (exists) return { errors: { email: ["Este email ya está registrado"] } }

  const hashed = await bcrypt.hash(password, 12)
  await db.user.create({ data: { name, email, password: hashed, phone, role: "CUSTOMER" } })

  redirect("/login?registered=1")
}

export async function registerRestaurant(_: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData)
  const result = restaurantSchema.safeParse(raw)

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { name, email, password, phone, restaurantName, address, restaurantPhone } = result.data
  const exists = await db.user.findUnique({ where: { email } })
  if (exists) return { errors: { email: ["Este email ya está registrado"] } }

  const hashed = await bcrypt.hash(password, 12)
  await db.user.create({
    data: {
      name,
      email,
      password: hashed,
      phone,
      role: "RESTAURANT",
      restaurant: {
        create: {
          name: restaurantName,
          address,
          phone: restaurantPhone,
          status: "PENDING",
          deliveryTypes: [],
        },
      },
    },
  })

  redirect("/login?registered=2")
}

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: true,
      redirectTo: formData.get("callbackUrl") as string || "/",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Email o contraseña incorrectos" }
    }
    throw error
  }
}

export async function requestPasswordReset(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  if (!email) return { message: "Ingresa tu email" }

  const user = await db.user.findUnique({ where: { email } })
  // Respuesta genérica para no revelar si el email existe
  if (!user) return { message: "Si ese email está registrado, recibirás un enlace en breve." }

  // Invalidar tokens anteriores
  await db.passwordResetToken.updateMany({ where: { userId: user.id, used: false }, data: { used: true } })

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
  await db.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } })

  try {
    await sendPasswordResetEmail(email, token)
  } catch {
    return { message: "Error al enviar el email. Intenta más tarde." }
  }

  return { message: "Si ese email está registrado, recibirás un enlace en breve." }
}

export async function resetPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const token = (formData.get("token") as string)?.trim()
  const password = (formData.get("password") as string)
  const confirm = (formData.get("confirm") as string)

  if (!token) return { message: "Token inválido" }
  if (!password || password.length < 8) return { message: "La contraseña debe tener al menos 8 caracteres" }
  if (password !== confirm) return { message: "Las contraseñas no coinciden" }

  const record = await db.passwordResetToken.findUnique({ where: { token } })
  if (!record || record.used || record.expiresAt < new Date()) {
    return { message: "El enlace expiró o ya fue usado. Solicita uno nuevo." }
  }

  const hashed = await bcrypt.hash(password, 12)
  await db.user.update({ where: { id: record.userId }, data: { password: hashed } })
  await db.passwordResetToken.update({ where: { token }, data: { used: true } })

  redirect("/login?reset=1")
}
