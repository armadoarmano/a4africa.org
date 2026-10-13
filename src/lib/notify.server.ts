// Optional email alerts for administrators via Resend (free tier: 3,000 emails/month).
// If RESEND_API_KEY or ADMIN_ALERT_EMAIL is not set, alerts are skipped silently.
export async function sendAdminAlert(subject: string, text: string) {
  const apiKey = process.env["RESEND_API_KEY"];
  const to = process.env["ADMIN_ALERT_EMAIL"];
  if (!apiKey || !to) return;
  const from = process.env["ALERT_FROM_EMAIL"] || "a4africa.org <onboarding@resend.dev>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: to.split(",").map((item) => item.trim()), subject, text }),
    });
  } catch (error) {
    console.error("Admin alert email failed", error);
  }
}
