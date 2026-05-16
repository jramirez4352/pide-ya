import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "RESTAURANT") return NextResponse.json({ count: 0 })
  const restaurant = await db.restaurant.findUnique({ where: { ownerId: session.user.id } })
  if (!restaurant) return NextResponse.json({ count: 0 })
  const count = await db.order.count({
    where: { restaurantId: restaurant.id, status: "PENDING" },
  })
  return NextResponse.json({ count })
}
