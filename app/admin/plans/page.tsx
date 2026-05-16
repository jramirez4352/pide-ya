import { db } from "@/lib/db"
import { formatCOP } from "@/lib/currency"
import { createPlan, deletePlan, assignPlan, removePlan } from "@/app/actions/plans"

export default async function AdminPlansPage() {
  const [plans, restaurants] = await Promise.all([
    db.plan.findMany({ where: { active: true }, orderBy: { price: "asc" }, include: { _count: { select: { restaurants: true } } } }),
    db.restaurant.findMany({
      where: { status: "APPROVED" },
      orderBy: { name: "asc" },
      include: { plan: true },
    }),
  ])

  const withPlan = restaurants.filter(r => r.planId)
  const withoutPlan = restaurants.filter(r => !r.planId)
  const expiringSoon = withPlan.filter(r => r.paidUntil && r.paidUntil < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Planes de suscripción</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Gestiona los planes y suscripciones de los restaurantes</p>
      </div>

      {/* Alertas de vencimiento */}
      {expiringSoon.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-black text-yellow-800">⚠️ Vencen en los próximos 7 días</p>
          {expiringSoon.map(r => (
            <p key={r.id} className="text-sm text-yellow-700">
              • {r.name} — vence {r.paidUntil ? new Date(r.paidUntil).toLocaleDateString("es-CO") : ""}
            </p>
          ))}
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Suscripciones activas", value: withPlan.length, color: "bg-green-50 text-green-600" },
          { label: "Sin plan", value: withoutPlan.length, color: "bg-yellow-50 text-yellow-600" },
          { label: "Planes disponibles", value: plans.length, color: "bg-orange-50 text-orange-600" },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-xs font-medium leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Crear plan */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
        <p className="font-black text-sm text-zinc-500 uppercase tracking-widest mb-4">+ Nuevo plan</p>
        <form action={createPlan} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-500">Nombre del plan</label>
              <input name="name" placeholder="Básico, Estándar, Pro..." required
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500">Precio mensual (COP)</label>
              <input name="price" type="number" step="1000" min="0" placeholder="150000" required
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-500">Comisión por pedido (%)</label>
              <input name="commissionPct" type="number" step="0.5" min="0" max="30" defaultValue="5" placeholder="5"
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500">Zonas incluidas</label>
              <input name="maxZones" type="number" min="1" defaultValue="1" placeholder="1"
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500">Características (una por línea)</label>
            <textarea name="features" rows={3} placeholder={"Hasta 50 productos\nSoporte prioritario\nEstadísticas básicas"}
              className="mt-1 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400" />
          </div>
          <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl py-3 text-sm transition-colors">
            Crear plan
          </button>
        </form>
      </div>

      {/* Lista de planes */}
      {plans.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Planes activos</p>
          <div className="grid gap-3">
            {plans.map(plan => (
              <div key={plan.id} className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-zinc-900 text-lg">{plan.name}</p>
                    <p className="text-2xl font-black text-orange-500 mt-1">{formatCOP(plan.price)}<span className="text-sm text-zinc-400 font-normal">/mes</span></p>
                    <div className="flex gap-3 mt-2 text-xs text-zinc-500">
                      <span>📊 {plan.commissionPct}% comisión</span>
                      <span>🗺️ {plan.maxZones} zona{plan.maxZones !== 1 ? "s" : ""}</span>
                      <span>🏪 {plan._count.restaurants} restaurante{plan._count.restaurants !== 1 ? "s" : ""}</span>
                    </div>
                    {plan.features.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {plan.features.map((f, i) => <li key={i} className="text-xs text-zinc-500">✓ {f}</li>)}
                      </ul>
                    )}
                  </div>
                  <form action={deletePlan.bind(null, plan.id)}>
                    <button type="submit" className="text-xs text-red-400 hover:text-red-600 font-medium">Desactivar</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asignar plan a restaurante */}
      <div className="space-y-3">
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Suscripciones de restaurantes</p>

        {withoutPlan.length > 0 && (
          <div className="bg-white rounded-3xl border border-yellow-100 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-yellow-50 border-b border-yellow-100">
              <p className="text-sm font-bold text-yellow-700">Sin plan activo ({withoutPlan.length})</p>
            </div>
            <div className="divide-y divide-zinc-50">
              {withoutPlan.map(r => (
                <div key={r.id} className="p-4">
                  <p className="font-bold text-sm text-zinc-900 mb-2">{r.name}</p>
                  <form action={assignPlan} className="flex gap-2 flex-wrap">
                    <input type="hidden" name="restaurantId" value={r.id} />
                    <select name="planId" required className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                      <option value="">Seleccionar plan...</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {formatCOP(p.price)}/mes</option>)}
                    </select>
                    <select name="months" className="rounded-xl border border-zinc-200 px-3 py-2 text-sm bg-white">
                      {[1,2,3,6,12].map(m => <option key={m} value={m}>{m} {m === 1 ? "mes" : "meses"}</option>)}
                    </select>
                    <button type="submit" className="bg-orange-500 text-white font-bold rounded-xl px-4 py-2 text-sm hover:bg-orange-600">Asignar</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        {withPlan.length > 0 && (
          <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm divide-y divide-zinc-50">
            {withPlan.map(r => {
              const expired = r.paidUntil && r.paidUntil < new Date()
              return (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-zinc-900">{r.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${expired ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                          {r.plan?.name}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {expired ? "⚠️ Vencido" : "✓ Activo"} hasta {r.paidUntil ? new Date(r.paidUntil).toLocaleDateString("es-CO") : "—"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{r.commissionPct}% comisión · {formatCOP(r.plan?.price ?? 0)}/mes</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <form action={assignPlan} className="flex gap-1">
                        <input type="hidden" name="restaurantId" value={r.id} />
                        <input type="hidden" name="planId" value={r.planId ?? ""} />
                        <select name="months" className="rounded-xl border border-zinc-200 px-2 py-1 text-xs bg-white">
                          {[1,2,3,6,12].map(m => <option key={m} value={m}>+{m}m</option>)}
                        </select>
                        <button type="submit" className="bg-zinc-900 text-white rounded-xl px-3 py-1 text-xs font-bold">Renovar</button>
                      </form>
                      <form action={removePlan.bind(null, r.id)}>
                        <button type="submit" className="text-xs text-red-400 hover:text-red-600">Quitar plan</button>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
