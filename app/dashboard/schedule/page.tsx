import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ScheduleForm } from "./schedule-form"

export default async function SchedulePage() {
  const session = await auth()
  if (!session) redirect("/login")
  const restaurant = await db.restaurant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, schedule: true, isOpen: true, name: true },
  })
  if (!restaurant) redirect("/login")
  return <ScheduleForm restaurant={restaurant} />
}
