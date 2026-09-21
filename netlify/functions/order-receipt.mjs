// Récapitulatif d'une commande juste après le paiement, pour l'afficher à l'écran
// (le client n'a pas à attendre son e-mail pour connaître son code).
//
// La clé d'accès est l'identifiant de session Stripe, que seul le navigateur qui
// vient de payer possède : on ne renvoie rien d'autre que le strict nécessaire,
// et seulement pour une commande payée de moins de 2 heures.
import { adminDb, cors, resp, RESTAURANT_ID } from './_shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: 'ok' };
  const sessionId = String(event.queryStringParameters?.session ?? '').trim();
  if (!/^cs_[A-Za-z0-9_]{10,}$/.test(sessionId)) return resp(400, { error: 'Session invalide.' });

  const db = adminDb();
  const { data: order } = await db
    .from('orders')
    .select('order_code,order_type,total_amount,payment_status,created_at,customer_email')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('stripe_session_id', sessionId)
    .maybeSingle();
  if (!order) return resp(404, { error: 'Commande introuvable.' });
  if (Date.now() - new Date(order.created_at).getTime() > 2 * 3600 * 1000) return resp(410, { error: 'Récapitulatif expiré.' });

  const { data: s } = await db
    .from('restaurant_settings')
    .select('prep_minutes,delivery_minutes')
    .eq('restaurant_id', RESTAURANT_ID)
    .maybeSingle();
  const delivery = order.order_type === 'delivery';

  return resp(200, {
    code: order.order_code,
    orderType: order.order_type,
    total: Number(order.total_amount) || 0,
    paid: order.payment_status === 'paid',
    eta: delivery ? Number(s?.delivery_minutes) || 40 : Number(s?.prep_minutes) || 20,
    email: order.customer_email, // pour écrire « confirmation envoyée à j…@gmail.com »
  });
};
