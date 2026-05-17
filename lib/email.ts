import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendPasswordResetEmail(to: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  await transporter.sendMail({
    from: `"PideYa" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Recupera tu contraseña — PideYa",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <div style="background:#f97316;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:16px">
          <span style="font-size:24px">🍔</span>
        </div>
        <h1 style="font-size:22px;font-weight:900;color:#18181b;margin:0 0 8px">Recupera tu contraseña</h1>
        <p style="color:#71717a;font-size:14px;margin:0 0 24px">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en PideYa.
          Si no fuiste tú, puedes ignorar este correo.
        </p>
        <a href="${resetUrl}" style="display:block;background:#f97316;color:#fff;font-weight:700;font-size:14px;text-align:center;padding:14px 24px;border-radius:16px;text-decoration:none;margin-bottom:16px">
          Restablecer contraseña
        </a>
        <p style="color:#a1a1aa;font-size:12px;margin:0">
          Este enlace expira en 1 hora. Si no funciona, copia y pega esta URL en tu navegador:<br/>
          <span style="color:#f97316">${resetUrl}</span>
        </p>
      </div>
    `,
  })
}
