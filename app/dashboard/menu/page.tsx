import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { addCategory, deleteCategory, toggleMenuItem, deleteMenuItem } from "@/app/actions/restaurant"
import { formatCOP } from "@/lib/currency"

export default async function MenuPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const restaurant = await db.restaurant.findUnique({
    where: { ownerId: session.user.id },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: { modifierGroups: { include: { options: true } } },
          },
        },
      },
    },
  })

  if (!restaurant) redirect("/login")

  const totalItems = restaurant.categories.reduce((s, c) => s + c.items.length, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-zinc-900">Menú</h1>
          <p className="text-zinc-400 text-sm">{restaurant.categories.length} categorías · {totalItems} platos</p>
        </div>
      </div>

      {/* Nueva categoría */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Nueva sección</p>
        <form action={addCategory} className="flex gap-2">
          <input
            name="name"
            placeholder="Ej: Hamburguesas, Bebidas, Postres..."
            required
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400"
          />
          <button type="submit" className="bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">
            + Agregar
          </button>
        </form>
      </div>

      {/* Categorías */}
      {restaurant.categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center mb-3">
            <span className="text-3xl">🍽️</span>
          </div>
          <p className="font-bold text-zinc-700">Empieza creando una sección</p>
          <p className="text-sm text-zinc-400 mt-1">Ej: Entradas, Platos fuertes, Bebidas...</p>
        </div>
      ) : (
        restaurant.categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
            {/* Header categoría */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-50">
              <div className="flex items-center gap-2">
                <span className="text-base">📂</span>
                <p className="font-black text-zinc-900">{cat.name}</p>
                <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{cat.items.length}</span>
              </div>
              <form action={async () => { "use server"; await deleteCategory(cat.id) }}>
                <button type="submit" className="text-xs text-red-400 hover:text-red-600 font-medium">Eliminar</button>
              </form>
            </div>

            {/* Items */}
            {cat.items.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-zinc-400">
                Aún no hay platos en esta sección
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {cat.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3">
                    {/* Foto */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-orange-50 flex items-center justify-center flex-shrink-0 border border-zinc-100">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        : <span className="text-2xl">🍽️</span>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-zinc-900 truncate">{item.name}</p>
                        {item.modifierGroups.length > 0 && (
                          <span className="text-xs bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded-full font-medium">
                            {item.modifierGroups.reduce((s, g) => s + g.options.length, 0)} extras
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{item.description}</p>
                      )}
                      <p className="text-sm font-black text-orange-500 mt-0.5">{formatCOP(item.price)}</p>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <form action={async () => { "use server"; await toggleMenuItem(item.id, !item.available) }}>
                        <button type="submit" className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors ${item.available ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-400"}`}>
                          {item.available ? "Activo" : "Inactivo"}
                        </button>
                      </form>
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/menu/item/${item.id}`}
                          className="text-xs text-orange-500 hover:text-orange-700 font-bold bg-orange-50 px-2.5 py-1 rounded-xl"
                        >
                          Editar
                        </Link>
                        <form action={async () => { "use server"; await deleteMenuItem(item.id) }}>
                          <button type="submit" className="text-xs text-red-400 hover:text-red-600 font-medium">✕</button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botón agregar plato */}
            <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100">
              <Link
                href={`/dashboard/menu/item/new?categoryId=${cat.id}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-zinc-200 text-sm font-bold text-zinc-400 hover:border-orange-300 hover:text-orange-500 transition-colors"
              >
                <span>+</span> Agregar plato a {cat.name}
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
