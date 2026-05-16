import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { ItemForm } from "./item-form"

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ categoryId?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const { id } = await params
  const { categoryId } = await searchParams

  const restaurant = await db.restaurant.findUnique({
    where: { ownerId: session.user.id },
    include: { categories: { orderBy: { order: "asc" }, select: { id: true, name: true } } },
  })
  if (!restaurant) redirect("/login")

  if (id === "new") {
    return (
      <ItemForm
        restaurantId={restaurant.id}
        categories={restaurant.categories}
        defaultCategoryId={categoryId}
      />
    )
  }

  const item = await db.menuItem.findFirst({
    where: { id, category: { restaurantId: restaurant.id } },
    include: {
      modifierGroups: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  })
  if (!item) notFound()

  return (
    <ItemForm
      restaurantId={restaurant.id}
      categories={restaurant.categories}
      item={item}
    />
  )
}
