"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatCOP } from "@/lib/currency"

type ModifierOption = { id: string; name: string; price: number }
type ModifierGroup = { id: string; name: string; required: boolean; multiSelect: boolean; options: ModifierOption[] }
type MenuItem = { id: string; name: string; description: string | null; price: number; imageUrl: string | null; modifierGroups: ModifierGroup[] }
type Category = { id: string; name: string; items: MenuItem[] }
type PaymentMethod = { id: string; type: string; label: string; details: string | null; qrImageUrl: string | null }
type Restaurant = {
  id: string; name: string; description: string | null; address: string; phone: string
  logoUrl: string | null; coverUrl: string | null; openHours: string | null; deliveryTypes: string[]
  categories: Category[]; paymentMethods: PaymentMethod[]
}

type SelectedModifier = { groupId: string; groupName: string; optionId: string; optionName: string; price: number }
type CartItem = {
  cartId: string; id: string; name: string; price: number; quantity: number
  comment: string; modifiers: SelectedModifier[]
}

export function RestaurantMenu({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [modalItem, setModalItem] = useState<MenuItem | null>(null)
  const [modalQty, setModalQty] = useState(1)
  const [modalComment, setModalComment] = useState("")
  const [modalModifiers, setModalModifiers] = useState<Record<string, string[]>>({})

  useEffect(() => {
    try {
      const savedRestId = localStorage.getItem("restaurantId")
      const savedCart = localStorage.getItem("cart")
      if (savedRestId === restaurant.id && savedCart) {
        setCart(JSON.parse(savedCart))
      }
    } catch {}
  }, [restaurant.id])

  function openModal(item: MenuItem) {
    setModalItem(item)
    setModalQty(1)
    setModalComment("")
    setModalModifiers({})
  }

  function closeModal() { setModalItem(null) }

  function toggleModifier(group: ModifierGroup, optionId: string) {
    setModalModifiers((prev) => {
      const current = prev[group.id] ?? []
      if (group.multiSelect) {
        return { ...prev, [group.id]: current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId] }
      }
      return { ...prev, [group.id]: current.includes(optionId) ? [] : [optionId] }
    })
  }

  function getModifierPrice() {
    if (!modalItem) return 0
    return modalItem.modifierGroups.reduce((sum, g) => {
      const selected = modalModifiers[g.id] ?? []
      return sum + g.options.filter(o => selected.includes(o.id)).reduce((s, o) => s + o.price, 0)
    }, 0)
  }

  function canAdd() {
    if (!modalItem) return false
    return modalItem.modifierGroups.every(g => !g.required || (modalModifiers[g.id]?.length ?? 0) > 0)
  }

  function saveCart(newCart: CartItem[]) {
    setCart(newCart)
    localStorage.setItem("cart", JSON.stringify(newCart))
    localStorage.setItem("restaurantId", restaurant.id)
    localStorage.setItem("paymentMethods", JSON.stringify(restaurant.paymentMethods))
    localStorage.setItem("deliveryTypes", JSON.stringify(restaurant.deliveryTypes))
  }

  function addToCart() {
    if (!modalItem) return
    const selectedMods: SelectedModifier[] = []
    modalItem.modifierGroups.forEach(g => {
      const selected = modalModifiers[g.id] ?? []
      g.options.filter(o => selected.includes(o.id)).forEach(o => {
        selectedMods.push({ groupId: g.id, groupName: g.name, optionId: o.id, optionName: o.name, price: o.price })
      })
    })
    const unitPrice = modalItem.price + getModifierPrice()
    const cartId = `${modalItem.id}_${Date.now()}`
    saveCart([...cart, { cartId, id: modalItem.id, name: modalItem.name, price: unitPrice, quantity: modalQty, comment: modalComment, modifiers: selectedMods }])
    closeModal()
  }

  function removeFromCart(cartId: string) {
    saveCart(cart.filter(i => i.cartId !== cartId))
  }

  function changeQty(cartId: string, delta: number) {
    saveCart(cart.map(i => i.cartId === cartId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i).filter(i => i.quantity > 0))
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  function goToCheckout() {
    router.push("/checkout")
  }

  return (
    <div className="pb-32">
      {/* Header restaurante */}
      {restaurant.coverUrl && (
        <div className="-mx-4 -mt-5 h-44 bg-zinc-100 mb-4 overflow-hidden">
          <img src={restaurant.coverUrl} alt={restaurant.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-orange-50 flex items-center justify-center flex-shrink-0">
          {restaurant.logoUrl ? <img src={restaurant.logoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🍴</span>}
        </div>
        <div>
          <h1 className="text-xl font-black text-zinc-900">{restaurant.name}</h1>
          {restaurant.description && <p className="text-sm text-zinc-500">{restaurant.description}</p>}
          {restaurant.openHours && <p className="text-xs text-zinc-400">🕐 {restaurant.openHours}</p>}
        </div>
      </div>

      {/* Categorías */}
      {restaurant.categories.map(cat => (
        <div key={cat.id} className="mb-7">
          <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">{cat.name}</h2>
          <div className="space-y-2">
            {cat.items.map(item => (
              <button key={item.id} onClick={() => openModal(item)} className="w-full bg-white rounded-2xl border border-zinc-100 p-3 flex items-center gap-3 text-left hover:border-orange-200 hover:shadow-sm transition-all active:scale-[0.98]">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-orange-50 flex-shrink-0 flex items-center justify-center">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🍽️</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-zinc-900">{item.name}</p>
                  {item.description && <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{item.description}</p>}
                  {item.modifierGroups.length > 0 && <p className="text-xs text-orange-400 mt-1">Personalizable</p>}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-black text-sm text-zinc-900">{formatCOP(item.price)}</p>
                  <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center mt-1 ml-auto">
                    <span className="text-white font-bold text-lg leading-none">+</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Modal de ítem */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
            {/* Imagen */}
            <div className="h-48 bg-orange-50 flex items-center justify-center overflow-hidden rounded-t-3xl">
              {modalItem.imageUrl ? <img src={modalItem.imageUrl} alt={modalItem.name} className="w-full h-full object-cover" /> : <span className="text-7xl">🍽️</span>}
            </div>
            <div className="p-5 space-y-5">
              <div>
                <h2 className="text-xl font-black text-zinc-900">{modalItem.name}</h2>
                {modalItem.description && <p className="text-sm text-zinc-500 mt-1">{modalItem.description}</p>}
                <p className="text-lg font-black text-orange-500 mt-2">{formatCOP(modalItem.price)}</p>
              </div>

              {/* Modificadores */}
              {modalItem.modifierGroups.map(group => (
                <div key={group.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-bold text-sm text-zinc-900">{group.name}</p>
                    {group.required && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">Obligatorio</span>}
                    {group.multiSelect && <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">Varios</span>}
                  </div>
                  <div className="space-y-2">
                    {group.options.map(opt => {
                      const selected = (modalModifiers[group.id] ?? []).includes(opt.id)
                      return (
                        <button key={opt.id} type="button" onClick={() => toggleModifier(group, opt.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${selected ? "border-orange-400 bg-orange-50" : "border-zinc-200 bg-white"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "border-orange-500 bg-orange-500" : "border-zinc-300"}`}>
                              {selected && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className="text-sm font-medium text-zinc-900">{opt.name}</span>
                          </div>
                          {opt.price > 0 && <span className="text-sm font-semibold text-orange-500">+{formatCOP(opt.price)}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Comentario */}
              <div>
                <p className="font-bold text-sm text-zinc-900 mb-2">¿Algún comentario? <span className="text-zinc-400 font-normal">(opcional)</span></p>
                <textarea
                  value={modalComment}
                  onChange={e => setModalComment(e.target.value)}
                  placeholder="Ej: Sin cebolla, salsa aparte, bien cocido..."
                  rows={2}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400"
                />
              </div>

              {/* Cantidad */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 bg-zinc-100 rounded-2xl p-1">
                  <button onClick={() => setModalQty(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-zinc-700 shadow-sm text-lg">−</button>
                  <span className="w-6 text-center font-black text-lg">{modalQty}</span>
                  <button onClick={() => setModalQty(q => q + 1)} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-zinc-700 shadow-sm text-lg">+</button>
                </div>
                <button
                  onClick={addToCart}
                  disabled={!canAdd()}
                  className="flex-1 ml-4 bg-orange-500 disabled:opacity-40 hover:bg-orange-600 text-white font-bold rounded-2xl py-3.5 text-sm transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                >
                  <span>Agregar</span>
                  <span>{formatCOP((modalItem.price + getModifierPrice()) * modalQty)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón carrito flotante */}
      {cartCount > 0 && !modalItem && (
        <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto z-40">
          <button onClick={() => setShowCart(true)} className="w-full bg-zinc-900 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-2xl">
            <span className="bg-orange-500 text-white rounded-xl w-7 h-7 flex items-center justify-center text-sm font-black">{cartCount}</span>
            <span className="font-bold">Ver carrito</span>
            <span className="font-black text-orange-400">{formatCOP(total)}</span>
          </button>
        </div>
      )}

      {/* Panel carrito */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-zinc-900">Tu carrito</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { if (confirm("¿Vaciar el carrito?")) { saveCart([]); setShowCart(false) } }}
                  className="text-xs text-red-400 hover:text-red-600 font-bold bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-xl transition-colors"
                >
                  🗑️ Vaciar
                </button>
                <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold">✕</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-3">
              {cart.map(item => (
                <div key={item.cartId} className="bg-zinc-50 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-zinc-900">{item.name}</p>
                      {item.modifiers.length > 0 && (
                        <p className="text-xs text-zinc-400 mt-0.5">{item.modifiers.map(m => m.optionName).join(", ")}</p>
                      )}
                      {item.comment && <p className="text-xs text-zinc-400 italic">"{item.comment}"</p>}
                    </div>
                    <button onClick={() => removeFromCart(item.cartId)} className="text-zinc-300 hover:text-red-400 text-lg font-bold transition-colors">×</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-white rounded-xl border border-zinc-200 p-1">
                      <button onClick={() => changeQty(item.cartId, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-zinc-600">−</button>
                      <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={() => changeQty(item.cartId, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-zinc-600">+</button>
                    </div>
                    <p className="font-black text-sm">{formatCOP(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-zinc-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-zinc-900">Total</p>
                <p className="text-xl font-black text-zinc-900">{formatCOP(total)}</p>
              </div>
              <button onClick={goToCheckout} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl py-4 text-sm transition-colors shadow-lg shadow-orange-200">
                Ir al pago →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
