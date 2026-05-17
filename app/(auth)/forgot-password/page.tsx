import { requestPasswordReset } from "@/app/actions/auth"
import Link from "next/link"

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  return <ForgotContent searchParamsPromise={searchParams} />
}

async function ForgotContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ sent?: string; error?: string }>
}) {
  const params = await searchParamsPromise
  const sent = params.sent === "1"
  const error = params.error

  return (
    <>
      <div className="mb-6 text-center">
        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔑</span>
        </div>
        <h1 className="text-xl font-black text-zinc-900">¿Olvidaste tu contraseña?</h1>
        <p className="text-sm text-zinc-400 mt-1">Te enviamos un enlace para restablecerla</p>
      </div>

      {sent ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-4 text-sm text-green-700 text-center">
            <p className="font-bold mb-1">¡Revisa tu correo!</p>
            <p>Si ese email está registrado, recibirás un enlace en breve.</p>
          </div>
          <Link href="/login" className="block w-full text-center bg-zinc-100 text-zinc-700 font-bold rounded-2xl py-3.5 text-sm">
            Volver al login
          </Link>
        </div>
      ) : (
        <form action={requestPasswordReset} className="space-y-4">
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

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 text-center">
              {decodeURIComponent(error)}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl py-4 text-sm transition-colors shadow-lg shadow-orange-200"
          >
            Enviar enlace
          </button>

          <a href="/login" className="block text-center text-sm text-zinc-400 font-medium py-2">
            ← Volver al login
          </a>
        </form>
      )}
    </>
  )
}
