// Utilitaires communs aux fonctions Netlify du kit. Rien de spécifique à un
// restaurant ici : l'identité vient de RESTAURANT_ID (env) et de la base.
import { createClient } from '@supabase/supabase-js';

export const RESTAURANT_ID = process.env.RESTAURANT_ID || process.env.VITE_RESTAURANT_ID || '';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
export const resp = (statusCode, body) => ({ statusCode, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const cents = (n) => Math.round(n * 100);
export const round2 = (n) => Math.round(n * 100) / 100;
export const euro = (n) => `${(Number(n) || 0).toFixed(2).replace('.', ',')} €`;
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Client service_role (bypass RLS) — serveur uniquement. */
export function adminDb() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESTAURANT_ID) throw new Error('Configuration serveur incomplète (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESTAURANT_ID).');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

/** Identité + réglages du restaurant, lus en base (jamais en dur). */
export async function loadRestaurant(db) {
  const [{ data: r }, { data: s }] = await Promise.all([
    db.from('restaurants').select('id,name').eq('id', RESTAURANT_ID).maybeSingle(),
    db.from('restaurant_settings').select('*').eq('restaurant_id', RESTAURANT_ID).maybeSingle(),
  ]);
  return {
    id: RESTAURANT_ID,
    name: r?.name || RESTAURANT_ID,
    address: s?.address || '',
    phone: s?.phone || '',
    email: s?.email || '',
    settings: {
      ordering_enabled: s?.ordering_enabled !== false,
      delivery_enabled: s?.delivery_enabled !== false,
      pickup_enabled: s?.pickup_enabled !== false,
      delivery_fee: Number(s?.delivery_fee) || 0,
      free_delivery_over: s?.free_delivery_over == null ? null : Number(s.free_delivery_over),
      min_order: Number(s?.min_order) || 0,
      delivery_zips: Array.isArray(s?.delivery_zips) ? s.delivery_zips : [],
      prep_minutes: Number(s?.prep_minutes) || 20,
      delivery_minutes: Number(s?.delivery_minutes) || 40,
      closures: Array.isArray(s?.closures) ? s.closures : [],
    },
  };
}

export function closedToday(closures) {
  const today = new Date().toISOString().slice(0, 10);
  return closures.find((c) => c.from <= today && (c.to || c.from) >= today) ?? null;
}

/** Préfixe des codes de commande : initiales du restaurant (ex. « Le Palais de Jaipur » → PJ). */
export function orderPrefix(name) {
  const words = String(name).split(/\s+/).filter((w) => w.length > 2 && !/^(le|la|les|du|de|des|au|aux|et|chez)$/i.test(w));
  const p = (words.length ? words : String(name).split(/\s+/)).map((w) => w[0]).join('').toUpperCase().slice(0, 3);
  return p || 'CMD';
}
