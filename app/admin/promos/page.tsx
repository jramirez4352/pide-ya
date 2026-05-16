import { db } from "@/lib/db"
import { createPromoCode, togglePromoCode } from "@/app/actions/promo"
import { formatCOP } from "@/lib/currency"

export default async function AdminPromosPage() {
  const promos = await db.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { restaurant: { select: { name: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Códigos de descuento</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Crea y gestiona códigos promocionales para toda la plataforma</p>
      </div>

      {/* Crear código */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
        <p className="font-black text-sm text-zinc-500 uppercase tracking-widest mb-4">+ Nuevo código</p>
        <form action={createPromoCode} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-500">Código</label>
              <input name="code" placeholder="VERANO20" required
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm uppercase font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:normal-case placeholder:font-normal" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500">Descuento (%)</label>
              <input name="discountPct" type="number" min="1" max="100" step="1" placeholder="20" required
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-500">Máx. usos (vacío = ilimitado)</label>
              <input name="maxUses" type="number" min="1" placeholder="100"
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500">Pedido mínimo (COP)</label>
              <input name="minOrder" type="number" min="0" step="1000" placeholder="0"
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-500">Vence el (vacío = sin vencimiento)</label>
              <input name="expiresAt" type="date"
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500">Descripción</label>
              <input name="description" placeholder="Ej: Promo de apertura"
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400" />
            </div>
          </div>
          <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl py-3 text-sm transition-colors">
            Crear código de descuento
          </button>
        </form>
      </div>

      {/* Lista de códigos */}
      {promos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-100 p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">🎁</p>
          <p className="text-zinc-500 font-semibold">Sin códigos aún</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm divide-y divide-zinc-50">
          {promos.map(p => {
            const expired = p.expiresAt && p.expiresAt < new Date()
            const exhausted = p.maxUses !== null && p.usedCount >= p.maxUses
            return (
              <div key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-zinc-900 font-mono">{p.code}</p>
                      <span className="text-xs font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{p.discountPct}% OFF</span>
                      {!p.active || expired || exhausted
                        ? <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">{expired ? "Vencido" : exhausted ? "Agotado" : "Inactivo"}</span>
                        : <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">Activo</span>
                      }
                    </div>
                    {p.description && <p className="text-xs text-zinc-400 mt-0.5">{p.description}</p>}
                    <div className="flex gap-3 mt-1 text-xs text-zinc-400 flex-wrap">
                      <span>Usado {p.usedCount}{p.maxUses ? `/${p.maxUses}` : ""} veces</span>
                      {p.minOrder > 0 && <span>Mínimo {formatCOP(p.minOrder)}</span>}
                      {p.expiresAt && <span>Vence {new Date(p.expiresAt).toLocaleDateString("es-CO")}</span>}
                      {p.restaurant && <span>Solo en: {p.restaurant.name}</span>}
                    </div>
                  </div>
                  <form action={togglePromoCode.bind(null, p.id, !p.active)}>
                    <button type="submit" className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                      p.active ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}>
                      {p.active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
