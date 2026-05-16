"use client"

import { useState } from "react"

type Restaurant = { id: string; name: string }
type Zone = { id: string; name: string; city: string }

export function ReportsClient({ restaurants, zones }: { restaurants: Restaurant[]; zones: Zone[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [orderFrom, setOrderFrom] = useState(firstOfMonth)
  const [orderTo, setOrderTo] = useState(today)
  const [orderRestaurant, setOrderRestaurant] = useState("")
  const [customerFrom, setCustomerFrom] = useState("")
  const [customerTo, setCustomerTo] = useState("")
  const [customerZone, setCustomerZone] = useState("")
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  function buildUrl(base: string, params: Record<string, string>) {
    const url = new URL(base, window.location.origin)
    Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v) })
    return url.toString()
  }

  async function downloadOrders() {
    setLoadingOrders(true)
    const url = buildUrl("/api/admin/export/orders", {
      from: orderFrom,
      to: orderTo,
      restaurantId: orderRestaurant,
    })
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `pedidos_${orderFrom}_${orderTo}.csv`
    a.click()
    setLoadingOrders(false)
  }

  async function downloadCustomers() {
    setLoadingCustomers(true)
    const url = buildUrl("/api/admin/export/customers", {
      from: customerFrom,
      to: customerTo,
      zoneId: customerZone,
    })
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setLoadingCustomers(false)
  }

  const inputClass = "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
  const labelClass = "text-xs font-bold text-zinc-500 uppercase tracking-wide"

  return (
    <div className="space-y-6">

      {/* Exportar pedidos */}
      <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">🛍️</div>
          <div>
            <p className="font-black text-zinc-900">Exportar pedidos</p>
            <p className="text-xs text-zinc-400">CSV con todos los campos por negocio y fecha</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>Desde</label>
              <input type="date" value={orderFrom} onChange={e => setOrderFrom(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Hasta</label>
              <input type="date" value={orderTo} onChange={e => setOrderTo(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Negocio (opcional)</label>
            <select value={orderRestaurant} onChange={e => setOrderRestaurant(e.target.value)} className={inputClass}>
              <option value="">Todos los negocios</option>
              {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="bg-zinc-50 rounded-2xl p-3 text-xs text-zinc-500 space-y-1">
            <p className="font-bold text-zinc-700">Columnas incluidas:</p>
            <p>ID · Fecha · Hora · Negocio · Cliente · Email · Teléfono · Estado · Tipo de entrega · Dirección · Total · Descuento · Comisión · Ítems · Notas</p>
          </div>
          <button
            onClick={downloadOrders}
            disabled={loadingOrders}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black rounded-2xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loadingOrders ? (
              <><span className="animate-spin">⏳</span> Generando...</>
            ) : (
              <><span>⬇️</span> Descargar CSV de pedidos</>
            )}
          </button>
        </div>
      </div>

      {/* Exportar clientes */}
      <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">👥</div>
          <div>
            <p className="font-black text-zinc-900">Exportar clientes</p>
            <p className="text-xs text-zinc-400">Lista para marketing con comportamiento de compra</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>Registrados desde</label>
              <input type="date" value={customerFrom} onChange={e => setCustomerFrom(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Registrados hasta</label>
              <input type="date" value={customerTo} onChange={e => setCustomerTo(e.target.value)} className={inputClass} />
            </div>
          </div>
          {zones.length > 0 && (
            <div className="space-y-1.5">
              <label className={labelClass}>Zona (opcional)</label>
              <select value={customerZone} onChange={e => setCustomerZone(e.target.value)} className={inputClass}>
                <option value="">Todas las zonas</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name} — {z.city}</option>)}
              </select>
            </div>
          )}
          <div className="bg-zinc-50 rounded-2xl p-3 text-xs text-zinc-500 space-y-1">
            <p className="font-bold text-zinc-700">Columnas incluidas:</p>
            <p>Nombre · Email · Teléfono · Zona · Ciudad · Fecha de registro · Total pedidos · Total gastado · Último pedido · Restaurante favorito</p>
          </div>
          <button
            onClick={downloadCustomers}
            disabled={loadingCustomers}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black rounded-2xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loadingCustomers ? (
              <><span className="animate-spin">⏳</span> Generando...</>
            ) : (
              <><span>⬇️</span> Descargar CSV de clientes</>
            )}
          </button>
        </div>
      </div>

    </div>
  )
}
