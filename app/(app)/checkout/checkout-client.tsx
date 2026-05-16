"use client"

import { formatCOP } from "@/lib/currency"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { placeOrder } from "@/app/actions/orders"

type CartItem = {
  cartId?: string; id: string; name: string; price: number
  quantity: number; comment?: string; modifiers?: { optionName: string; price: number }[]
}
type PaymentMethod = {
  id: string; type: string; label: string
  details: string | null; qrImageUrl: string | null
}

export function CheckoutClient({ userId }: { userId: string }) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [restaurantId, setRestaurantId] = useState("")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [deliveryTypes, setDeliveryTypes] = useState<string[]>([])
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [deliveryType, setDeliveryType] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [proof, setProof] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [showEditCart, setShowEditCart] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const c = localStorage.getItem("cart")
    const r = localStorage.getItem("restaurantId")
    const pm = localStorage.getItem("paymentMethods")
    const dt = localStorage.getItem("deliveryTypes")
    if (!c || !r) { router.replace("/"); return }
    setCart(JSON.parse(c))
    setRestaurantId(r)
    const parsedPM = pm ? JSON.parse(pm) : []
    const parsedDT = dt ? JSON.parse(dt) : []
    setPaymentMethods(parsedPM)
    setDeliveryTypes(parsedDT)
    if (parsedPM.length > 0) setSelectedPayment(parsedPM[0])
    if (parsedDT.length > 0) setDeliveryType(parsedDT[0])
  }, [router])

  function handleProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProof(file)
    setProofPreview(URL.createObjectURL(file))
  }

  function doClearCart() {
    localStorage.removeItem("cart")
    localStorage.removeItem("restaurantId")
    localStorage.removeItem("paymentMethods")
    localStorage.removeItem("deliveryTypes")
    router.push("/")
  }

  function changeQty(cartId: string, delta: number) {
    const updated = cart
      .map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    setCart(updated)
    localStorage.setItem("cart", JSON.stringify(updated))
  }

  function removeItem(cartId: string) {
    const updated = cart.filter(i => i.cartId !== cartId)
    setCart(updated)
    localStorage.setItem("cart", JSON.stringify(updated))
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const canSubmit = !!selectedPayment && !!proof && !(deliveryType === "DELIVERY" && !address)

  async function handleSubmit() {
    if (!canSubmit) {
      if (!proof) { setError("Adjunta el comprobante de pago"); return }
      if (!selectedPayment) { setError("Selecciona un método de pago"); return }
      if (deliveryType === "DELIVERY" && !address) { setError("Ingresa tu dirección"); return }
      return
    }
    setLoading(true)
    setError("")
    const fd = new FormData()
    fd.append("userId", userId)
    fd.append("restaurantId", restaurantId)
    fd.append("items", JSON.stringify(cart))
    fd.append("total", String(total))
    fd.append("deliveryType", deliveryType)
    fd.append("address", address)
    fd.append("notes", notes)
    fd.append("paymentMethodId", selectedPayment!.id)
    fd.append("proof", proof!)
    const result = await placeOrder(fd)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setSuccess(true)
    localStorage.removeItem("cart")
    localStorage.removeItem("restaurantId")
    localStorage.removeItem("paymentMethods")
    localStorage.removeItem("deliveryTypes")
    setTimeout(() => router.push("/orders"), 2000)
  }

  if (cart.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-4xl mb-3">🛒</p>
      <p className="text-zinc-500 text-sm">Tu carrito está vacío</p>
      <button onClick={() => router.push("/")} className="mt-4 text-orange-500 font-bold text-sm">Volver al inicio</button>
    </div>
  )

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <div className="w-28 h-28 rounded-3xl bg-green-50 flex items-center justify-center mb-6 animate-bounce">
        <span className="text-6xl">🎉</span>
      </div>
      <h2 className="text-2xl font-black text-zinc-900">¡Pedido enviado!</h2>
      <p className="text-zinc-500 text-sm mt-2">El restaurante lo confirmará en breve</p>
      <div className="mt-6 flex items-center gap-2 text-sm text-zinc-400">
        <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        Yendo a tus pedidos...
      </div>
    </div>
  )

  return (
    <div className="pb-44 space-y-4">

      {/* Modal de confirmación para vaciar */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmClear(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="text-center">
              <span className="text-5xl">🗑️</span>
              <h3 className="text-lg font-black text-zinc-900 mt-3">¿Vaciar el carrito?</h3>
              <p className="text-sm text-zinc-500 mt-1">Se eliminarán todos los productos y volverás al inicio</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmClear(false)} className="flex-1 py-3 rounded-2xl border-2 border-zinc-200 text-sm font-bold text-zinc-600">
                Cancelar
              </button>
              <button onClick={doClearCart} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold">
                Sí, vaciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Confirmar pedido</h1>
        <p className="text-zinc-400 text-sm mt-0.5">{cartCount} ítem{cartCount !== 1 ? "s" : ""} · {formatCOP(total)}</p>
      </div>

      {/* Botones: Cancelar + Editar carrito */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowConfirmClear(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl border-2 border-red-200 bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition-colors"
        >
          <span>🗑️</span> Cancelar
        </button>
        <button
          onClick={() => setShowEditCart(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl border-2 border-zinc-200 bg-white text-zinc-700 font-bold text-sm hover:bg-zinc-50 transition-colors"
        >
          <span>✏️</span> Editar carrito
        </button>
      </div>

      {/* Panel editar carrito */}
      {showEditCart && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditCart(false)} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-black text-zinc-900">Editar carrito</h2>
                <p className="text-xs text-zinc-400">{cartCount} ítem{cartCount !== 1 ? "s" : ""} · {formatCOP(total)}</p>
              </div>
              <button onClick={() => setShowEditCart(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <p className="text-3xl mb-2">🛒</p>
                  <p className="text-sm">El carrito quedó vacío</p>
                </div>
              ) : (
                cart.map((item, i) => (
                  <div key={item.cartId ?? i} className="bg-zinc-50 rounded-2xl p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-zinc-900">{item.name}</p>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <p className="text-xs text-zinc-400 mt-0.5">{item.modifiers.map(m => m.optionName).join(", ")}</p>
                        )}
                        {item.comment && <p className="text-xs text-zinc-400 italic">"{item.comment}"</p>}
                      </div>
                      <button onClick={() => removeItem(item.cartId ?? String(i))} className="text-red-300 hover:text-red-500 font-bold text-xl leading-none transition-colors flex-shrink-0">×</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-white rounded-xl border border-zinc-200 p-1">
                        <button onClick={() => changeQty(item.cartId ?? String(i), -1)} className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-zinc-600 text-lg hover:bg-zinc-50">−</button>
                        <span className="text-sm font-black w-5 text-center">{item.quantity}</span>
                        <button onClick={() => changeQty(item.cartId ?? String(i), 1)} className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-zinc-600 text-lg hover:bg-zinc-50">+</button>
                      </div>
                      <p className="font-black text-sm text-zinc-900">{formatCOP(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-4 border-t border-zinc-100 space-y-3">
              <button
                onClick={() => { setShowEditCart(false); router.push(restaurantId ? `/restaurant/${restaurantId}` : "/") }}
                className="w-full py-3 rounded-2xl border-2 border-orange-200 bg-orange-50 text-orange-600 font-bold text-sm hover:bg-orange-100 transition-colors"
              >
                + Agregar más productos
              </button>
              {cart.length > 0 && (
                <button
                  onClick={() => setShowEditCart(false)}
                  className="w-full py-3.5 rounded-2xl text-white font-black text-sm"
                  style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}
                >
                  Listo · {formatCOP(cart.reduce((s, i) => s + i.price * i.quantity, 0))}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-zinc-50">
          <p className="font-black text-xs text-zinc-400 uppercase tracking-widest">Tu pedido</p>
        </div>
        <div className="divide-y divide-zinc-50">
          {cart.map((item, i) => (
            <div key={item.cartId ?? i} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900">
                    <span className="text-orange-500">{item.quantity}×</span> {item.name}
                  </p>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{item.modifiers.map(m => m.optionName).join(", ")}</p>
                  )}
                  {item.comment && <p className="text-xs text-zinc-400 italic mt-0.5">"{item.comment}"</p>}
                </div>
                <p className="text-sm font-bold text-zinc-900 flex-shrink-0">{formatCOP(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-4 bg-orange-50 border-t border-orange-100">
          <p className="font-black text-zinc-900">Total</p>
          <p className="text-xl font-black text-orange-500">{formatCOP(total)}</p>
        </div>
      </div>

      {/* Tipo de entrega */}
      {deliveryTypes.length > 0 && (
        <div className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm space-y-3">
          <p className="font-black text-xs text-zinc-400 uppercase tracking-widest">Tipo de entrega</p>
          <div className="flex gap-2">
            {deliveryTypes.map(dt => (
              <button key={dt} type="button" onClick={() => setDeliveryType(dt)}
                className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                  deliveryType === dt ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-500"
                }`}>
                {dt === "DELIVERY" ? "🛵 Domicilio" : "🏪 Recoger"}
              </button>
            ))}
          </div>
          {deliveryType === "DELIVERY" && (
            <input value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Dirección, barrio, referencias..." required
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400" />
          )}
        </div>
      )}

      {/* Notas */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm space-y-2">
        <p className="font-black text-xs text-zinc-400 uppercase tracking-widest">Notas <span className="normal-case font-normal">(opcional)</span></p>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Sin cebolla, extra salsa, bien cocido..." rows={2}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400" />
      </div>

      {/* Métodos de pago */}
      {paymentMethods.length > 0 && (
        <div className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm space-y-3">
          <p className="font-black text-xs text-zinc-400 uppercase tracking-widest">Método de pago</p>
          <div className="space-y-2">
            {paymentMethods.map(pm => (
              <button key={pm.id} type="button" onClick={() => setSelectedPayment(pm)}
                className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                  selectedPayment?.id === pm.id ? "border-orange-400 bg-orange-50" : "border-zinc-200"
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    selectedPayment?.id === pm.id ? "border-orange-500 bg-orange-500" : "border-zinc-300"
                  }`}>
                    {selectedPayment?.id === pm.id && <span className="text-white text-xs leading-none">✓</span>}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-zinc-900">{pm.label}</p>
                    {pm.details && <p className="text-xs text-zinc-500 mt-0.5">{pm.details.split("\n")[0]}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {selectedPayment && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 space-y-3">
              <p className="text-sm font-black text-orange-800">Instrucciones de pago</p>
              {selectedPayment.qrImageUrl && (
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <img src={selectedPayment.qrImageUrl} alt="QR" className="w-44 h-44 object-contain" />
                  </div>
                </div>
              )}
              {selectedPayment.details && (
                <p className="text-sm text-orange-700 whitespace-pre-wrap">{selectedPayment.details}</p>
              )}
              <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-orange-100">
                <span className="text-xs text-orange-700 font-semibold">Monto a transferir</span>
                <span className="font-black text-orange-600">{formatCOP(total)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comprobante */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm space-y-3">
        <p className="font-black text-xs text-zinc-400 uppercase tracking-widest">Comprobante de pago</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleProof} />
        {proofPreview ? (
          <div className="space-y-2">
            <img src={proofPreview} alt="Comprobante" className="w-full rounded-2xl object-contain max-h-56 border border-zinc-100" />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-bold text-orange-500">
              📷 Cambiar comprobante
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-zinc-200 hover:border-orange-300 rounded-2xl py-10 flex flex-col items-center gap-2 transition-colors group">
            <span className="text-4xl group-hover:scale-110 transition-transform">📸</span>
            <p className="text-sm font-bold text-zinc-500 group-hover:text-orange-500 transition-colors">Toca para adjuntar comprobante</p>
            <p className="text-xs text-zinc-400">Captura de pantalla del pago</p>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <span>⚠️</span>
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* ── Botón fijo de envío — por encima del nav (~64px) ── */}
      <div className="fixed left-0 right-0 px-4 z-20" style={{ bottom: "68px" }}>
        <div className="max-w-lg mx-auto space-y-2">
          {!canSubmit && (
            <p className="text-center text-xs text-zinc-400 bg-white/90 backdrop-blur-sm rounded-xl py-1.5 px-3 border border-zinc-100">
              {!proof ? "📎 Adjunta el comprobante para continuar" : !selectedPayment ? "Selecciona un método de pago" : "Ingresa tu dirección de entrega"}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ background: canSubmit && !loading ? "linear-gradient(135deg,#f97316,#ea580c)" : undefined }}
            className={`w-full rounded-3xl py-5 px-6 text-white font-black text-base transition-all
              ${canSubmit && !loading
                ? "active:scale-[0.97]"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Enviando tu pedido...
              </span>
            ) : (
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-xl">🚀</span>
                  <span>Enviar pedido</span>
                </span>
                <span className="bg-white/25 rounded-2xl px-3 py-1 text-sm font-black">
                  {formatCOP(total)}
                </span>
              </span>
            )}
          </button>
        </div>
      </div>

    </div>
  )
}
