import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/login", "/register"]
const adminRoutes = ["/admin"]
const restaurantRoutes = ["/dashboard"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (publicRoutes.includes(pathname)) {
    if (session) return NextResponse.redirect(new URL(getHome(session.user.role), req.url))
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url))
  }

  if (adminRoutes.some((r) => pathname.startsWith(r)) && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  if (restaurantRoutes.some((r) => pathname.startsWith(r)) && session.user.role !== "RESTAURANT") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

function getHome(role: string) {
  if (role === "ADMIN") return "/admin"
  if (role === "RESTAURANT") return "/dashboard"
  return "/"
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
