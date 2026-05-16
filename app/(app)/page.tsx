import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function HomePage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role === "ADMIN") redirect("/admin")
  if (session.user.role === "RESTAURANT") redirect("/dashboard")

  const restaurants = await db.restaurant.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 mb-4">Restaurantes</h1>
      {restaurants.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-sm">No hay restaurantes disponibles aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              href={`/restaurant/${r.id}`}
              className="block bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-zinc-300 transition-colors"
            >
              {r.coverUrl && (
                <div className="h-36 bg-zinc-100 overflow-hidden">
                  <img src={r.coverUrl} alt={r.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 flex items-center gap-3">
                {r.logoUrl && (
                  <img src={r.logoUrl} alt={r.name} className="w-12 h-12 rounded-xl object-cover border border-zinc-100" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900">{r.name}</p>
                  {r.description && <p className="text-sm text-zinc-500 truncate">{r.description}</p>}
                  <p className="text-xs text-zinc-400 mt-0.5">{r.address}</p>
                </div>
                <span className="text-zinc-300">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
