// POST handler for the contact form on /contact-us.
// Uses Resend (https://resend.com) — set RESEND_API_KEY in Vercel env vars.
// Optional env vars: CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL.

const RESEND_URL = "https://api.resend.com/emails";

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const ct = (req.headers["content-type"] || "").toLowerCase();
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try {
        if (ct.includes("application/json")) {
          resolve(JSON.parse(raw || "{}"));
        } else {
          const params = new URLSearchParams(raw);
          const obj = {};
          for (const [k, v] of params) obj[k] = v;
          resolve(obj);
        }
      } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function pickField(body, ...candidates) {
  for (const key of Object.keys(body)) {
    for (const cand of candidates) {
      if (key === cand || key.toLowerCase().includes(cand)) {
        const v = body[key];
        if (v && String(v).trim()) return String(v).trim();
      }
    }
  }
  return "";
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.end("Method Not Allowed");
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    return res.end("Server misconfigured: RESEND_API_KEY missing");
  }

  let body;
  try { body = await parseBody(req); }
  catch { res.statusCode = 400; return res.end("Bad request"); }

  if (body._website && String(body._website).trim()) {
    res.statusCode = 303;
    res.setHeader("Location", "/thank-you");
    return res.end();
  }

  const name        = pickField(body, "name");
  const email       = pickField(body, "email");
  const phone       = pickField(body, "phone");
  const address     = pickField(body, "address");
  const description = pickField(body, "description", "message", "comment");

  if (!name || !email) {
    res.statusCode = 303;
    res.setHeader("Location", "/contact-us?error=missing");
    return res.end();
  }

  const to   = process.env.CONTACT_TO_EMAIL   || "tim.michel13@gmail.com";
  const from = process.env.CONTACT_FROM_EMAIL || "Aquapro Irrigation <leads@aquaproirrigationlandscaping.com>";

  const subject = `New lead from aquaproirrigationlandscaping.com — ${name}`;
  const text =
`Name: ${name}
Email: ${email}
Phone: ${phone}
Address: ${address}

Message:
${description}

—
Sent from the contact form on aquaproirrigationlandscaping.com`;
  const html = `
<h2>New lead from the Aquapro Irrigation & Landscaping site</h2>
<table cellpadding="6" style="font-family:system-ui,Arial,sans-serif;border-collapse:collapse;font-size:15px">
  <tr><td><b>Name</b></td><td>${escapeHtml(name)}</td></tr>
  <tr><td><b>Email</b></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
  <tr><td><b>Phone</b></td><td>${escapeHtml(phone)}</td></tr>
  <tr><td><b>Address</b></td><td>${escapeHtml(address)}</td></tr>
  <tr><td valign="top"><b>Message</b></td><td>${escapeHtml(description).replace(/\n/g, "<br>")}</td></tr>
</table>
<p style="color:#666;font-size:13px">Sent from the contact form on aquaproirrigationlandscaping.com</p>
`;

  try {
    const resp = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        reply_to: email,
        subject,
        text,
        html,
      }),
    });
    if (!resp.ok) {
      const detail = await resp.text();
      console.error("Resend error", resp.status, detail);
      res.statusCode = 303;
      res.setHeader("Location", "/contact-us?error=send");
      return res.end();
    }
  } catch (e) {
    console.error("contact handler exception", e);
    res.statusCode = 303;
    res.setHeader("Location", "/contact-us?error=send");
    return res.end();
  }

  res.statusCode = 303;
  res.setHeader("Location", "/thank-you");
  return res.end();
};
