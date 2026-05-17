"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { formatCOP } from "@/lib/currency"

type Restaurant = {
  id: string; name: string; description: string | null
  logoUrl: string | null; coverUrl: string | null; openHours: string | null
  isOpen: boolean; orderCount: number; rating: number; reviewCount: number
}

type MenuItem = {
  id: string; name: string; description: string | null; price: number
  imageUrl: string | null; available: boolean
  categoryName: string
  restaurant: { id: string; name: string; logoUrl: string | null; isOpen: boolean }
}

type Category = { name: string; count: number }

export function HomeClient({
  restaurants,
  topRestaurants,
  items,
  categories,
}: {
  restaurants: Restaurant[]
  topRestaurants: Restaurant[]
  items: MenuItem[]
  categories: Category[]
}) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const q = search.trim().toLowerCase()

  const filteredRestaurants = useMemo(() => {
    if (!q) return restaurants
    return restaurants.filter(r =>
      r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
    )
  }, [restaurants, q])

  const filteredItems = useMemo(() => {
    let result = items.filter(i => i.available && i.restaurant.isOpen)
    if (activeCategory) result = result.filter(i => i.categoryName === activeCategory)
    if (q) result = result.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.categoryName.toLowerCase().includes(q) ||
      i.restaurant.name.toLowerCase().includes(q)
    )
    return result
  }, [items, activeCategory, q])

  const showItemView = activeCategory !== null || q.length > 0

  return (
    <div className="space-y-6">

      {/* Buscador */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg pointer-events-none">🔍</span>
        <input
          type="search"
          placeholder="Buscar restaurantes o platos..."
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveCategory(null) }}
          className="w-full bg-white border border-zinc-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm placeholder:text-zinc-400"
        />
        {q && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-lg"
          >×</button>
        )}
      </div>

      {/* Categorías */}
      {categories.length > 0 && (
        <div className="-mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-zinc-900 text-white whitespace-nowrap flex-shrink-0"
              >
                ✕ Limpiar
              </button>
            )}
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => { setActiveCategory(activeCategory === cat.name ? null : cat.name); setSearch("") }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                  activeCategory === cat.name
                    ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                    : "bg-white border border-zinc-200 text-zinc-700 hover:border-orange-300"
                }`}
              >
                {getCategoryEmoji(cat.name)} {cat.name}
                <span className={`text-xs ${activeCategory === cat.name ? "text-orange-100" : "text-zinc-400"}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vista de platos (búsqueda o categoría activa) */}
      {showItemView && (
        <div className="space-y-3">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">
            {activeCategory ? activeCategory : `Resultados para "${search}"`}
            {" "}— {filteredItems.length} plato{filteredItems.length !== 1 ? "s" : ""}
          </p>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🔍</p>
              <p className="text-sm text-zinc-500">No encontramos platos que coincidan</p>
              <button onClick={() => { setSearch(""); setActiveCategory(null) }} className="mt-3 text-sm text-orange-500 font-bold">
                Ver todo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map(item => (
                <Link
                  key={item.id}
                  href={`/restaurant/${item.restaurant.id}`}
                  className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm hover:shadow-md hover:border-orange-200 transition-all active:scale-[0.97]"
                >
                  <div className="h-28 bg-orange-50 relative overflow-hidden">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🍽️</div>}
                  </div>
                  <div className="p-2.5">
                    <p className="font-bold text-xs text-zinc-900 leading-tight line-clamp-2">{item.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{item.restaurant.name}</p>
                    <p className="text-sm font-black text-orange-500 mt-1">{formatCOP(item.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vista principal (sin búsqueda ni categoría) */}
      {!showItemView && (
        <>
          {/* Más solicitados */}
          {topRestaurants.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">🔥 Más solicitados</p>
              <div className="-mx-4 px-4 overflow-x-auto">
                <div className="flex gap-3 pb-1" style={{ width: "max-content" }}>
                  {topRestaurants.map(r => (
                    <Link
                      key={r.id}
                      href={`/restaurant/${r.id}`}
                      className="flex-shrink-0 w-40 bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm hover:shadow-md hover:border-orange-200 transition-all active:scale-[0.97]"
                    >
                      <div className="h-24 bg-orange-50 relative overflow-hidden">
                        {r.coverUrl
                          ? <img src={r.coverUrl} alt={r.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🍽️</div>}
                        {!r.isOpen && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-xs font-bold text-white bg-black/60 px-2 py-0.5 rounded-full">Cerrado</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-6 h-6 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 flex items-center justify-center">
                            {r.logoUrl ? <img src={r.logoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">🍴</span>}
                          </div>
                          <p className="font-bold text-xs text-zinc-900 leading-tight truncate">{r.name}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-zinc-400">{r.orderCount} pedido{r.orderCount !== 1 ? "s" : ""}</p>
                          {r.reviewCount > 0 && <RatingBadge rating={r.rating} count={r.reviewCount} small />}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Todos los restaurantes */}
          <div className="space-y-3">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">
              {filteredRestaurants.length} restaurante{filteredRestaurants.length !== 1 ? "s" : ""} disponible{filteredRestaurants.length !== 1 ? "s" : ""}
            </p>
            {filteredRestaurants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-5xl mb-3">🍽️</span>
                <p className="font-semibold text-zinc-700">Sin restaurantes en tu zona</p>
                <p className="text-sm text-zinc-400 mt-1">Pronto habrá más opciones en tu barrio</p>
              </div>
            ) : (
              filteredRestaurants.map(r => (
                <Link key={r.id} href={`/restaurant/${r.id}`}
                  className="block bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm hover:shadow-md hover:border-orange-200 transition-all active:scale-[0.98]">
                  <div className="h-40 bg-gradient-to-br from-orange-100 to-orange-50 relative overflow-hidden">
                    {r.coverUrl
                      ? <img src={r.coverUrl} alt={r.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><span className="text-6xl opacity-30">🍽️</span></div>}
                    {r.openHours && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-medium text-zinc-600">
                        {r.openHours}
                      </div>
                    )}
                    {!r.isOpen && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-white bg-black/50 px-3 py-1 rounded-full">Cerrado ahora</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-orange-50 flex items-center justify-center -mt-8 relative z-10">
                      {r.logoUrl ? <img src={r.logoUrl} alt={r.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🍴</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-zinc-900 truncate">{r.name}</p>
                        {r.reviewCount > 0 && <RatingBadge rating={r.rating} count={r.reviewCount} />}
                      </div>
                      {r.description && <p className="text-xs text-zinc-400 truncate mt-0.5">{r.description}</p>}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-500 text-sm font-bold">›</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

function RatingBadge({ rating, count, small }: { rating: number; count: number; small?: boolean }) {
  const stars = Math.round(rating * 2) / 2
  return (
    <span className={`inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full font-bold text-amber-700 flex-shrink-0 ${small ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-0.5"}`}>
      ⭐ {stars.toFixed(1)}
      {!small && <span className="text-amber-400 font-normal">({count})</span>}
    </span>
  )
}

function getCategoryEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes("pizza")) return "🍕"
  if (n.includes("hamburgues") || n.includes("burger")) return "🍔"
  if (n.includes("pollo") || n.includes("chicken")) return "🍗"
  if (n.includes("almuerzo") || n.includes("corriente") || n.includes("ejecutivo")) return "🍱"
  if (n.includes("pasta") || n.includes("spagueti") || n.includes("spaghetti")) return "🍝"
  if (n.includes("marisco") || n.includes("pescado") || n.includes("camaron")) return "🐟"
  if (n.includes("sanduche") || n.includes("sandwich") || n.includes("sub")) return "🥪"
  if (n.includes("postre") || n.includes("torta") || n.includes("helado") || n.includes("pastel")) return "🍰"
  if (n.includes("ensalada") || n.includes("bowl") || n.includes("saludable")) return "🥗"
  if (n.includes("bebida") || n.includes("jugo") || n.includes("gaseosa") || n.includes("agua")) return "🥤"
  if (n.includes("desayuno") || n.includes("breakfast")) return "🍳"
  if (n.includes("tacos") || n.includes("mexican") || n.includes("burrito")) return "🌮"
  if (n.includes("sushi") || n.includes("japones") || n.includes("asian")) return "🍱"
  if (n.includes("vegano") || n.includes("vegetariano")) return "🥦"
  if (n.includes("arroz")) return "🍚"
  if (n.includes("carne") || n.includes("steak") || n.includes("parrilla")) return "🥩"
  return "🍽️"
}
