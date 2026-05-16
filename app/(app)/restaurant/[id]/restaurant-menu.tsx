"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type MenuItem = {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
}

type Category = {
  id: string
  name: string
  items: MenuItem[]
}

type PaymentMethod = {
  id: string
  type: string
  label: string
  details: string | null
  qrImageUrl: string | null
}

type Restaurant = {
  id: string
  name: string
  description: string | null
  address: string
  phone: string
  logoUrl: string | null
  coverUrl: string | null
  openHours: string | null
  deliveryTypes: string[]
  categories: Category[]
  paymentMethods: PaymentMethod[]
}

type CartItem = MenuItem & { quantity: number }

export function RestaurantMenu({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId)
      if (!existing) return prev
      if (existing.quantity === 1) return prev.filter((i) => i.id !== itemId)
      return prev.map((i) => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }

  function getQuantity(itemId: string) {
    return cart.find((i) => i.id === itemId)?.quantity ?? 0
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  function goToCheckout() {
    sessionStorage.setItem("cart", JSON.stringify(cart))
    sessionStorage.setItem("restaurantId", restaurant.id)
    sessionStorage.setItem("paymentMethods", JSON.stringify(restaurant.paymentMethods))
    sessionStorage.setItem("deliveryTypes", JSON.stringify(restaurant.deliveryTypes))
    router.push(`/checkout`)
  }

  return (
    <div className="pb-28">
      {restaurant.coverUrl && (
        <div className="-mx-4 -mt-6 h-44 bg-zinc-100 mb-4">
          <img src={restaurant.coverUrl} alt={restaurant.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        {restaurant.logoUrl && (
          <img src={restaurant.logoUrl} alt={restaurant.name} className="w-14 h-14 rounded-xl object-cover border border-zinc-200" />
        )}
        <div>
          <h1 className="text-xl font-bold text-zinc-900">{restaurant.name}</h1>
          {restaurant.description && <p className="text-sm text-zinc-500">{restaurant.description}</p>}
          <p className="text-xs text-zinc-400">{restaurant.address}</p>
        </div>
      </div>

      {restaurant.categories.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="text-sm">Este restaurante aún no tiene productos</p>
        </div>
      ) : (
        restaurant.categories.map((cat) => (
          <div key={cat.id} className="mb-6">
            <h2 className="font-semibold text-zinc-700 text-sm uppercase tracking-wide mb-3">{cat.name}</h2>
            <div className="space-y-2">
              {cat.items.map((item) => {
                const qty = getQuantity(item.id)
                return (
                  <div key={item.id} className="bg-white rounded-xl border border-zinc-200 p-3 flex items-center gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 text-sm">{item.name}</p>
                      {item.description && <p className="text-xs text-zinc-500 line-clamp-2">{item.description}</p>}
                      <p className="text-sm font-semibold text-zinc-900 mt-1">Bs. {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {qty > 0 ? (
                        <>
                          <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-lg leading-none">−</button>
                          <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                          <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-lg leading-none">+</button>
                        </>
                      ) : (
                        <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-lg leading-none">+</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {cartCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 px-4 max-w-lg mx-auto">
          <button
            onClick={goToCheckout}
            className="w-full bg-zinc-900 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-lg"
          >
            <span className="bg-white text-zinc-900 rounded-lg w-7 h-7 flex items-center justify-center text-sm font-bold">{cartCount}</span>
            <span className="font-semibold">Ver pedido</span>
            <span className="font-semibold">Bs. {total.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  )
}
