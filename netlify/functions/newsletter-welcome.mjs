// E-mail de bienvenue de la newsletter : envoyé juste après l'inscription, avec le code promo
// offert s'il y en a un (app Rekvo → Codes promo → « Offert à l'inscription à la newsletter »).
//
// Sécurité : la fonction n'écrit qu'à une adresse DÉJÀ inscrite sur ce restaurant, inscrite il y a
// moins de 15 minutes, et une seule fois (colonne welcome_sent_at, schéma v4). Elle ne peut donc pas
// servir à envoyer des messages à n'importe qui.
// Variables : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESTAURANT_ID, GMAIL_USER, GMAIL_APP_PASSWORD.
import nodemailer from 'nodemailer';
import { adminDb, cors, esc, euro, resp, RESTAURANT_ID } from './_shared.mjs';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function html(resto, code, remise, minimum, site) {
  const bloc = code
    ? `<p style="margin:0 0 8px;color:#444;">Voici votre code de bienvenue :</p>
       <p style="margin:0 0 6px;font-size:28px;letter-spacing:3px;font-weight:700;color:#111;">${esc(code)}</p>
       <p style="margin:0 0 24px;color:#666;font-size:14px;">${esc(remise)} sur votre commande en ligne${minimum ? `, dès ${euro(minimum)}` : ''}. À saisir au moment de payer.</p>`
    : `<p style="margin:0 0 24px;color:#444;">Vous serez prévenu de nos nouveautés et de nos offres.</p>`;
  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:auto;padding:32px 24px;">
    <h1 style="font-size:20px;margin:0 0 16px;color:#111;">Merci pour votre inscription</h1>
    <p style="margin:0 0 20px;color:#444;">Vous faites désormais partie des habitués de <strong>${esc(resto)}</strong>.</p>
    ${bloc}
    ${site ? `<p style="margin:0 0 24px;"><a href="${esc(site)}" style="background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;display:inline-block;">Voir la carte</a></p>` : ''}
    <p style="margin:24px 0 0;color:#999;font-size:12px;">Vous recevez ce message parce que vous vous êtes inscrit sur notre site. Pour ne plus rien recevoir, répondez « STOP » à cet e-mail.</p>
  </div>`;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: 'ok' };
  if (event.httpMethod !== 'POST') return resp(405, { error: 'Méthode non autorisée' });
  const { GMAIL_USER, GMAIL_APP_PASSWORD, SITE_URL } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return resp(200, { sent: false, reason: 'pas de boîte e-mail configurée' });

  try {
    const { email: brut } = JSON.parse(event.body || '{}');
    const email = String(brut || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return resp(400, { error: 'Adresse invalide.' });

    const db = adminDb();
    const { data: abonne } = await db
      .from('newsletter_subscribers')
      .select('id,created_at,welcome_sent_at,is_active')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('email', email)
      .maybeSingle();
    // Inconnu, désinscrit, déjà écrit, ou inscription de plus de 15 minutes : on n'envoie rien.
    if (!abonne || !abonne.is_active || abonne.welcome_sent_at) return resp(200, { sent: false });
    if (Date.now() - new Date(abonne.created_at).getTime() > 15 * 60 * 1000) return resp(200, { sent: false });

    const [{ data: resto }, { data: promo }] = await Promise.all([
      db.from('restaurants').select('name,site_url').eq('id', RESTAURANT_ID).maybeSingle(),
      db
        .from('promo_codes')
        .select('code,discount_type,discount_value,min_order_cents,valid_until,max_uses,used_count')
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('newsletter_gift', true)
        .eq('is_active', true)
        .maybeSingle(),
    ]);
    const valide = !!promo && (!promo.valid_until || new Date(promo.valid_until) > new Date()) && (promo.max_uses == null || promo.used_count < promo.max_uses);
    const remise = valide ? (promo.discount_type === 'fixed' ? `−${euro(promo.discount_value)}` : `−${promo.discount_value} %`) : '';
    const nom = resto?.name ?? 'notre restaurant';

    const transporter = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
    await transporter.sendMail({
      from: `${nom} <${GMAIL_USER}>`,
      to: email,
      subject: valide ? `Votre code ${promo.code} — ${nom}` : `Bienvenue chez ${nom}`,
      html: html(nom, valide ? promo.code : '', remise, valide ? (Number(promo.min_order_cents) || 0) / 100 : 0, resto?.site_url || SITE_URL || ''),
    });
    await db.from('newsletter_subscribers').update({ welcome_sent_at: new Date().toISOString() }).eq('id', abonne.id);
    return resp(200, { sent: true });
  } catch (e) {
    return resp(200, { sent: false, reason: String(e.message).slice(0, 140) });
  }
};
