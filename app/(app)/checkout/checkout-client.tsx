"use client"

import { formatCOP } from "@/lib/currency"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { placeOrder } from "@/app/actions/orders"

type CartItem = { cartId?: string; id: string; name: string; price: number; quantity: number; comment?: string; modifiers?: { optionName: string; price: number }[] }
type PaymentMethod = { id: string; type: string; label: string; details: string | null; qrImageUrl: string | null }

const inputClass = "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400 transition-all"

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
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const c = localStorage.getItem("cart")
    const r = localStorage.getItem("restaurantId")
    const pm = localStorage.getItem("paymentMethods")
    const dt = localStorage.getItem("deliveryTypes")
    if (!c || !r) { router.replace("/"); return }
    const parsedCart = JSON.parse(c)
    const parsedPM = pm ? JSON.parse(pm) : []
    const parsedDT = dt ? JSON.parse(dt) : []
    setCart(parsedCart)
    setRestaurantId(r)
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

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const canSubmit = selectedPayment && proof && (!deliveryType || deliveryType !== "DELIVERY" || address)

  function clearCart() {
    localStorage.removeItem("cart")
    localStorage.removeItem("restaurantId")
    localStorage.removeItem("paymentMethods")
    localStorage.removeItem("deliveryTypes")
    router.push("/")
  }

  async function handleSubmit() {
    if (!selectedPayment) { setError("Selecciona un método de pago"); return }
    if (!proof) { setError("Debes adjuntar el comprobante de pago"); return }
    if (deliveryType === "DELIVERY" && !address) { setError("Ingresa tu dirección de entrega"); return }

    setLoading(true)
    setError("")

    const formData = new FormData()
    formData.append("userId", userId)
    formData.append("restaurantId", restaurantId)
    formData.append("items", JSON.stringify(cart))
    formData.append("total", String(total))
    formData.append("deliveryType", deliveryType)
    formData.append("address", address)
    formData.append("notes", notes)
    formData.append("paymentMethodId", selectedPayment.id)
    formData.append("proof", proof)

    const result = await placeOrder(formData)
    setLoading(false)

    if (result?.error) { setError(result.error); return }

    setSuccess(true)
    localStorage.removeItem("cart")
    localStorage.removeItem("restaurantId")
    localStorage.removeItem("paymentMethods")
    localStorage.removeItem("deliveryTypes")

    setTimeout(() => router.push("/orders"), 1800)
  }

  if (cart.length === 0) return null

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 rounded-3xl bg-green-50 flex items-center justify-center mb-5 animate-bounce">
          <span className="text-5xl">🎉</span>
        </div>
        <h2 className="text-2xl font-black text-zinc-900">¡Pedido enviado!</h2>
        <p className="text-zinc-500 text-sm mt-2">El restaurante recibirá tu pedido ahora mismo</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          Redirigiendo a tus pedidos...
        </div>
      </div>
    )
  }

  return (
    <div className="pb-36">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Confirmar pedido</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{cartCount} {cartCount === 1 ? "ítem" : "ítems"} · {formatCOP(total)}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm("¿Vaciar el carrito y volver al inicio?")) clearCart()
          }}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-bold bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors mt-1"
        >
          🗑️ Vaciar
        </button>
      </div>

      <div className="space-y-4">
        {/* Resumen del pedido */}
        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-zinc-50">
            <p className="font-black text-sm text-zinc-900">🛍️ Tu pedido</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {cart.map((item, i) => (
              <div key={item.cartId ?? i} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-zinc-900">
                      <span className="text-orange-500">{item.quantity}×</span> {item.name}
                    </p>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-xs text-zinc-400 mt-0.5">{item.modifiers.map(m => m.optionName).join(", ")}</p>
                    )}
                    {item.comment && (
                      <p className="text-xs text-zinc-400 italic mt-0.5">"{item.comment}"</p>
                    )}
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
            <p className="font-black text-sm text-zinc-900">🛵 Tipo de entrega</p>
            <div className="flex gap-2">
              {deliveryTypes.map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setDeliveryType(dt)}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all ${
                    deliveryType === dt
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                  }`}
                >
                  {dt === "DELIVERY" ? "🛵 Domicilio" : "🏪 Recoger"}
                </button>
              ))}
            </div>
            {deliveryType === "DELIVERY" && (
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Dirección de entrega, referencias..."
                required
                className={inputClass}
              />
            )}
          </div>
        )}

        {/* Notas */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm space-y-2">
          <p className="font-black text-sm text-zinc-900">💬 Notas adicionales <span className="text-zinc-400 font-normal">(opcional)</span></p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Indicaciones especiales, referencias de la dirección..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Métodos de pago */}
        {paymentMethods.length > 0 && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm space-y-3">
            <p className="font-black text-sm text-zinc-900">💳 Método de pago</p>
            <div className="space-y-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setSelectedPayment(pm)}
                  className={`w-full text-left rounded-2xl border-2 p-3.5 transition-all ${
                    selectedPayment?.id === pm.id
                      ? "border-orange-400 bg-orange-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${selectedPayment?.id === pm.id ? "border-orange-500 bg-orange-500" : "border-zinc-300"}`}>
                      {selectedPayment?.id === pm.id && <div className="w-full h-full rounded-full flex items-center justify-center"><span className="text-white text-xs leading-none">✓</span></div>}
                    </div>
                    <p className="font-bold text-sm text-zinc-900">{pm.label}</p>
                  </div>
                  {pm.details && <p className="text-xs text-zinc-500 mt-1.5 ml-6">{pm.details.split("\n")[0]}</p>}
                </button>
              ))}
            </div>

            {/* Instrucciones de pago seleccionado */}
            {selectedPayment && (
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 space-y-3">
                <p className="text-sm font-black text-orange-800">Instrucciones de pago</p>
                {selectedPayment.qrImageUrl && (
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-orange-100">
                      <img src={selectedPayment.qrImageUrl} alt="QR de pago" className="w-44 h-44 object-contain" />
                    </div>
                  </div>
                )}
                {selectedPayment.details && (
                  <p className="text-sm text-orange-700 whitespace-pre-wrap leading-relaxed">{selectedPayment.details}</p>
                )}
                <div className="bg-orange-100 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-orange-700 font-medium">Monto exacto a transferir</span>
                  <span className="font-black text-orange-800">{formatCOP(total)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comprobante */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm space-y-3">
          <p className="font-black text-sm text-zinc-900">📎 Comprobante de pago</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleProof} />
          {proofPreview ? (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-100">
                <img src={proofPreview} alt="Comprobante" className="w-full object-contain max-h-56" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-orange-500 font-bold hover:text-orange-600">
                📷 Cambiar comprobante
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-zinc-200 hover:border-orange-300 rounded-2xl py-8 text-center transition-colors group"
            >
              <span className="block text-3xl mb-2 group-hover:scale-110 transition-transform">📸</span>
              <p className="text-sm font-bold text-zinc-500 group-hover:text-orange-500 transition-colors">Toca para adjuntar comprobante</p>
              <p className="text-xs text-zinc-400 mt-1">Foto o captura de pantalla del pago</p>
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-red-500 flex-shrink-0">⚠️</span>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Botón sticky de envío */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-zinc-100 z-20">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className={`w-full relative overflow-hidden rounded-3xl py-5 px-6 font-black text-white text-base transition-all shadow-2xl
              ${canSubmit && !loading
                ? "bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 active:scale-[0.97] shadow-orange-300"
                : "bg-zinc-300 cursor-not-allowed shadow-none"
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Enviando tu pedido...
              </span>
            ) : (
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-xl">🚀</span>
                  <span>Enviar pedido</span>
                </span>
                <span className="bg-white/20 rounded-2xl px-3 py-1 text-sm font-black">
                  {formatCOP(total)}
                </span>
              </span>
            )}
          </button>
          {!canSubmit && !loading && (
            <p className="text-center text-xs text-zinc-400 mt-2">
              {!proof ? "📎 Adjunta el comprobante de pago para continuar" : !selectedPayment ? "Selecciona un método de pago" : "Completa todos los campos"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
