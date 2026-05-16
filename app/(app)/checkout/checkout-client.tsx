"use client"

import { formatCOP } from "@/lib/currency"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { placeOrder } from "@/app/actions/orders"

type CartItem = { id: string; name: string; price: number; quantity: number }
type PaymentMethod = { id: string; type: string; label: string; details: string | null; qrImageUrl: string | null }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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

    localStorage.removeItem("cart")
    localStorage.removeItem("restaurantId")
    localStorage.removeItem("paymentMethods")
    localStorage.removeItem("deliveryTypes")
    router.push("/orders")
  }

  if (cart.length === 0) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-10">
      <h1 className="text-xl font-bold text-zinc-900">Confirmar pedido</h1>

      {/* Resumen */}
      <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-700">{item.quantity}× {item.name}</span>
            <span className="text-sm font-medium">{formatCOP(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-semibold text-zinc-900">Total</span>
          <span className="font-bold text-lg">{formatCOP(total)}</span>
        </div>
      </div>

      {/* Tipo de entrega */}
      {deliveryTypes.length > 0 && (
        <div className="space-y-2">
          <Label>Tipo de entrega</Label>
          <div className="flex gap-2">
            {deliveryTypes.map((dt) => (
              <button
                key={dt}
                type="button"
                onClick={() => setDeliveryType(dt)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  deliveryType === dt ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600"
                }`}
              >
                {dt === "DELIVERY" ? "Delivery" : "Recoger en tienda"}
              </button>
            ))}
          </div>
        </div>
      )}

      {deliveryType === "DELIVERY" && (
        <div className="space-y-1.5">
          <Label htmlFor="address">Dirección de entrega</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, número, referencia" required />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas adicionales (opcional)</Label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sin cebolla, extra salsa..." />
      </div>

      {/* Métodos de pago */}
      {paymentMethods.length > 0 && (
        <div className="space-y-3">
          <Label>Método de pago</Label>
          <div className="space-y-2">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setSelectedPayment(pm)}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${
                  selectedPayment?.id === pm.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white"
                }`}
              >
                <p className="font-medium text-sm text-zinc-900">{pm.label}</p>
                {pm.details && <p className="text-xs text-zinc-500 mt-0.5">{pm.details}</p>}
              </button>
            ))}
          </div>

          {selectedPayment && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-zinc-900">Instrucciones de pago</p>
              {selectedPayment.qrImageUrl && (
                <div className="flex justify-center">
                  <img src={selectedPayment.qrImageUrl} alt="QR de pago" className="w-48 h-48 object-contain rounded-xl border border-zinc-100" />
                </div>
              )}
              {selectedPayment.details && (
                <p className="text-sm text-zinc-600 whitespace-pre-wrap">{selectedPayment.details}</p>
              )}
              <p className="text-xs text-zinc-400">Monto a pagar: <span className="font-bold text-zinc-900">{formatCOP(total)}</span></p>
            </div>
          )}
        </div>
      )}

      {/* Comprobante */}
      <div className="space-y-2">
        <Label>Comprobante de pago</Label>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleProof} />
        {proofPreview ? (
          <div className="relative">
            <img src={proofPreview} alt="Comprobante" className="w-full rounded-xl border border-zinc-200 object-contain max-h-56" />
            <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 text-xs text-zinc-500 underline">Cambiar imagen</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-zinc-300 rounded-xl py-8 text-center text-sm text-zinc-400 hover:border-zinc-400 transition-colors"
          >
            <span className="block text-2xl mb-1">📎</span>
            Toca para adjuntar el comprobante
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Enviando pedido..." : "Enviar pedido"}
      </Button>
    </form>
  )
}
