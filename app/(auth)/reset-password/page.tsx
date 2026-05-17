"use client"

import { useActionState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { resetPassword } from "@/app/actions/auth"

function ResetForm() {
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const [state, action, pending] = useActionState(resetPassword, undefined)

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-red-500">Enlace inválido o expirado.</p>
        <Link href="/forgot-password" className="font-bold text-orange-500 hover:text-orange-600 text-sm">
          Solicitar nuevo enlace →
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 text-center">
        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-xl font-black text-zinc-900">Nueva contraseña</h1>
        <p className="text-sm text-zinc-400 mt-1">Elige una contraseña segura</p>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Nueva contraseña</label>
          <input
            name="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-zinc-400"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Confirmar contraseña</label>
          <input
            name="confirm"
            type="password"
            placeholder="Repite la contraseña"
            required
            minLength={8}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-zinc-400"
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
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl py-4 text-sm transition-colors disabled:opacity-60 shadow-lg shadow-orange-200"
        >
          {pending ? "Guardando..." : "Guardar nueva contraseña"}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-64 bg-zinc-50 rounded-2xl animate-pulse" />}>
      <ResetForm />
    </Suspense>
  )
}
