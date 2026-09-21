// Webhook Stripe : au paiement confirmé, marque la commande « payée »
// (idempotent), incrémente la promo, envoie les e-mails client + restaurant.
// Env : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, RESTAURANT_ID, GMAIL_USER, GMAIL_APP_PASSWORD, RESTAURANT_EMAIL (optionnel).
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import { adminDb, esc, euro, loadRestaurant, RESTAURANT_ID } from './_shared.mjs';

const ACCENT = '#1f1f1f';

const itemRows = (items) =>
  (items || [])
    .map(
      (i) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;"><strong>${esc(i.quantity)} ×</strong> ${esc(i.name)}${i.detail ? `<br><span style="color:#8a8a8a;font-size:12px;">${esc(i.detail)}</span>` : ''}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-size:14px;white-space:nowrap;">${euro((Number(i.price) || 0) * (Number(i.quantity) || 1))}</td></tr>`,
    )
    .join('');
const totalsRows = (o) => `
  <tr><td style="padding:4px 0;color:#666;font-size:14px;">Sous-total</td><td style="padding:4px 0;text-align:right;font-size:14px;">${euro(o.subtotal)}</td></tr>
  ${o.order_type === 'delivery' ? `<tr><td style="padding:4px 0;color:#666;font-size:14px;">Livraison</td><td style="padding:4px 0;text-align:right;font-size:14px;">${Number(o.delivery_fee) > 0 ? euro(o.delivery_fee) : 'Offerte'}</td></tr>` : ''}
  <tr><td style="padding:10px 0 0;font-weight:600;border-top:1px solid #ddd;font-size:16px;">Total</td><td style="padding:10px 0 0;text-align:right;font-weight:600;border-top:1px solid #ddd;font-size:16px;">${euro(o.total_amount)}</td></tr>`;

const clientHtml = (r, o) => {
  const delivery = o.order_type === 'delivery';
  const eta = delivery ? r.settings?.delivery_minutes : r.settings?.prep_minutes;
  const addr = delivery ? `${esc(o.delivery_address)}<br>${esc(o.delivery_zip_code)} ${esc(o.delivery_city)}` : esc(r.address);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1c1c1c;">
<div style="max-width:600px;margin:0 auto;"><div style="background:${ACCENT};padding:26px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:24px;">${esc(r.name)}</h1></div>
<div style="padding:28px 24px;"><h2 style="margin:0 0 6px;">Merci pour votre commande !</h2><p style="margin:0 0 20px;color:#555;font-size:14px;">Bonjour ${esc(o.customer_name)}, votre paiement est confirmé et votre commande est en préparation.</p>
<div style="background:#fff;border:2px solid ${ACCENT};border-radius:14px;padding:18px;text-align:center;margin-bottom:18px;"><p style="margin:0;color:#777;font-size:13px;">Votre code de commande</p><p style="margin:6px 0 4px;font-weight:700;font-size:30px;letter-spacing:3px;">${esc(o.order_code)}</p><p style="margin:0;color:#999;font-size:12px;">${delivery ? 'Communiquez ce code au livreur' : 'Communiquez ce code au restaurant'}</p></div>
<div style="background:#fff;border:1px solid #e6e4dc;border-radius:14px;padding:18px;margin-bottom:16px;"><h3 style="margin:0 0 8px;font-size:17px;">${delivery ? 'Livraison' : 'À emporter'}</h3><p style="margin:0;color:#555;font-size:14px;">${addr}</p>${eta ? `<p style="margin:8px 0 0;color:#999;font-size:13px;">${delivery ? `Livraison estimée dans ${eta} minutes environ.` : `Votre commande sera prête dans ${eta} minutes environ.`}</p>` : ''}${o.instructions ? `<p style="margin:8px 0 0;color:#555;font-size:13px;">Note : ${esc(o.instructions)}</p>` : ''}</div>
<div style="background:#fff;border:1px solid #e6e4dc;border-radius:14px;padding:18px;"><h3 style="margin:0 0 8px;font-size:17px;">Votre commande</h3><table style="width:100%;border-collapse:collapse;">${itemRows(o.items)}</table><table style="width:100%;border-collapse:collapse;margin-top:14px;">${totalsRows(o)}</table></div>
${r.phone ? `<p style="margin:24px 0 0;color:#555;font-size:13px;text-align:center;">Une question ? Appelez-nous au ${esc(r.phone)}</p>` : ''}<p style="margin:18px 0 0;color:#999;font-size:12px;text-align:center;">${esc(r.name)}${r.address ? ` · ${esc(r.address)}` : ''}</p></div></div></body></html>`;
};

const shopHtml = (r, o) => {
  const delivery = o.order_type === 'delivery';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1c1c1c;"><div style="max-width:600px;margin:0 auto;padding:24px;">
<p style="margin:0;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Nouvelle commande payée · ${esc(r.name)}</p><h1 style="margin:4px 0 16px;font-size:26px;">${esc(o.order_code)}</h1>
<div style="background:${ACCENT};color:#fff;border-radius:10px;padding:14px;text-align:center;margin-bottom:16px;font-size:16px;font-weight:600;">${delivery ? 'LIVRAISON' : 'À EMPORTER'}</div>
<div style="background:#fff;border:1px solid #e6e4dc;border-radius:12px;padding:16px;font-size:14px;line-height:1.7;"><strong>Client :</strong> ${esc(o.customer_name)}<br>${esc(o.customer_phone)} · ${esc(o.customer_email)}<br>${delivery ? `<strong>Adresse :</strong> ${esc(o.delivery_address)}, ${esc(o.delivery_zip_code)} ${esc(o.delivery_city)}` : '<strong>Retrait sur place</strong>'}</div>
${o.instructions ? `<div style="background:#fbf0dc;border-radius:8px;padding:12px 14px;margin-top:14px;font-size:14px;"><strong>Note :</strong> ${esc(o.instructions)}</div>` : ''}
<h2 style="font-size:18px;margin:22px 0 8px;">À préparer</h2><div style="background:#fff;border:1px solid #e6e4dc;border-radius:12px;padding:16px;"><table style="width:100%;border-collapse:collapse;">${itemRows(o.items)}</table><table style="width:100%;border-collapse:collapse;margin-top:14px;">${totalsRows(o)}</table></div></div></body></html>`;
};

