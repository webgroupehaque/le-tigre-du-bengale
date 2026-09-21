// Prévient le CLIENT que sa commande avance : « c'est prêt » (retrait) ou
// « c'est parti » (livraison). Appelée par l'app Rekvo quand la cuisine change
// le statut — c'est le site qui envoie, parce que c'est lui qui a la boîte
// e-mail du restaurant (GMAIL_USER / GMAIL_APP_PASSWORD).
//
// Protection : même secret partagé que la notification site → app
// (REKVO_NOTIFY_SECRET). Sans lui, la fonction refuse tout.
// Envoi une seule fois : marqué dans orders.ready_notified_at / dispatched_notified_at.
import nodemailer from 'nodemailer';
import { adminDb, esc, euro, loadRestaurant, RESTAURANT_ID } from './_shared.mjs';

const ACCENT = '#1f1f1f';
const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

const html = (r, o, statut) => {
  const delivery = o.order_type === 'delivery';
  const titre = statut === 'ready' ? (delivery ? 'Votre commande est prête' : 'Votre commande vous attend') : 'Votre commande est en route';
  const phrase =
    statut === 'ready'
      ? delivery
        ? 'Elle part en livraison dans quelques instants.'
        : `Vous pouvez venir la chercher${r.address ? ` au ${esc(r.address)}` : ''}.`
      : `Le livreur est parti${o.delivery_address ? ` vers le ${esc(o.delivery_address)}, ${esc(o.delivery_zip_code)} ${esc(o.delivery_city)}` : ''}.`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1c1c1c;">
<div style="max-width:600px;margin:0 auto;"><div style="background:${ACCENT};padding:26px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:24px;">${esc(r.name)}</h1></div>
<div style="padding:28px 24px;"><h2 style="margin:0 0 6px;">${titre}</h2>
<p style="margin:0 0 20px;color:#555;font-size:14px;">Bonjour ${esc(o.customer_name)}, ${phrase}</p>
<div style="background:#fff;border:2px solid ${ACCENT};border-radius:14px;padding:18px;text-align:center;margin-bottom:18px;">
  <p style="margin:0;color:#777;font-size:13px;">Votre code de commande</p>
  <p style="margin:6px 0 4px;font-weight:700;font-size:30px;letter-spacing:3px;">${esc(o.order_code)}</p>
  <p style="margin:0;color:#999;font-size:12px;">${delivery ? 'Communiquez ce code au livreur' : 'Communiquez ce code au comptoir'}</p>
</div>
<p style="margin:0;color:#555;font-size:14px;">Total réglé : <strong>${euro(o.total_amount)}</strong></p>
${r.phone ? `<p style="margin:22px 0 0;color:#555;font-size:13px;text-align:center;">Une question ? Appelez-nous au ${esc(r.phone)}</p>` : ''}
<p style="margin:18px 0 0;color:#999;font-size:12px;text-align:center;">${esc(r.name)}${r.address ? ` · ${esc(r.address)}` : ''}</p></div></div></body></html>`;
};

export const handler = async (event) => {
  const { REKVO_NOTIFY_SECRET, GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (event.httpMethod !== 'POST') return resp(405, { error: 'Méthode non autorisée.' });
  if (!REKVO_NOTIFY_SECRET) return resp(500, { error: 'Fonction non configurée.' });
  if (event.headers.authorization !== `Bearer ${REKVO_NOTIFY_SECRET}`) return resp(401, { error: 'Non autorisé.' });
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return resp(200, { sent: false, reason: 'Pas de boîte e-mail sur ce site.' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return resp(400, { error: 'Corps illisible.' });
  }
  const statut = body.status === 'dispatched' ? 'dispatched' : 'ready';
  const orderId = String(body.order_id || '');
  if (!orderId) return resp(400, { error: 'Commande manquante.' });

  const db = adminDb();
  const champ = statut === 'ready' ? 'ready_notified_at' : 'dispatched_notified_at';
  const { data: order } = await db
    .from('orders')
    .select('id,order_code,customer_name,customer_email,order_type,delivery_address,delivery_city,delivery_zip_code,total_amount,payment_status,ready_notified_at,dispatched_notified_at')
    .eq('id', orderId)
    .eq('restaurant_id', RESTAURANT_ID)
    .maybeSingle();

  if (!order) return resp(404, { error: 'Commande introuvable.' });
  if (order.payment_status !== 'paid') return resp(200, { sent: false, reason: 'Commande non payée.' });
  if (!order.customer_email) return resp(200, { sent: false, reason: 'Pas d’e-mail client.' });
  if (order[champ]) return resp(200, { sent: false, reason: 'Déjà envoyé.' });

  const r = await loadRestaurant(db);
  const transporter = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
  const sujet =
    statut === 'ready'
      ? `Commande ${order.order_code} : c’est prêt — ${r.name}`
      : `Commande ${order.order_code} : en route — ${r.name}`;
  try {
    await transporter.sendMail({ from: `${r.name} <${GMAIL_USER}>`, to: order.customer_email, subject: sujet, html: html(r, order, statut) });
  } catch (e) {
    console.error(`E-mail ${statut} commande ${order.order_code} échoué :`, e?.message || e);
    return resp(502, { error: 'Envoi impossible.' });
  }
  await db.from('orders').update({ [champ]: new Date().toISOString() }).eq('id', order.id);
  return resp(200, { sent: true });
};
