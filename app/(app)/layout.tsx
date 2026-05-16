import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { signOut } from "@/lib/auth"
import { CartIndicator } from "@/components/cart-indicator"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
              <span className="text-base">🍔</span>
            </div>
            <span className="text-lg font-black text-zinc-900 tracking-tight">PideYa</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400 hidden sm:block">{session.user.name}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }) }}>
              <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">Salir</button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-24">{children}</main>
      <CartIndicator />

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 z-10">
        <div className="max-w-lg mx-auto flex">
          <Link href="/" className="flex-1 flex flex-col items-center py-3 gap-1 group">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-orange-500 transition-colors">Inicio</span>
          </Link>
          <Link href="/orders" className="flex-1 flex flex-col items-center py-3 gap-1 group">
            <span className="text-xl">🛍️</span>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-orange-500 transition-colors">Pedidos</span>
          </Link>
          <Link href="/profile" className="flex-1 flex flex-col items-center py-3 gap-1 group">
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-orange-500 transition-colors">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
