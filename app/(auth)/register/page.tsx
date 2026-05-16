"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { registerCustomer, registerRestaurant } from "@/app/actions/auth"

const inputClass = "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-zinc-400"
const labelClass = "block text-sm font-semibold text-zinc-700 mb-1.5"

export default function RegisterPage() {
  const [role, setRole] = useState<"CUSTOMER" | "RESTAURANT">("CUSTOMER")
  const [customerState, customerAction, customerPending] = useActionState(registerCustomer, undefined)
  const [restaurantState, restaurantAction, restaurantPending] = useActionState(registerRestaurant, undefined)

  const state = role === "CUSTOMER" ? customerState : restaurantState
  const action = role === "CUSTOMER" ? customerAction : restaurantAction
  const pending = role === "CUSTOMER" ? customerPending : restaurantPending

  return (
    <>
      <div className="flex rounded-2xl border border-zinc-200 bg-zinc-100 p-1 mb-6 gap-1">
        <button
          type="button"
          onClick={() => setRole("CUSTOMER")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
            role === "CUSTOMER" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
          }`}
        >
          Soy cliente
        </button>
        <button
          type="button"
          onClick={() => setRole("RESTAURANT")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
            role === "RESTAURANT" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
          }`}
        >
          Tengo un restaurante
        </button>
      </div>

      <form action={action} className="space-y-4">
        <div>
          <label className={labelClass}>{role === "CUSTOMER" ? "Tu nombre" : "Nombre del responsable"}</label>
          <input name="name" placeholder="Nombre completo" required className={inputClass} />
          {state?.errors?.name && <p className="text-xs text-red-500 mt-1">{state.errors.name[0]}</p>}
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input name="email" type="email" placeholder="tu@email.com" required className={inputClass} />
          {state?.errors?.email && <p className="text-xs text-red-500 mt-1">{state.errors.email[0]}</p>}
        </div>

        <div>
          <label className={labelClass}>Contraseña</label>
          <input name="password" type="password" placeholder="Mínimo 8 caracteres" required className={inputClass} />
          {state?.errors?.password && <p className="text-xs text-red-500 mt-1">{state.errors.password[0]}</p>}
        </div>

        <div>
          <label className={labelClass}>Teléfono{role === "CUSTOMER" && <span className="text-zinc-400 font-normal"> (opcional)</span>}</label>
          <input name="phone" type="tel" placeholder="+591 7XXXXXXX" required={role === "RESTAURANT"} className={inputClass} />
        </div>

        {role === "RESTAURANT" && (
          <div className="pt-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-200" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Datos del restaurante</span>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>

            <div>
              <label className={labelClass}>Nombre del restaurante</label>
              <input name="restaurantName" placeholder="Ej: Pollo Dorado" required className={inputClass} />
              {state?.errors?.restaurantName && <p className="text-xs text-red-500 mt-1">{state.errors.restaurantName[0]}</p>}
            </div>

            <div>
              <label className={labelClass}>Dirección</label>
              <input name="address" placeholder="Calle, número, ciudad" required className={inputClass} />
              {state?.errors?.address && <p className="text-xs text-red-500 mt-1">{state.errors.address[0]}</p>}
            </div>

            <div>
              <label className={labelClass}>Teléfono del restaurante</label>
              <input name="restaurantPhone" type="tel" placeholder="+591 7XXXXXXX" required className={inputClass} />
              {state?.errors?.restaurantPhone && <p className="text-xs text-red-500 mt-1">{state.errors.restaurantPhone[0]}</p>}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-2xl py-4 text-sm transition-colors disabled:opacity-60 shadow-lg shadow-orange-200 mt-2"
        >
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-orange-500 hover:text-orange-600">
          Inicia sesión
        </Link>
      </p>
    </>
  )
}
