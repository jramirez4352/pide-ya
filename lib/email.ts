import nodemailer from "nodemailer"
import { formatCOP } from "@/lib/currency"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function base(content: string) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
      <div style="margin-bottom:24px">
        <div style="background:#f97316;width:44px;height:44px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center">
          <span style="font-size:22px">🍔</span>
        </div>
        <span style="font-size:20px;font-weight:900;color:#18181b;margin-left:10px;vertical-align:middle">PideYa</span>
      </div>
      ${content}
      <p style="color:#a1a1aa;font-size:11px;margin-top:32px;border-top:1px solid #f4f4f5;padding-top:16px">
        Este correo fue enviado automáticamente por PideYa. No respondas a este mensaje.
      </p>
    </div>
  `
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:14px;padding:13px 28px;border-radius:14px;text-decoration:none;margin:20px 0">${text}</a>`
}

// Envío crítico — lanza si falla (ej: reset de contraseña)
function send(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER o EMAIL_PASS no están configurados")
  }
  return transporter.sendMail({
    from: `"PideYa" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: base(html),
  })
}

// Envío opcional — fire-and-forget (notificaciones, bienvenida, etc.)
function sendSilent(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return
  transporter.sendMail({
    from: `"PideYa" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: base(html),
  }).catch(() => {})
}

const APP = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://pide-ya.vercel.app"

// ─── Registro ─────────────────────────────────────────────────────────────────

export function sendWelcomeCustomer(to: string, name: string) {
  return sendSilent(to, "¡Bienvenido a PideYa! 🍔", `
    <h1 style="font-size:22px;font-weight:900;color:#18181b;margin:0 0 8px">¡Hola, ${name}!</h1>
    <p style="color:#52525b;font-size:15px;margin:0 0 4px">Tu cuenta en PideYa está lista.</p>
    <p style="color:#71717a;font-size:14px;margin:0 0 20px">Explora los restaurantes disponibles en tu zona y haz tu primer pedido.</p>
    ${btn("Ver restaurantes", APP())}
  `)
}

