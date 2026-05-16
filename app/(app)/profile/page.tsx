import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { ProfileForm } from "./profile-form"
import { addAddress, deleteAddress, setDefaultAddress } from "@/app/actions/profile"

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [user, addresses, orderCount] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, phone: true } }),
    db.savedAddress.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    db.order.count({ where: { customerId: session.user.id } }),
  ])

  if (!user) redirect("/login")

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Mi perfil</h1>
        <p className="text-zinc-400 text-sm">Gestiona tu información personal y direcciones</p>
      </div>

      {/* Avatar + stats */}
      <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-black text-orange-500">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-zinc-900 text-lg truncate">{user.name}</p>
            <p className="text-sm text-zinc-400 truncate">{user.email}</p>
            {user.phone && <p className="text-sm text-zinc-400">{user.phone}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-50">
          <Link href="/orders" className="bg-orange-50 rounded-2xl p-3 text-center hover:bg-orange-100 transition-colors">
            <p className="text-2xl font-black text-orange-500">{orderCount}</p>
            <p className="text-xs text-zinc-500 font-medium">Pedidos totales</p>
          </Link>
          <div className="bg-zinc-50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-zinc-700">{addresses.length}</p>
            <p className="text-xs text-zinc-500 font-medium">Direcciones guardadas</p>
          </div>
        </div>
      </div>

      {/* Editar datos personales */}
      <ProfileForm user={user} />

      {/* Direcciones guardadas */}
      <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-50">
          <p className="font-black text-zinc-900">Mis direcciones</p>
          <p className="text-xs text-zinc-400 mt-0.5">Úsalas en el checkout sin volver a escribirlas</p>
        </div>

        {addresses.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-3xl mb-2">📍</p>
            <p className="text-sm text-zinc-500">Aún no tienes direcciones guardadas</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {addresses.map((addr) => (
              <div key={addr.id} className="flex items-start gap-3 px-5 py-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${addr.isDefault ? "bg-orange-100" : "bg-zinc-100"}`}>
                  {addr.isDefault ? "⭐" : "📍"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-zinc-900">{addr.label}</p>
                    {addr.isDefault && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">Principal</span>}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{addr.address}</p>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                  {!addr.isDefault && (
                    <form action={setDefaultAddress}>
                      <input type="hidden" name="id" value={addr.id} />
                      <button type="submit" className="text-xs text-orange-500 font-bold hover:text-orange-700">
                        Usar principal
                      </button>
                    </form>
                  )}
                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={addr.id} />
                    <button type="submit" className="text-xs text-red-400 hover:text-red-600 font-medium">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agregar nueva dirección */}
        <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-100 space-y-3">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">+ Nueva dirección</p>
          <form action={addAddress} className="space-y-2">
            <input
              name="label"
              placeholder="Nombre (Casa, Trabajo, Gym...)"
              required
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400"
            />
            <input
              name="address"
              placeholder="Dirección completa y referencias"
              required
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400"
            />
            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl py-3 text-sm transition-colors">
              Guardar dirección
            </button>
          </form>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm divide-y divide-zinc-50">
        <Link href="/orders" className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50 transition-colors">
          <span className="text-xl">🛍️</span>
          <div className="flex-1">
            <p className="font-bold text-sm text-zinc-900">Historial de pedidos</p>
            <p className="text-xs text-zinc-400">{orderCount} pedido{orderCount !== 1 ? "s" : ""} realizados</p>
          </div>
          <span className="text-zinc-300">›</span>
        </Link>
        <Link href="/" className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50 transition-colors">
          <span className="text-xl">🍽️</span>
          <div className="flex-1">
            <p className="font-bold text-sm text-zinc-900">Ver restaurantes</p>
            <p className="text-xs text-zinc-400">Explora lo que hay disponible</p>
          </div>
          <span className="text-zinc-300">›</span>
        </Link>
      </div>
    </div>
  )
}
