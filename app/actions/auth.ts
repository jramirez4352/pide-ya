"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { signIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"

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
