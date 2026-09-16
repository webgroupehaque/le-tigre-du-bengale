// Aperçu d'un code promo (la remise est revalidée au paiement).
import { adminDb, cors, resp, RESTAURANT_ID } from './_shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: 'ok' };
  if (event.httpMethod !== 'POST') return resp(405, { error: 'Méthode non autorisée' });
  try {
    const { code, subtotal } = JSON.parse(event.body || '{}');
    if (!code) return resp(400, { error: 'Code requis.' });
    const sub = Number(subtotal) || 0;
    const db = adminDb();
    const { data: p } = await db.from('promo_codes').select('*').eq('restaurant_id', RESTAURANT_ID).eq('code', String(code).trim().toUpperCase()).maybeSingle();
    if (!p || !p.is_active) return resp(404, { error: 'Code inconnu.' });
    if (p.valid_until && new Date(p.valid_until).getTime() < Date.now()) return resp(400, { error: 'Code expiré.' });
    if (p.max_uses != null && p.used_count >= p.max_uses) return resp(400, { error: 'Code épuisé.' });
    if ((Number(p.min_order_cents) || 0) > Math.round(sub * 100)) return resp(400, { error: `Valable dès ${(Number(p.min_order_cents) / 100).toFixed(2).replace('.', ',')} € d'achat.` });
    const discount = p.discount_type === 'percentage' ? (sub * Number(p.discount_value)) / 100 : Math.min(Number(p.discount_value), sub);
    const label = p.discount_type === 'percentage' ? `−${p.discount_value} %` : `−${Number(p.discount_value).toFixed(2).replace('.', ',')} €`;
    return resp(200, { discount: Math.round(discount * 100) / 100, label });
  } catch (e) {
    return resp(500, { error: String(e?.message || e) });
  }
};
