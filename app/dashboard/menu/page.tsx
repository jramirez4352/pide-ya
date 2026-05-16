import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { addCategory, deleteCategory, addMenuItem, toggleMenuItem, deleteMenuItem } from "@/app/actions/restaurant"

export default async function MenuPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const restaurant = await db.restaurant.findUnique({
    where: { ownerId: session.user.id },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      },
    },
  })

  if (!restaurant) redirect("/login")

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Menú</h1>

      {/* Nueva categoría */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4">
        <p className="text-sm font-semibold text-zinc-700 mb-3">Nueva categoría</p>
        <form action={addCategory} className="flex gap-2">
          <input name="name" placeholder="Ej: Entradas, Bebidas..." required className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          <button type="submit" className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-medium">Agregar</button>
        </form>
      </div>

      {/* Categorías y productos */}
      {restaurant.categories.length === 0 ? (
        <div className="text-center py-10 text-zinc-400 text-sm">Agrega una categoría para empezar</div>
      ) : (
        restaurant.categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
              <p className="font-semibold text-zinc-900">{cat.name}</p>
              <form action={async () => { "use server"; await deleteCategory(cat.id) }}>
                <button type="submit" className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
              </form>
            </div>

            <div className="divide-y divide-zinc-50">
              {cat.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                    {item.description && <p className="text-xs text-zinc-400 truncate">{item.description}</p>}
                    <p className="text-sm font-semibold mt-0.5">Bs. {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={async () => { "use server"; await toggleMenuItem(item.id, !item.available) }}>
                      <button type="submit" className={`text-xs px-2 py-1 rounded-full font-medium ${item.available ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                        {item.available ? "Activo" : "Inactivo"}
                      </button>
                    </form>
                    <form action={async () => { "use server"; await deleteMenuItem(item.id) }}>
                      <button type="submit" className="text-zinc-300 hover:text-red-400 text-lg leading-none">×</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            {/* Nuevo ítem */}
            <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100">
              <p className="text-xs font-medium text-zinc-500 mb-2">Agregar producto</p>
              <form action={addMenuItem} className="space-y-2">
                <input type="hidden" name="categoryId" value={cat.id} />
                <input name="name" placeholder="Nombre del producto" required className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white" />
                <input name="description" placeholder="Descripción (opcional)" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white" />
                <div className="flex gap-2">
                  <input name="price" type="number" step="0.01" min="0" placeholder="Precio Bs." required className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white" />
                  <button type="submit" className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-medium">+</button>
                </div>
              </form>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
