"use client"

import { useActionState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { login } from "@/app/actions/auth"

function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)
  const params = useSearchParams()
  const registered = params.get("registered")
  const callbackUrl = params.get("callbackUrl") || "/"

  return (
    <>
      {registered === "1" && (
        <div className="mb-5 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 text-center">
          ¡Cuenta creada! Ya puedes iniciar sesión.
        </div>
      )}
      {registered === "2" && (
        <div className="mb-5 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700 text-center">
          Restaurante registrado. Espera la aprobación del admin.
        </div>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Email</label>
          <input
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-zinc-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Contraseña</label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all placeholder:text-zinc-400"
          />
        </div>

        {state?.message && (
          <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 text-center">
            {state.message}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-2xl py-4 text-sm transition-colors disabled:opacity-60 shadow-lg shadow-orange-200 mt-2"
        >
          {pending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-bold text-orange-500 hover:text-orange-600">
          Regístrate gratis
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="space-y-4 animate-pulse"><div className="h-14 bg-zinc-100 rounded-2xl" /><div className="h-14 bg-zinc-100 rounded-2xl" /><div className="h-14 bg-orange-100 rounded-2xl" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
