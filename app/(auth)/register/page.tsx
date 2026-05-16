"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerCustomer, registerRestaurant } from "@/app/actions/auth"

export default function RegisterPage() {
  const [role, setRole] = useState<"CUSTOMER" | "RESTAURANT">("CUSTOMER")
  const [customerState, customerAction, customerPending] = useActionState(registerCustomer, undefined)
  const [restaurantState, restaurantAction, restaurantPending] = useActionState(registerRestaurant, undefined)

  const state = role === "CUSTOMER" ? customerState : restaurantState
  const action = role === "CUSTOMER" ? customerAction : restaurantAction
  const pending = role === "CUSTOMER" ? customerPending : restaurantPending

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Crear cuenta</h1>
        <p className="text-zinc-500 text-sm mt-1">¿Cómo quieres registrarte?</p>
      </div>

      <div className="flex rounded-xl border border-zinc-200 p-1 mb-6 gap-1">
        <button
          type="button"
          onClick={() => setRole("CUSTOMER")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            role === "CUSTOMER" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Cliente
        </button>
        <button
          type="button"
          onClick={() => setRole("RESTAURANT")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            role === "RESTAURANT" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Restaurante
        </button>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{role === "CUSTOMER" ? "Tu nombre" : "Nombre del responsable"}</Label>
          <Input id="name" name="name" placeholder="Nombre completo" required />
          {state?.errors?.name && <p className="text-xs text-red-600">{state.errors.name[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
          {state?.errors?.email && <p className="text-xs text-red-600">{state.errors.email[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" required />
          {state?.errors?.password && <p className="text-xs text-red-600">{state.errors.password[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono{role === "CUSTOMER" && " (opcional)"}</Label>
          <Input id="phone" name="phone" type="tel" placeholder="+591 7XXXXXXX" required={role === "RESTAURANT"} />
        </div>

        {role === "RESTAURANT" && (
          <>
            <hr className="border-zinc-100" />
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Datos del restaurante</p>
            <div className="space-y-1.5">
              <Label htmlFor="restaurantName">Nombre del restaurante</Label>
              <Input id="restaurantName" name="restaurantName" placeholder="Ej: Pollo Dorado" required />
              {state?.errors?.restaurantName && <p className="text-xs text-red-600">{state.errors.restaurantName[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" placeholder="Calle, número, ciudad" required />
              {state?.errors?.address && <p className="text-xs text-red-600">{state.errors.address[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="restaurantPhone">Teléfono del restaurante</Label>
              <Input id="restaurantPhone" name="restaurantPhone" type="tel" placeholder="+591 7XXXXXXX" required />
              {state?.errors?.restaurantPhone && <p className="text-xs text-red-600">{state.errors.restaurantPhone[0]}</p>}
            </div>
          </>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-zinc-900 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
