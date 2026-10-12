const { Resend } = require("resend");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

async function sendEmail(to, subject, html, text) {
  if (!process.env.RESEND_API_KEY) throw new Error("Email delivery is not configured: RESEND_API_KEY is missing.");
  if (!to) throw new Error("Email recipient is required.");
  const from = String(process.env.FROM_EMAIL || "onboarding@resend.dev").trim();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({ from, to, subject, html, ...(text ? { text } : {}) });
  if (result?.error) {
    const error = new Error(result.error.message || "Email provider rejected the message.");
    error.code = result.error.name || result.error.statusCode || "RESEND_SEND_FAILED";
    throw error;
  }
  if (!result?.data?.id) throw new Error("Email provider did not confirm that the message was accepted.");
  return { sent: true, id: result.data.id };
}

module.exports = { sendEmail, escapeHtml };