export function sendWelcomeRestaurant(to: string, ownerName: string, restaurantName: string) {
  return sendSilent(to, `Restaurante registrado — ${restaurantName}`, `
    <h1 style="font-size:22px;font-weight:900;color:#18181b;margin:0 0 8px">¡Hola, ${ownerName}!</h1>
    <p style="color:#52525b;font-size:15px;margin:0 0 4px">Tu restaurante <strong>${restaurantName}</strong> fue registrado exitosamente.</p>
    <p style="color:#71717a;font-size:14px;margin:0 0 4px">Nuestro equipo revisará tu solicitud y recibirás un correo cuando sea aprobada.</p>
    <p style="color:#71717a;font-size:14px;margin:0 0 20px">Mientras tanto puedes preparar tu menú.</p>
    ${btn("Ir al dashboard", `${APP()}/dashboard`)}
  `)
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

type OrderItem = { name: string; quantity: number; price: number }

function itemsTable(items: OrderItem[]) {
  const rows = items.map(i =>
    `<tr>
      <td style="padding:6px 0;color:#52525b;font-size:14px">${i.quantity}× ${i.name}</td>
      <td style="padding:6px 0;color:#18181b;font-size:14px;font-weight:700;text-align:right">${formatCOP(i.price * i.quantity)}</td>
    </tr>`
  ).join("")
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>`
}

export function sendOrderConfirmation(to: string, data: { // fire-and-forget
  customerName: string
  restaurantName: string
  orderId: string
  items: OrderItem[]
  total: number
  deliveryType: string
  address?: string | null
}) {
  const isDelivery = data.deliveryType === "DELIVERY"
  return sendSilent(to, `Pedido recibido — ${data.restaurantName} 🛍️`, `
    <h1 style="font-size:20px;font-weight:900;color:#18181b;margin:0 0 4px">¡Pedido recibido!</h1>
    <p style="color:#71717a;font-size:14px;margin:0 0 20px">
      Hola <strong>${data.customerName}</strong>, <strong>${data.restaurantName}</strong> ya recibió tu pedido.
    </p>
    ${itemsTable(data.items)}
    <div style="background:#fff7ed;border-radius:12px;padding:14px 16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between">
        <span style="color:#9a3412;font-size:14px;font-weight:700">Total pagado</span>
        <span style="color:#ea580c;font-size:18px;font-weight:900">${formatCOP(data.total)}</span>
      </div>
      <p style="color:#9a3412;font-size:13px;margin:6px 0 0">
        ${isDelivery ? `🚚 Domicilio${data.address ? ` — ${data.address}` : ""}` : "🏠 Recoges en el local"}
      </p>
    </div>
    ${btn("Ver estado del pedido", `${APP()}/orders`)}
  `)
}

export function sendNewOrderToRestaurant(to: string, data: {
  restaurantName: string
  customerName: string
  customerPhone?: string | null
  items: OrderItem[]
  total: number
  deliveryType: string
  address?: string | null
  notes?: string | null
}) {
  const isDelivery = data.deliveryType === "DELIVERY"
  return sendSilent(to, `¡Nuevo pedido! 🛍️ — ${data.restaurantName}`, `
    <h1 style="font-size:20px;font-weight:900;color:#18181b;margin:0 0 4px">¡Tienes un nuevo pedido!</h1>
    <p style="color:#71717a;font-size:14px;margin:0 0 4px">
      Cliente: <strong>${data.customerName}</strong>${data.customerPhone ? ` · ${data.customerPhone}` : ""}
    </p>
    <p style="color:#71717a;font-size:14px;margin:0 0 16px">
      ${isDelivery ? `🚚 Domicilio${data.address ? ` — ${data.address}` : ""}` : "🏠 El cliente recoge en el local"}
    </p>
    ${itemsTable(data.items)}
    ${data.notes ? `<p style="color:#71717a;font-size:13px;background:#f4f4f5;border-radius:10px;padding:10px 14px;margin-bottom:16px">📝 "${data.notes}"</p>` : ""}
    <div style="background:#fff7ed;border-radius:12px;padding:14px 16px;margin-bottom:20px">
      <span style="color:#9a3412;font-weight:900;font-size:16px">Total: ${formatCOP(data.total)}</span>
    </div>
    ${btn("Ver pedidos", `${APP()}/dashboard`)}
  `)
}

// ─── Cambios de estado ────────────────────────────────────────────────────────

const STATUS_INFO: Record<string, { subject: string; emoji: string; msg: string }> = {
  CONFIRMED: {
    subject: "Tu pedido fue confirmado ✅",
    emoji: "✅",
    msg: "El restaurante confirmó tu pedido y pronto empezará a prepararlo.",
  },
  PREPARING: {
    subject: "Tu pedido se está preparando 👨‍🍳",
    emoji: "👨‍🍳",
    msg: "¡Están cocinando tu pedido! Ya casi está listo.",
  },
  READY: {
    subject: "Tu pedido está listo 🎉",
    emoji: "🎉",
    msg: "Tu pedido está listo. En breve saldrá a domicilio o puedes pasar a recogerlo.",
  },
  DELIVERED: {
    subject: "Pedido entregado — ¡Buen provecho! 😋",
    emoji: "😋",
    msg: "Tu pedido fue entregado. ¡Esperamos que lo disfrutes!",
  },
  CANCELLED: {
    subject: "Pedido cancelado",
    emoji: "❌",
    msg: "Lamentablemente tu pedido fue cancelado. Si tienes dudas, contacta al restaurante.",
  },
}

export function sendOrderStatusUpdate(to: string, data: {
  customerName: string
  restaurantName: string
  status: string
  total: number
}) {
  const info = STATUS_INFO[data.status]
  if (!info) return
  return sendSilent(to, info.subject, `
    <h1 style="font-size:22px;margin:0 0 8px">${info.emoji} ${info.subject.replace(/ [^\s]+$/, "")}</h1>
    <p style="color:#52525b;font-size:15px;margin:0 0 4px">Hola <strong>${data.customerName}</strong>.</p>
    <p style="color:#71717a;font-size:14px;margin:0 0 4px">${info.msg}</p>
    <p style="color:#71717a;font-size:14px;margin:0 0 20px">Restaurante: <strong>${data.restaurantName}</strong> · Total: <strong>${formatCOP(data.total)}</strong></p>
    ${btn("Ver mis pedidos", `${APP()}/orders`)}
    ${data.status === "DELIVERED" ? `<p style="color:#71717a;font-size:13px;margin-top:8px">¿Cómo fue tu experiencia? Puedes dejar una reseña en la app.</p>` : ""}
  `)
}

// ─── Recuperación de contraseña ───────────────────────────────────────────────

export function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${APP()}/reset-password?token=${token}`
  return send(to, "Recupera tu contraseña — PideYa 🔑", `
    <h1 style="font-size:20px;font-weight:900;color:#18181b;margin:0 0 8px">Recupera tu contraseña</h1>
    <p style="color:#71717a;font-size:14px;margin:0 0 20px">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta.
      Si no fuiste tú, ignora este correo.
    </p>
    ${btn("Restablecer contraseña", resetUrl)}
    <p style="color:#a1a1aa;font-size:12px;margin-top:12px">Este enlace expira en 1 hora.</p>
  `)
}
