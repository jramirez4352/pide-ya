"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { saveMenuItem, addModifierGroup, deleteModifierGroup, addModifierOption, deleteModifierOption } from "@/app/actions/restaurant"
import { formatCOP } from "@/lib/currency"

type Category = { id: string; name: string }
type ModifierOption = { id: string; name: string; price: number }
type ModifierGroup = { id: string; name: string; required: boolean; multiSelect: boolean; options: ModifierOption[] }
type Item = {
  id: string; name: string; description: string | null; price: number
  categoryId: string; available: boolean; imageUrl: string | null
  modifierGroups: ModifierGroup[]
}

export function ItemForm({
  restaurantId,
  categories,
  item,
  defaultCategoryId,
}: {
  restaurantId: string
  categories: Category[]
  item?: Item
  defaultCategoryId?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [imagePreview, setImagePreview] = useState<string | null>(item?.imageUrl ?? null)
  const [name, setName] = useState(item?.name ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [price, setPrice] = useState(item?.price?.toString() ?? "")
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "")
  const [available, setAvailable] = useState(item?.available ?? true)
  const [error, setError] = useState("")
  const [modGroups, setModGroups] = useState<ModifierGroup[]>(item?.modifierGroups ?? [])
  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!formRef.current) return
    setError("")
    const formData = new FormData(formRef.current)
    if (item) formData.set("id", item.id)
    const result = await saveMenuItem(formData)
    if (result.error) { setError(result.error); return }
    router.push("/dashboard/menu")
    router.refresh()
  }

  async function handleAddGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!item) return
    const fd = new FormData(e.currentTarget)
    fd.set("menuItemId", item.id)
    await addModifierGroup(fd)
    e.currentTarget.reset()
    // Refresh group list
    const updated = await fetch(`/api/item-groups?id=${item.id}`)
    // We'll do a page-level refresh instead
    router.refresh()
  }

  async function handleDeleteGroup(groupId: string) {
    await deleteModifierGroup(groupId)
    setModGroups(prev => prev.filter(g => g.id !== groupId))
    router.refresh()
  }

  async function handleAddOption(e: React.FormEvent<HTMLFormElement>, groupId: string) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("modifierGroupId", groupId)
    await addModifierOption(fd)
    e.currentTarget.reset()
    router.refresh()
  }

  async function handleDeleteOption(optionId: string) {
    await deleteModifierOption(optionId)
    router.refresh()
  }

  const inputClass = "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400 transition-all"

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200">
          ‹
        </button>
        <div>
          <h1 className="text-xl font-black text-zinc-900">{item ? "Editar plato" : "Nuevo plato"}</h1>
          <p className="text-zinc-400 text-xs">Completa la información del plato</p>
        </div>
      </div>

      <form ref={formRef} className="space-y-5">
        {/* Foto */}
        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
          <input ref={fileRef} type="file" name="image" accept="image/*" className="hidden" onChange={handleImage} />
          <button type="button" onClick={() => fileRef.current?.click()} className="w-full">
            {imagePreview ? (
              <div className="relative h-52 bg-zinc-100">
                <img src={imagePreview} alt="Foto del plato" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="bg-white text-zinc-800 font-bold text-sm px-4 py-2 rounded-2xl shadow-lg">Cambiar foto</span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2 bg-orange-50">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <span className="text-3xl">📷</span>
                </div>
                <p className="font-bold text-sm text-zinc-500">Toca para agregar foto</p>
                <p className="text-xs text-zinc-400">JPG, PNG o WEBP</p>
              </div>
            )}
          </button>
          {imagePreview && (
            <div className="px-4 py-2 border-t border-zinc-50">
              <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-orange-500 font-bold">
                📷 Cambiar foto
              </button>
            </div>
          )}
        </div>

        {/* Datos básicos */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm space-y-4">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Información del plato</p>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700">Nombre <span className="text-red-400">*</span></label>
            <input name="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Burger BBQ con tocino" required className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700">Descripción <span className="text-zinc-400 font-normal">(opcional)</span></label>
            <textarea
              name="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ingredientes, preparación, tamaño..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700">Precio <span className="text-red-400">*</span></label>
              <input
                name="price"
                type="number"
                step="100"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="35000"
                required
                className={inputClass}
              />
              {price && !isNaN(parseFloat(price)) && (
                <p className="text-xs text-orange-500 font-bold">{formatCOP(parseFloat(price))}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700">Categoría</label>
              <select name="categoryId" value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-12 h-6 rounded-full transition-colors relative ${available ? "bg-orange-500" : "bg-zinc-200"}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${available ? "left-6" : "left-0.5"}`} />
            </div>
            <span className="text-sm font-bold text-zinc-700">{available ? "Plato disponible" : "No disponible (oculto)"}</span>
            <input type="checkbox" name="available" checked={available} onChange={e => setAvailable(e.target.checked)} className="hidden" />
          </label>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-2xl px-4 py-3">{error}</p>}

        <button
          type="button"
          onClick={() => startTransition(handleSave)}
          disabled={isPending}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl py-4 text-sm transition-colors disabled:opacity-60 shadow-lg shadow-orange-200"
        >
          {isPending ? "Guardando..." : item ? "Guardar cambios" : "Crear plato"}
        </button>
      </form>

      {/* Modificadores — solo si el plato ya existe */}
      {item ? (
        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-50">
            <p className="font-black text-zinc-900">Modificadores y extras</p>
            <p className="text-xs text-zinc-400 mt-0.5">Grupos de opciones que el cliente puede seleccionar al pedir</p>
          </div>

          {modGroups.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-zinc-400">
              Sin modificadores. Agrega uno abajo.
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {modGroups.map(group => (
                <div key={group.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-zinc-900">{group.name}</p>
                      {group.required && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">Obligatorio</span>}
                      {group.multiSelect && <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">Selección múltiple</span>}
                    </div>
                    <button type="button" onClick={() => handleDeleteGroup(group.id)} className="text-xs text-red-400 hover:text-red-600 font-medium">
                      Eliminar grupo
                    </button>
                  </div>

                  {/* Opciones */}
                  <div className="space-y-1.5">
                    {group.options.map(opt => (
                      <div key={opt.id} className="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-2">
                        <span className="text-sm text-zinc-700">{opt.name}</span>
                        <div className="flex items-center gap-2">
                          {opt.price > 0 && <span className="text-xs font-bold text-orange-500">+{formatCOP(opt.price)}</span>}
                          <button type="button" onClick={() => handleDeleteOption(opt.id)} className="text-zinc-300 hover:text-red-400 font-bold text-lg">×</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Agregar opción */}
                  <form onSubmit={e => handleAddOption(e, group.id)} className="flex gap-2">
                    <input name="name" placeholder="Nueva opción" required className="flex-1 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 placeholder:text-zinc-400" />
                    <input name="price" type="number" step="100" min="0" placeholder="+ precio" className="w-24 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 placeholder:text-zinc-400" />
                    <button type="submit" className="bg-orange-100 text-orange-600 rounded-xl px-3 py-2 text-sm font-bold hover:bg-orange-200 transition-colors">+</button>
                  </form>
                </div>
              ))}
            </div>
          )}

          {/* Agregar grupo */}
          <div className="px-4 py-4 bg-zinc-50 border-t border-zinc-100 space-y-3">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Nuevo grupo de modificadores</p>
            <form onSubmit={handleAddGroup} className="space-y-3">
              <input
                name="name"
                placeholder="Ej: Término, Extras, Salsas, Tamaño..."
                required
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400"
              />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input type="checkbox" name="required" className="rounded accent-orange-500" />
                  <span>Obligatorio</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input type="checkbox" name="multiSelect" className="rounded accent-orange-500" />
                  <span>Selección múltiple</span>
                </label>
              </div>
              <button type="submit" className="w-full bg-zinc-900 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors">
                Crear grupo de modificadores
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 text-sm text-orange-600 text-center">
          Guarda el plato primero para agregar modificadores y extras
        </div>
      )}
    </div>
  )
}
