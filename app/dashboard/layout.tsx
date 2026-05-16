import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { signOut } from "@/lib/auth"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "RESTAURANT") redirect("/login")

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-900">Mi Restaurante</span>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }) }}>
            <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-700">Salir</button>
          </form>
        </div>
      </header>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">{children}</main>
      <nav className="sticky bottom-0 bg-white border-t border-zinc-200">
        <div className="max-w-lg mx-auto flex">
          {[
            { href: "/dashboard", label: "Pedidos", icon: "🛍️" },
            { href: "/dashboard/menu", label: "Menú", icon: "🍽️" },
            { href: "/dashboard/payments", label: "Pagos", icon: "💳" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center py-3 text-xs text-zinc-500 hover:text-zinc-900 gap-1">
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
