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

const inputClass = "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400"

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

  function clearCart() {
    localStorage.removeItem("cart")
    localStorage.removeItem("restaurantId")
    localStorage.removeItem("paymentMethods")
    localStorage.removeItem("deliveryTypes")
    router.push("/")
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const needsAddress = deliveryType === "DELIVERY" && !address
  const canSubmit = !!selectedPayment && !!proof && !needsAddress

  async function handleSubmit() {
    if (!selectedPayment) { setError("Selecciona un método de pago"); return }
    if (!proof) { setError("Debes adjuntar el comprobante de pago"); return }
    if (needsAddress) { setError("Ingresa tu dirección de entrega"); return }

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
    setTimeout(() => router.push("/orders"), 2000)
  }

  if (cart.length === 0) return null

  /* ── Pantalla de éxito ──────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="w-28 h-28 rounded-3xl bg-green-50 flex items-center justify-center mb-6 animate-bounce">
          <span className="text-6xl">🎉</span>
        </div>
        <h2 className="text-2xl font-black text-zinc-900">¡Pedido enviado!</h2>
        <p className="text-zinc-500 text-sm mt-2 max-w-xs">
          El restaurante recibirá tu pedido y lo confirmará en breve
        </p>
        <div className="mt-6 flex items-center gap-2 text-sm text-zinc-400">
          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          Yendo a tus pedidos...
        </div>
      </div>
    )
  }

  /* ── Checkout normal ────────────────────────────────────────────────── */
  return (
    /* pb-40 deja espacio para el botón fijo + barra nav */
    <div className="pb-40 space-y-4">

      {/* Cabecera con título y botones de acción */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Confirmar pedido</h1>
          <p className="text-zinc-400 text-sm">{cartCount} ítem{cartCount !== 1 ? "s" : ""} · {formatCOP(total)}</p>
        </div>
        <button
          onClick={() => { if (window.confirm("¿Seguro que quieres vaciar el carrito?")) clearCart() }}
          className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl border border-red-100 transition-colors"
        >
          🗑️ Vaciar
        </button>
      </div>

      {/* Resumen del pedido */}
      <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-zinc-50">
          <p className="font-black text-sm text-zinc-500 uppercase tracking-wide">Tu pedido</p>
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
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                      {item.modifiers.map(m => m.optionName).join(", ")}
                    </p>
                  )}
                  {item.comment && (
                    <p className="text-xs text-zinc-400 italic mt-0.5">"{item.comment}"</p>
                  )}
                </div>
                <p className="text-sm font-bold text-zinc-900 flex-shrink-0">
                  {formatCOP(item.price * item.quantity)}
                </p>
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
          <p className="font-black text-sm text-zinc-500 uppercase tracking-wide">Tipo de entrega</p>
          <div className="flex gap-2">
            {deliveryTypes.map((dt) => (
              <button
                key={dt} type="button" onClick={() => setDeliveryType(dt)}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all ${
                  deliveryType === dt ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-500"
                }`}
              >
                {dt === "DELIVERY" ? "🛵 Domicilio" : "🏪 Recoger"}
              </button>
            ))}
          </div>
          {deliveryType === "DELIVERY" && (
            <input
              value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Dirección de entrega, referencias..." required className={inputClass}
            />
          )}
        </div>
      )}

      {/* Notas */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm space-y-2">
        <p className="font-black text-sm text-zinc-500 uppercase tracking-wide">
          Notas <span className="text-zinc-400 font-normal normal-case">(opcional)</span>
        </p>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Indicaciones especiales, sin cebolla, extra salsa..."
          rows={2} className={`${inputClass} resize-none`}
        />
      </div>

      {/* Métodos de pago */}
      {paymentMethods.length > 0 && (
        <div className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm space-y-3">
          <p className="font-black text-sm text-zinc-500 uppercase tracking-wide">Método de pago</p>
          <div className="space-y-2">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id} type="button" onClick={() => setSelectedPayment(pm)}
                className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                  selectedPayment?.id === pm.id
                    ? "border-orange-400 bg-orange-50"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    selectedPayment?.id === pm.id ? "border-orange-500 bg-orange-500" : "border-zinc-300"
                  }`}>
                    {selectedPayment?.id === pm.id && <span className="text-white text-xs font-black">✓</span>}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-zinc-900">{pm.label}</p>
                    {pm.details && (
                      <p className="text-xs text-zinc-500 mt-0.5">{pm.details.split("\n")[0]}</p>
                    )}
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
              <div className="flex items-center justify-between bg-orange-100 rounded-xl px-3 py-2">
                <span className="text-xs text-orange-700 font-semibold">Monto a transferir</span>
                <span className="font-black text-orange-900">{formatCOP(total)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comprobante */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm space-y-3">
        <p className="font-black text-sm text-zinc-500 uppercase tracking-wide">Comprobante de pago</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleProof} />
        {proofPreview ? (
          <div className="space-y-2">
            <img src={proofPreview} alt="Comprobante" className="w-full rounded-2xl object-contain max-h-56 border border-zinc-100" />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-bold text-orange-500">
              📷 Cambiar comprobante
            </button>
          </div>
        ) : (
          <button
            type="button" onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-zinc-200 hover:border-orange-300 rounded-2xl py-10 flex flex-col items-center gap-2 transition-colors group"
          >
            <span className="text-4xl group-hover:scale-110 transition-transform">📸</span>
            <p className="text-sm font-bold text-zinc-500 group-hover:text-orange-500 transition-colors">
              Toca para adjuntar comprobante
            </p>
            <p className="text-xs text-zinc-400">Foto o captura de pantalla del pago</p>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <span className="text-lg">⚠️</span>
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* ── Botón fijo de envío ── encima del nav (nav ≈ 64px + padding) */}
      <div
        className="fixed left-0 right-0 px-4 z-20"
        style={{ bottom: "72px" }}
      >
        <div className="max-w-lg mx-auto space-y-2">
          {!canSubmit && !loading && (
            <p className="text-center text-xs text-zinc-400 bg-white/80 backdrop-blur-sm rounded-xl py-1.5">
              {!proof
                ? "📎 Adjunta el comprobante para continuar"
                : !selectedPayment
                ? "Selecciona un método de pago"
                : "Ingresa tu dirección de entrega"}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            style={{
              background: canSubmit && !loading
                ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                : undefined,
            }}
            className={`w-full rounded-3xl py-5 px-6 font-black text-white text-base transition-all
              ${canSubmit && !loading
                ? "shadow-[0_8px_30px_rgba(249,115,22,0.5)] active:scale-[0.97] hover:shadow-[0_8px_40px_rgba(249,115,22,0.6)]"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
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
                <span className="flex items-center gap-2 text-lg">
                  🚀 <span>Enviar pedido</span>
                </span>
                <span
                  className="text-sm font-black px-4 py-1.5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
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
