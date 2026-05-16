"use client"

import { useActionState, useState } from "react"
import { submitReview } from "@/app/actions/reviews"

export function ReviewForm({ orderId, restaurantName }: { orderId: string; restaurantName: string }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | undefined, fd: FormData) => submitReview(fd),
    undefined
  )

  return (
    <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm space-y-4">
      <div>
        <p className="font-black text-zinc-900">¿Cómo estuvo tu pedido?</p>
        <p className="text-xs text-zinc-400 mt-0.5">Califica tu experiencia en {restaurantName}</p>
      </div>

      <div className="flex gap-2 justify-center">
        {[1,2,3,4,5].map(s => (
          <button key={s} type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="text-4xl transition-transform hover:scale-110 active:scale-95">
            <span className={(hover || rating) >= s ? "text-yellow-400" : "text-zinc-200"}>★</span>
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p className="text-center text-sm font-bold text-zinc-600">
          {["", "Muy malo 😞", "Malo 😕", "Regular 😐", "Bueno 😊", "Excelente 🤩"][rating]}
        </p>
      )}

      <form action={action} className="space-y-3">
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="rating" value={rating} />
        <textarea name="comment" placeholder="Cuéntanos más sobre tu experiencia... (opcional)" rows={3}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400" />
        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
        <button type="submit" disabled={pending || rating === 0}
          className="w-full font-black rounded-2xl py-3.5 text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: rating > 0 ? "linear-gradient(135deg,#f97316,#ea580c)" : undefined, backgroundColor: rating === 0 ? "#e4e4e7" : undefined }}>
          {pending ? "Enviando..." : "Enviar reseña"}
        </button>
      </form>
    </div>
  )
}
