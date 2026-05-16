import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { RestaurantMenu } from "./restaurant-menu"

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const restaurant = await db.restaurant.findUnique({
    where: { id, status: "APPROVED" },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: {
          items: {
            where: { available: true },
            orderBy: { order: "asc" },
          },
        },
      },
      paymentMethods: { where: { active: true } },
    },
  })

  if (!restaurant) notFound()

  return <RestaurantMenu restaurant={restaurant} />
}
