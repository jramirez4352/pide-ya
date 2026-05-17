import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { RestaurantMenu } from "./restaurant-menu"

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [restaurant, ratingData] = await Promise.all([
    db.restaurant.findUnique({
      where: { id, status: "APPROVED" },
      include: {
        categories: {
          orderBy: { order: "asc" },
          include: {
            items: {
              where: { available: true },
              orderBy: { order: "asc" },
              include: {
                modifierGroups: {
                  orderBy: { order: "asc" },
                  include: { options: { orderBy: { order: "asc" } } },
                },
              },
            },
          },
        },
        paymentMethods: { where: { active: true } },
      },
    }),
    db.review.aggregate({
      where: { restaurantId: id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ])

  if (!restaurant) notFound()

  const rating = {
    avg: ratingData._avg.rating ?? 0,
    count: ratingData._count.rating,
  }

  return <RestaurantMenu restaurant={restaurant} rating={rating} />
}
