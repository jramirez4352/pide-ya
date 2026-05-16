import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { addPaymentMethod, deletePaymentMethod } from "@/app/actions/restaurant"

export default async function PaymentsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const restaurant = await db.restaurant.findUnique({
    where: { ownerId: session.user.id },
    include: { paymentMethods: { orderBy: { id: "asc" } } },
  })

  if (!restaurant) redirect("/login")

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">Métodos de pago</h1>

      {/* Lista actual */}
      {restaurant.paymentMethods.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-sm">No tienes métodos de pago configurados</div>
      ) : (
        <div className="space-y-3">
          {restaurant.paymentMethods.map((pm) => (
            <div key={pm.id} className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm text-zinc-900">{pm.label}</p>
                  <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{pm.type}</span>
                </div>
                <form action={async () => { "use server"; await deletePaymentMethod(pm.id) }}>
                  <button type="submit" className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                </form>
              </div>
              {pm.details && <p className="text-sm text-zinc-600 whitespace-pre-wrap">{pm.details}</p>}
              {pm.qrImageUrl && (
                <img src={pm.qrImageUrl} alt="QR" className="w-32 h-32 object-contain rounded-xl border border-zinc-100" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Agregar nuevo */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4">
        <p className="text-sm font-semibold text-zinc-700 mb-4">Agregar método de pago</p>
        <form action={addPaymentMethod} className="space-y-3" encType="multipart/form-data">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Tipo</label>
            <select name="type" required className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white">
              <option value="QR">QR</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="CASH">Efectivo</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Etiqueta visible al cliente</label>
            <input name="label" placeholder="Ej: Pago por QR Simple, Tigo Money, Banco BCP..." required className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Detalles (número de cuenta, alias, etc.)</label>
            <textarea name="details" rows={3} placeholder="Ej: Cuenta: 1234567890&#10;Banco BCP&#10;A nombre de: Juan Pérez" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Imagen QR (opcional)</label>
            <input name="qrImage" type="file" accept="image/*" className="w-full text-sm text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:text-zinc-700 file:text-xs hover:file:bg-zinc-200" />
          </div>
          <button type="submit" className="w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-zinc-800 transition-colors">
            Agregar método
          </button>
        </form>
      </div>
    </div>
  )
}
