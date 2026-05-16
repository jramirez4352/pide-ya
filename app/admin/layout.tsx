import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { signOut } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
              <span className="text-base">🍔</span>
            </div>
            <div>
              <span className="text-base font-black text-zinc-900 tracking-tight">PideYa</span>
              <span className="ml-2 text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Admin</span>
            </div>
          </div>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }) }}>
            <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">Salir</button>
          </form>
        </div>
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-2 overflow-x-auto">
          {[
            { href: "/admin", label: "Resumen", icon: "📊" },
            { href: "/admin/zones", label: "Zonas", icon: "🗺️" },
            { href: "/admin/restaurants", label: "Negocios", icon: "🍽️" },
            { href: "/admin/plans", label: "Planes", icon: "💳" },
            { href: "/admin/promos", label: "Promos", icon: "🎁" },
            { href: "/admin/orders", label: "Pedidos", icon: "🛍️" },
            { href: "/admin/users", label: "Usuarios", icon: "👥" },
            { href: "/admin/reports", label: "Reportes", icon: "📥" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-orange-500 hover:bg-orange-50 transition-all whitespace-nowrap"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5">{children}</main>
    </div>
  )
}
