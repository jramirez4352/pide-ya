export const TZ = "America/Bogota"
export const LOCALE = "es-CO"

export const fmtDate = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ, day: "numeric", month: "short", year: "numeric",
})

export const fmtDateTime = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ, day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit",
})

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency", currency: "COP", minimumFractionDigits: 0,
  }).format(amount)
}
