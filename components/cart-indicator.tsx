"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { formatCOP } from "@/lib/currency"

type CartItem = { cartId: string; id: string; name: string; price: number; quantity: number; comment: string; modifiers: any[] }

export function CartIndicator() {
  const router = useRouter()
  const pathname = usePathname()
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    function readCart() {
      try {
        const raw = localStorage.getItem("cart")
        setCart(raw ? JSON.parse(raw) : [])
      } catch { setCart([]) }
    }
    readCart()
    window.addEventListener("storage", readCart)
    // Poll every 500ms to catch same-tab changes
    const interval = setInterval(readCart, 500)
    return () => { window.removeEventListener("storage", readCart); clearInterval(interval) }
  }, [])

  const isOnCheckout = pathname === "/checkout"
  const isOnRestaurant = pathname.startsWith("/restaurant/")
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  // Don't show on checkout or restaurant page (restaurant page has its own)
  if (cartCount === 0 || isOnCheckout || isOnRestaurant) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto z-40">
      <button
        onClick={() => router.push("/checkout")}
        className="w-full bg-zinc-900 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-2xl"
      >
        <span className="bg-orange-500 text-white rounded-xl w-7 h-7 flex items-center justify-center text-sm font-black">
          {cartCount}
        </span>
        <span className="font-bold">Ver carrito</span>
        <span className="font-black text-orange-400">{formatCOP(total)}</span>
      </button>
    </div>
  )
}
