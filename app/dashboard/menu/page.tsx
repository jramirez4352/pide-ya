import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { addCategory, deleteCategory, addMenuItem, toggleMenuItem, deleteMenuItem, addModifierGroup, deleteModifierGroup, addModifierOption, deleteModifierOption } from "@/app/actions/restaurant"
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
            include: {
              modifierGroups: {
                orderBy: { order: "asc" },
                include: { options: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
    },
  })

  if (!restaurant) redirect("/login")

  const inputClass = "flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-zinc-900">Menú</h1>
        <p className="text-zinc-400 text-sm">Gestiona tus categorías, productos y modificadores</p>
      </div>

      {/* Nueva categoría */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
        <p className="text-sm font-bold text-zinc-700 mb-3">+ Nueva categoría</p>
        <form action={addCategory} className="flex gap-2">
          <input name="name" placeholder="Ej: Entradas, Bebidas..." required className={inputClass} />
          <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">Agregar</button>
        </form>
      </div>

      {restaurant.categories.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-4xl mb-2">🍽️</p>
          <p className="text-sm">Agrega una categoría para empezar</p>
        </div>
      ) : (
        restaurant.categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
            {/* Header categoría */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 border-b border-zinc-100">
              <p className="font-black text-zinc-900">{cat.name}</p>
              <form action={async () => { "use server"; await deleteCategory(cat.id) }}>
                <button type="submit" className="text-xs text-red-400 hover:text-red-600 font-medium">Eliminar categoría</button>
              </form>
            </div>

            {/* Productos */}
            <div className="divide-y divide-zinc-50">
              {cat.items.map((item) => (
                <div key={item.id} className="p-4 space-y-3">
                  {/* Info producto */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-zinc-900">{item.name}</p>
                        <p className="text-sm font-black text-orange-500">{formatCOP(item.price)}</p>
                      </div>
                      {item.description && <p className="text-xs text-zinc-400 mt-0.5">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <form action={async () => { "use server"; await toggleMenuItem(item.id, !item.available) }}>
                        <button type="submit" className={`text-xs px-2.5 py-1 rounded-full font-bold ${item.available ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {item.available ? "Activo" : "Inactivo"}
                        </button>
                      </form>
                      <form action={async () => { "use server"; await deleteMenuItem(item.id) }}>
                        <button type="submit" className="text-zinc-300 hover:text-red-400 text-xl font-bold">×</button>
                      </form>
                    </div>
                  </div>

                  {/* Modificadores existentes */}
                  {item.modifierGroups.length > 0 && (
                    <div className="space-y-2 pl-2 border-l-2 border-orange-100">
                      {item.modifierGroups.map(group => (
                        <div key={group.id} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-700">{group.name}</span>
                            {group.required && <span className="text-xs bg-red-50 text-red-400 px-1.5 py-0.5 rounded-full">Obligatorio</span>}
                            {group.multiSelect && <span className="text-xs bg-zinc-100 text-zinc-400 px-1.5 py-0.5 rounded-full">Varios</span>}
                            <form action={async () => { "use server"; await deleteModifierGroup(group.id) }} className="ml-auto">
                              <button type="submit" className="text-xs text-red-300 hover:text-red-500">Eliminar grupo</button>
                            </form>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {group.options.map(opt => (
                              <div key={opt.id} className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl px-2.5 py-1">
                                <span className="text-xs text-zinc-700">{opt.name}</span>
                                {opt.price > 0 && <span className="text-xs text-orange-500 font-semibold">+{formatCOP(opt.price)}</span>}
                                <form action={async () => { "use server"; await deleteModifierOption(opt.id) }}>
                                  <button type="submit" className="text-zinc-300 hover:text-red-400 text-sm font-bold ml-1">×</button>
                                </form>
                              </div>
                            ))}
                            {/* Agregar opción */}
                            <form action={addModifierOption} className="flex gap-1">
                              <input type="hidden" name="modifierGroupId" value={group.id} />
                              <input name="name" placeholder="+ Opción" required className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                              <input name="price" type="number" step="100" min="0" placeholder="Precio" className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-2 py-1 text-xs w-20 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                              <button type="submit" className="bg-orange-100 text-orange-600 rounded-xl px-2 py-1 text-xs font-bold hover:bg-orange-200">+</button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar grupo de modificadores */}
                  <details className="group">
                    <summary className="text-xs text-zinc-400 cursor-pointer hover:text-orange-500 font-medium select-none">+ Agregar modificadores / extras</summary>
                    <form action={addModifierGroup} className="mt-2 flex flex-wrap gap-2 items-center">
                      <input type="hidden" name="menuItemId" value={item.id} />
                      <input name="name" placeholder="Nombre del grupo (Ej: Extras)" required className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 w-36" />
                      <label className="flex items-center gap-1 text-xs text-zinc-600">
                        <input type="checkbox" name="required" className="rounded" /> Obligatorio
                      </label>
                      <label className="flex items-center gap-1 text-xs text-zinc-600">
                        <input type="checkbox" name="multiSelect" className="rounded" /> Selección múltiple
                      </label>
                      <button type="submit" className="bg-zinc-900 text-white rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-zinc-700">Crear grupo</button>
                    </form>
                  </details>
                </div>
              ))}
            </div>

            {/* Nuevo producto */}
            <div className="px-4 py-4 bg-zinc-50 border-t border-zinc-100">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Agregar producto</p>
              <form action={addMenuItem} className="space-y-2">
                <input type="hidden" name="categoryId" value={cat.id} />
                <input name="name" placeholder="Nombre del producto" required className={inputClass} />
                <input name="description" placeholder="Descripción (opcional)" className={inputClass} />
                <div className="flex gap-2">
                  <input name="price" type="number" step="100" min="0" placeholder="Precio $" required className={inputClass} />
                  <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">Agregar</button>
                </div>
              </form>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
