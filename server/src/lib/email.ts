// Thin wrapper over Resend's REST API, not their SDK — mirrors the style of
// lib/duffel.ts. Alert emails are a best-effort side effect: a failed send
// here should never block alert creation or the recheck job, so every
// failure is logged and swallowed rather than thrown.
const RESEND_BASE_URL = "https://api.resend.com";
// Resend's shared test sender — works with no domain verification, but only
// delivers to the email address the Resend account itself was signed up
// with. A verified custom domain lifts that restriction (stage 5+ concern).
const FROM_ADDRESS = "FareCompass <onboarding@resend.dev>";

function baseUrl(): string {
  // APP_BASE_URL is an explicit override; RENDER_EXTERNAL_URL is set
  // automatically by Render on every web service, so deployed alert emails
  // link back to the live app with no extra config.
  return process.env.APP_BASE_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:4000";
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`);
    return;
  }
  try {
    const res = await fetch(`${RESEND_BASE_URL}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error(`[email] Resend rejected "${subject}" to ${to}:`, res.status, body);
    }
  } catch (err) {
    console.error(`[email] Resend request failed for "${subject}" to ${to}:`, err);
  }
}

interface AlertForEmail {
  id: string;
  email: string;
  origin: string;
  destination: string;
  departureDate: string;
  unsubscribeToken: string;
}

function links(alert: AlertForEmail) {
  return {
    manageUrl: `${baseUrl()}/alerts?email=${encodeURIComponent(alert.email)}`,
    unsubscribeUrl: `${baseUrl()}/alerts?unsubscribe=${alert.id}&token=${alert.unsubscribeToken}`,
  };
}

export async function sendAlertConfirmationEmail(alert: AlertForEmail) {
  const { manageUrl, unsubscribeUrl } = links(alert);
  await sendEmail(
    alert.email,
    `We're watching ${alert.origin} → ${alert.destination} for you`,
    `<p>We'll email you if the fare for <strong>${alert.origin} &rarr; ${alert.destination}</strong> on ${alert.departureDate} drops.</p>
     <p><a href="${manageUrl}">Manage your alerts</a> &middot; <a href="${unsubscribeUrl}">Unsubscribe from this one</a></p>`,
  );
}

export async function sendPriceDropEmail(alert: AlertForEmail, newPrice: number, previousPrice: number | null) {
  const { manageUrl, unsubscribeUrl } = links(alert);
  const wasLine = previousPrice !== null ? `, down from $${previousPrice.toFixed(0)}` : "";
  await sendEmail(
    alert.email,
    `Price drop: ${alert.origin} → ${alert.destination} now $${newPrice.toFixed(0)}`,
    `<p>Good news — <strong>${alert.origin} &rarr; ${alert.destination}</strong> on ${alert.departureDate} is now
     <strong>$${newPrice.toFixed(0)}</strong>${wasLine}.</p>
     <p><a href="${manageUrl}">View your alerts</a> &middot; <a href="${unsubscribeUrl}">Unsubscribe from this one</a></p>`,
  );
}
