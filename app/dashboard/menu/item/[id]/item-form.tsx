"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  saveMenuItem,
  addModifierGroup,
  deleteModifierGroup,
  addModifierOption,
  deleteModifierOption,
} from "@/app/actions/restaurant"
import { formatCOP } from "@/lib/currency"

type Category = { id: string; name: string }
type ModifierOption = { id: string; name: string; price: number }
type ModifierGroup = { id: string; name: string; required: boolean; multiSelect: boolean; options: ModifierOption[] }
type Item = {
  id: string; name: string; description: string | null; price: number
  categoryId: string; available: boolean; imageUrl: string | null
  modifierGroups: ModifierGroup[]
}

const inputClass = "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400 transition-all"

export function ItemForm({
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
  const [saving, startSave] = useTransition()
  const [imagePreview, setImagePreview] = useState<string | null>(item?.imageUrl ?? null)
  const [name, setName] = useState(item?.name ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [price, setPrice] = useState(item?.price?.toString() ?? "")
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "")
  const [available, setAvailable] = useState(item?.available ?? true)
  const [saveError, setSaveError] = useState("")
  const [groups, setGroups] = useState<ModifierGroup[]>(item?.modifierGroups ?? [])
  const [addingGroup, setAddingGroup] = useState(false)
  const [addingOptionFor, setAddingOptionFor] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const groupFormRef = useRef<HTMLFormElement>(null)

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
  }

  function handleSave() {
    startSave(async () => {
      setSaveError("")
      if (!formRef.current) return
      const formData = new FormData(formRef.current)
      if (item) formData.set("id", item.id)
      const result = await saveMenuItem(formData)
      if (result?.error) { setSaveError(result.error); return }
      router.push("/dashboard/menu")
    })
  }

  async function handleAddGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!item) return
    setAddingGroup(true)
    const fd = new FormData(e.currentTarget)
    fd.set("menuItemId", item.id)
    const newGroup = await addModifierGroup(fd)
    setAddingGroup(false)
    if (!newGroup) return
    setGroups(prev => [...prev, { ...newGroup, options: [] }])
    e.currentTarget.reset()
  }

  async function handleDeleteGroup(groupId: string) {
    await deleteModifierGroup(groupId)
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }

  async function handleAddOption(e: React.FormEvent<HTMLFormElement>, groupId: string) {
    e.preventDefault()
    setAddingOptionFor(groupId)
    const fd = new FormData(e.currentTarget)
    fd.set("modifierGroupId", groupId)
    const newOption = await addModifierOption(fd)
    setAddingOptionFor(null)
    if (!newOption) return
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, options: [...g.options, newOption] } : g
    ))
    e.currentTarget.reset()
  }

  async function handleDeleteOption(groupId: string, optionId: string) {
    await deleteModifierOption(optionId)
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, options: g.options.filter(o => o.id !== optionId) } : g
    ))
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 text-xl font-bold"
        >
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
          <button type="button" onClick={() => fileRef.current?.click()} className="w-full block">
            {imagePreview ? (
              <div className="relative h-52 bg-zinc-100">
                <img src={imagePreview} alt="Foto del plato" className="w-full h-full object-cover" />
                <div className="absolute bottom-3 right-3 bg-white text-zinc-800 font-bold text-xs px-3 py-1.5 rounded-xl shadow-md">
                  📷 Cambiar foto
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <span className="text-3xl">📷</span>
                </div>
                <p className="font-bold text-sm text-zinc-600">Toca para agregar foto del plato</p>
                <p className="text-xs text-zinc-400">JPG, PNG o WEBP</p>
              </div>
            )}
          </button>
        </div>

        {/* Datos básicos */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm space-y-4">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Información del plato</p>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700">Nombre <span className="text-red-400">*</span></label>
            <input
              name="name" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej: Burger BBQ con tocino" required className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700">
              Descripción <span className="text-zinc-400 font-normal">(opcional)</span>
            </label>
            <textarea
              name="description" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Ingredientes, preparación, tamaño..." rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700">Precio <span className="text-red-400">*</span></label>
              <input
                name="price" type="number" step="100" min="0" value={price}
                onChange={e => setPrice(e.target.value)} placeholder="35000" required className={inputClass}
              />
              {price && !isNaN(parseFloat(price)) && parseFloat(price) > 0 && (
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

          <button
            type="button"
            onClick={() => setAvailable(v => !v)}
            className="flex items-center gap-3 w-full"
          >
            <input type="hidden" name="available" value={available ? "on" : "off"} />
            <div className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${available ? "bg-orange-500" : "bg-zinc-200"}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${available ? "left-6" : "left-0.5"}`} />
            </div>
            <span className="text-sm font-bold text-zinc-700 text-left">
              {available ? "Plato disponible para clientes" : "Plato oculto (no disponible)"}
            </span>
          </button>
        </div>

        {saveError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{saveError}</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl py-4 text-sm transition-colors disabled:opacity-60 shadow-lg shadow-orange-200"
        >
          {saving ? "Guardando..." : item ? "Guardar cambios" : "Crear plato"}
        </button>
      </form>

      {/* Modificadores */}
      {item ? (
        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-50">
            <p className="font-black text-zinc-900">Modificadores y extras</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Grupos de opciones que el cliente selecciona al pedir
            </p>
          </div>

          {/* Lista de grupos */}
          {groups.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-3xl mb-2">⚙️</p>
              <p className="text-sm text-zinc-500 font-medium">Sin modificadores</p>
              <p className="text-xs text-zinc-400 mt-1">Agrega grupos como "Tamaño", "Extras" o "Salsas"</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {groups.map(group => (
                <div key={group.id} className="p-4 space-y-3">
                  {/* Header grupo */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-zinc-900">{group.name}</p>
                      {group.required && (
                        <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">
                          Obligatorio
                        </span>
                      )}
                      {group.multiSelect && (
                        <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-medium">
                          Varios
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium flex-shrink-0"
                    >
                      Eliminar grupo
                    </button>
                  </div>

                  {/* Opciones existentes */}
                  {group.options.length > 0 && (
                    <div className="space-y-1.5">
                      {group.options.map(opt => (
                        <div key={opt.id} className="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-2.5">
                          <span className="text-sm text-zinc-800">{opt.name}</span>
                          <div className="flex items-center gap-3">
                            {opt.price > 0 && (
                              <span className="text-xs font-bold text-orange-500">+{formatCOP(opt.price)}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(group.id, opt.id)}
                              className="text-zinc-300 hover:text-red-400 font-bold text-lg leading-none"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Form agregar opción */}
                  <form onSubmit={e => handleAddOption(e, group.id)} className="flex gap-2">
                    <input
                      name="name"
                      placeholder="Nombre de la opción"
                      required
                      className="flex-1 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 placeholder:text-zinc-400 min-w-0"
                    />
                    <input
                      name="price"
                      type="number"
                      step="100"
                      min="0"
                      defaultValue="0"
                      placeholder="+ precio"
                      className="w-24 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 placeholder:text-zinc-400"
                    />
                    <button
                      type="submit"
                      disabled={addingOptionFor === group.id}
                      className="bg-orange-100 text-orange-600 rounded-xl px-3 py-2 text-sm font-bold hover:bg-orange-200 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {addingOptionFor === group.id ? "..." : "+"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          {/* Form nuevo grupo */}
          <div className="px-4 py-4 bg-zinc-50 border-t border-zinc-100 space-y-3">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">
              + Nuevo grupo de modificadores
            </p>
            <form ref={groupFormRef} onSubmit={handleAddGroup} className="space-y-3">
              <input
                name="name"
                placeholder="Ej: Término, Extras, Salsas, Tamaño..."
                required
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400"
              />
              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
                  <input type="checkbox" name="required" className="w-4 h-4 rounded accent-orange-500" />
                  <span>Obligatorio</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
                  <input type="checkbox" name="multiSelect" className="w-4 h-4 rounded accent-orange-500" />
                  <span>Selección múltiple</span>
                </label>
              </div>
              <button
                type="submit"
                disabled={addingGroup}
                className="w-full bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-bold transition-colors"
              >
                {addingGroup ? "Creando grupo..." : "Crear grupo de modificadores"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-4 text-sm text-orange-600 text-center">
          💡 Guarda el plato primero para agregar modificadores y extras
        </div>
      )}
    </div>
  )
}
