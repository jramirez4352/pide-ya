"use client"

import { useActionState, Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { login, requestPasswordReset } from "@/app/actions/auth"

function LoginForm() {
  const [loginState, loginAction, loginPending] = useActionState(login, undefined)
  const [resetState, resetAction, resetPending] = useActionState(requestPasswordReset, undefined)
  const [view, setView] = useState<"login" | "forgot">("login")
  const params = useSearchParams()
  const registered = params.get("registered")
  const callbackUrl = params.get("callbackUrl") || "/"
  const resetSuccess = resetState?.message?.includes("breve")

  if (view === "forgot") {
    return (
      <>
        <div className="mb-6 text-center">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🔑</span>
          </div>
          <h2 className="text-lg font-black text-zinc-900">¿Olvidaste tu contraseña?</h2>
          <p className="text-sm text-zinc-400 mt-1">Te enviamos un enlace por email</p>
        </div>

        {resetSuccess ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-4 text-sm text-green-700 text-center">
              <p className="font-bold mb-1">¡Revisa tu correo!</p>
              <p>Si ese email está registrado, recibirás un enlace en breve.</p>
            </div>
            <button
              type="button"
              onClick={() => setView("login")}
              className="block w-full text-center bg-zinc-100 text-zinc-700 font-bold rounded-2xl py-3.5 text-sm"
            >
              ← Volver al login
            </button>
          </div>
        ) : (
          <form action={resetAction} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Email de tu cuenta</label>
              <input
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-zinc-400"
              />
            </div>

            {resetState?.message && !resetSuccess && (
              <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 text-center">
                {resetState.message}
              </div>
            )}

            <button
              type="submit"
              disabled={resetPending}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl py-4 text-sm transition-colors disabled:opacity-60 shadow-lg shadow-orange-200"
            >
              {resetPending ? "Enviando..." : "Enviar enlace"}
            </button>

            <button
              type="button"
              onClick={() => setView("login")}
              className="block w-full text-center text-sm text-zinc-400 font-medium py-2"
            >
              ← Volver al login
            </button>
          </form>
        )}
      </>
    )
  }

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
      {params.get("reset") === "1" && (
        <div className="mb-5 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 text-center">
          Contraseña actualizada. Ya puedes iniciar sesión.
        </div>
      )}

      <form action={loginAction} className="space-y-4">
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

        {loginState?.message && (
          <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 text-center">
            {loginState.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loginPending}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-2xl py-4 text-sm transition-colors disabled:opacity-60 shadow-lg shadow-orange-200 mt-2"
        >
          {loginPending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setView("forgot")}
        className="mt-4 block w-full text-center text-sm text-zinc-500 font-medium py-3 active:text-orange-500"
      >
        ¿Olvidaste tu contraseña?
      </button>
      <p className="mt-1 text-center text-sm text-zinc-500">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-bold text-orange-500">
          Regístrate gratis
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 animate-pulse">
        <div className="h-14 bg-zinc-100 rounded-2xl" />
        <div className="h-14 bg-zinc-100 rounded-2xl" />
        <div className="h-14 bg-orange-100 rounded-2xl" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
