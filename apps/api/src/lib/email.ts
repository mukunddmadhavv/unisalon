import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "UniSalon <no-reply@unisalon.in>";

// ─────────────────────────────────────────────
// Booking confirmation email to customer
// ─────────────────────────────────────────────

export async function sendBookingConfirmationEmail(booking: {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  user: { name: string; email: string };
  shop: { name: string; address: string; city: string };
  services: Array<{ serviceName: string; pricePaise: number }>;
}) {
  const servicesList = booking.services
    .map((s) => `• ${s.serviceName} — ₹${(s.pricePaise / 100).toFixed(0)}`)
    .join("\n");

  await resend.emails.send({
    from: FROM,
    to: booking.user.email,
    subject: `✂️ Booking Confirmed — ${booking.shop.name} on ${booking.date}`,
    html: `
      <h2>Hey ${booking.user.name}! Your booking is confirmed 🎉</h2>
      <p><strong>Shop:</strong> ${booking.shop.name}</p>
      <p><strong>Address:</strong> ${booking.shop.address}, ${booking.shop.city}</p>
      <p><strong>Date:</strong> ${booking.date}</p>
      <p><strong>Time:</strong> ${booking.startTime} – ${booking.endTime}</p>
      <p><strong>Services:</strong><br/><pre>${servicesList}</pre></p>
      <p><strong>Total:</strong> ₹${(booking.totalAmount / 100).toFixed(0)} (Pay at shop)</p>
      <p>See you there! 💈</p>
      <p style="color:#888;font-size:12px">UniSalon — India's salon booking platform</p>
    `,
  });
}

// ─────────────────────────────────────────────
// Shop approval/rejection email to shop owner
// ─────────────────────────────────────────────

export async function sendShopStatusEmail(
  email: string,
  ownerName: string,
  shopName: string,
  status: "APPROVED" | "REJECTED",
  reason?: string
) {
  const isApproved = status === "APPROVED";

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: isApproved
      ? `🎉 ${shopName} is now live on UniSalon!`
      : `Update on your UniSalon application — ${shopName}`,
    html: isApproved
      ? `
        <h2>Congratulations, ${ownerName}! 🎊</h2>
        <p>Your shop <strong>${shopName}</strong> has been approved and is now live on UniSalon.</p>
        <p>Customers can now find and book appointments at your shop.</p>
        <p>Log into your dashboard to manage bookings and your profile.</p>
        <a href="https://shop.unisalon.in/dashboard" style="background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Go to Dashboard</a>
      `
      : `
        <h2>Hi ${ownerName},</h2>
        <p>Thank you for applying to UniSalon. After review, we were unable to approve <strong>${shopName}</strong> at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>Please update your profile and re-apply, or contact us at support@unisalon.in.</p>
      `,
  });
}
