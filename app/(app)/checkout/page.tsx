import { CheckoutClient } from "./checkout-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CheckoutPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return <CheckoutClient userId={session.user.id} />
}
