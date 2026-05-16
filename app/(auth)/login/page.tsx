"use client"

import { useActionState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/app/actions/auth"

function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)
  const params = useSearchParams()
  const registered = params.get("registered")
  const callbackUrl = params.get("callbackUrl") || "/"

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Bienvenido</h1>
        <p className="text-zinc-500 text-sm mt-1">Ingresa a tu cuenta</p>
      </div>

      {registered === "1" && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Cuenta creada. Ya puedes iniciar sesión.
        </div>
      )}
      {registered === "2" && (
        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          Tu restaurante fue registrado. Espera la aprobación del administrador.
        </div>
      )}
      {state?.message && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-zinc-900 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 animate-pulse h-96" />}>
      <LoginForm />
    </Suspense>
  )
}