async function sendEmails(r, order) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, RESTAURANT_EMAIL } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return;
  const transporter = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
  const from = `${r.name} <${GMAIL_USER}>`;
  await Promise.allSettled([
    order.customer_email && transporter.sendMail({ from, to: order.customer_email, subject: `Confirmation de votre commande ${order.order_code} — ${r.name}`, html: clientHtml(r, order) }),
    transporter.sendMail({ from, to: RESTAURANT_EMAIL || r.email || GMAIL_USER, subject: `Nouvelle commande ${order.order_code} · ${euro(order.total_amount)} · ${order.order_type === 'delivery' ? 'Livraison' : 'À emporter'}`, html: shopHtml(r, order) }),
  ]);
}


// Signale la nouvelle commande payée à l'app Rekvo (écran cuisine + notifications),
// best-effort : un échec ne bloque jamais le webhook Stripe.
// Env : REKVO_NOTIFY_SECRET (obligatoire pour signaler), REKVO_NOTIFY_URL (optionnel).
async function notifyRekvo(order, restaurantId) {
  const { REKVO_NOTIFY_SECRET, REKVO_NOTIFY_URL, SUPABASE_URL } = process.env;
  if (!REKVO_NOTIFY_SECRET || !SUPABASE_URL) return;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    await fetch(REKVO_NOTIFY_URL || 'https://espace.rekvo.agency/api/orders/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${REKVO_NOTIFY_SECRET}` },
      body: JSON.stringify({ supabase_url: SUPABASE_URL, restaurant_id: restaurantId, order_code: order.order_code, total_amount: Number(order.total_amount) || 0, order_type: order.order_type }),
      signal: ctrl.signal,
    });
  } catch (e) {
    console.error(`Notification Rekvo commande ${order.order_code} échouée :`, e?.message || e);
  } finally {
    clearTimeout(timer);
  }
}


export const handler = async (event) => {
  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = process.env;
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) return { statusCode: 500, body: 'Configuration Stripe incomplète.' };
  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(raw, event.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return { statusCode: 400, body: `Signature invalide : ${e.message}` };
  }
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const orderId = session.metadata?.order_id;
    const promoCode = session.metadata?.promo_code;
    if (orderId && session.metadata?.restaurant_id === RESTAURANT_ID) {
      const db = adminDb();
      const { data: updated } = await db
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId)
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('payment_status', 'pending')
        .select('order_code,customer_name,customer_email,customer_phone,delivery_address,delivery_city,delivery_zip_code,order_type,instructions,items,subtotal,delivery_fee,total_amount');
      if (updated && updated.length > 0) {
        const order = updated[0];
        if (promoCode) {
          const { error: promoErr } = await db.rpc('increment_promo_used', { promo_code: promoCode });
          if (promoErr) console.error('Compteur promo non incrémenté :', promoErr.message);
        }
        await notifyRekvo(order, RESTAURANT_ID);
        try {
          const r = await loadRestaurant(db);
          await sendEmails(r, order);
        } catch (e) {
          console.error(`E-mail commande ${order.order_code} échoué :`, e?.message || e);
        }
      }
    }
  }
  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
