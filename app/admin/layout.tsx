import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-900">Admin — PideYa</span>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }) }}>
            <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-700">Salir</button>
          </form>
        </div>
      </header>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">{children}</main>
    </div>
  )
}
