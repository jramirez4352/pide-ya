"use client"

import { useState } from "react"

export function ProofImage({ src }: { src: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left"
      >
        <div className="mt-1 relative rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50">
          <img
            src={src}
            alt="Comprobante de pago"
            className="w-full max-h-36 object-contain"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
            <span className="bg-white/90 text-zinc-700 text-xs font-bold px-3 py-1.5 rounded-full shadow opacity-0 hover:opacity-100 transition-opacity">
              🔍 Ver a tamaño completo
            </span>
          </div>
        </div>
        <p className="text-xs text-zinc-400 text-center mt-1">Toca para ampliar</p>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl font-bold transition-colors"
          >
            ×
          </button>
          <img
            src={src}
            alt="Comprobante de pago"
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <p className="text-white/60 text-sm mt-4">Toca fuera para cerrar</p>
        </div>
      )}
    </>
  )
}
