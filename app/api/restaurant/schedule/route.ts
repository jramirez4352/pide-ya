import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "RESTAURANT") return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { schedule, isOpen } = await req.json()
  await db.restaurant.update({
    where: { ownerId: session.user.id },
    data: { schedule: JSON.stringify(schedule), isOpen },
  })
  return NextResponse.json({ ok: true })
}
