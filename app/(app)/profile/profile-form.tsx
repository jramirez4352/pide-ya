"use client"

import { useState, useTransition } from "react"
import { updateProfile } from "@/app/actions/profile"

type Props = {
  user: { name: string; email: string; phone: string | null }
}

export function ProfileForm({ user }: Props) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSave(formData: FormData) {
    setError("")
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setEditing(false)
      }
    })
  }

  if (!editing) {
    return (
      <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="font-black text-zinc-900">Datos personales</p>
          <button onClick={() => setEditing(true)} className="text-sm font-bold text-orange-500 hover:text-orange-600">
            Editar
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">👤</span>
            <div>
              <p className="text-xs text-zinc-400">Nombre</p>
              <p className="text-sm font-semibold text-zinc-900">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">✉️</span>
            <div>
              <p className="text-xs text-zinc-400">Email</p>
              <p className="text-sm font-semibold text-zinc-900">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">📞</span>
            <div>
              <p className="text-xs text-zinc-400">Teléfono</p>
              <p className="text-sm font-semibold text-zinc-900">{user.phone || "No registrado"}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-orange-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="font-black text-zinc-900">Editar datos</p>
        <button onClick={() => setEditing(false)} className="text-sm text-zinc-400 hover:text-zinc-600">
          Cancelar
        </button>
      </div>
      <form action={handleSave} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Nombre</label>
          <input name="name" defaultValue={user.name} required
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Teléfono</label>
          <input name="phone" defaultValue={user.phone ?? ""} type="tel" placeholder="+57 300 000 0000"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={isPending}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-2xl py-3 text-sm transition-colors">
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  )
}
