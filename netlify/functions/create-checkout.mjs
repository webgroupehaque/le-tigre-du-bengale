// Crée une session de paiement Stripe. TOUT est recalculé depuis la base
// (prix, options bornées, frais, minimum, promo, zones, fermetures) : le
// navigateur ne peut rien falsifier.
// Env : STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESTAURANT_ID.
import Stripe from 'stripe';
import { adminDb, cents, closedToday, cors, loadRestaurant, orderPrefix, resp, round2, RESTAURANT_ID } from './_shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: 'ok' };
  if (event.httpMethod !== 'POST') return resp(405, { error: 'Méthode non autorisée' });
  if (!process.env.STRIPE_SECRET_KEY) return resp(500, { error: 'Paiement non configuré.' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const db = adminDb();
    const origin = event.headers.origin || process.env.URL || '';
    const { orderType, customer, address, instructions, promoCode, lines } = JSON.parse(event.body || '{}');

    if (!Array.isArray(lines) || lines.length === 0) return resp(400, { error: 'Panier vide.' });
    if (!customer?.name || !customer?.email || !customer?.phone) return resp(400, { error: 'Coordonnées incomplètes.' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(customer.email))) return resp(400, { error: 'E-mail invalide.' });
    if (orderType !== 'delivery' && orderType !== 'pickup') return resp(400, { error: 'Mode de commande invalide.' });

    const resto = await loadRestaurant(db);
    const s = resto.settings;
    if (!s.ordering_enabled) return resp(400, { error: 'La commande en ligne est désactivée.' });
    const closure = closedToday(s.closures);
    if (closure) return resp(400, { error: closure.label ? `Fermeture : ${closure.label}.` : 'Restaurant fermé aujourd’hui.' });
    if (orderType === 'delivery' && !s.delivery_enabled) return resp(400, { error: 'La livraison est indisponible.' });
    if (orderType === 'pickup' && !s.pickup_enabled) return resp(400, { error: 'Le retrait est indisponible.' });
    if (orderType === 'delivery') {
      if (!address?.line || !address?.zip || !address?.city) return resp(400, { error: 'Adresse de livraison incomplète.' });
      // Aucune zone renseignée = livraison ouverte à la France entière. Tant que les
      // codes postaux ne sont pas réglés dans l'app, on refuse plutôt que d'accepter tout.
      if (s.delivery_zips.length === 0) return resp(400, { error: 'La livraison n’est pas encore configurée.' });
      if (!s.delivery_zips.includes(String(address.zip).trim())) return resp(400, { error: `Nous ne livrons pas au ${address.zip}.` });
    }

    // Recalcul des prix depuis la base (anti-fraude), options bornées.
    const ids = [...new Set(lines.map((l) => String(l.item_id)))];
    const { data: dbItems } = await db.from('menu_items').select('item_id,name,base_price,options,is_available,category').eq('restaurant_id', RESTAURANT_ID).in('item_id', ids);
    const { data: cats } = await db.from('menu_categories').select('name').eq('restaurant_id', RESTAURANT_ID).eq('is_active', true);
    const activeCats = new Set((cats ?? []).map((c) => c.name));
    const byId = new Map((dbItems ?? []).map((i) => [i.item_id, i]));

    const stripeItems = [];
    const orderItems = [];
    let subtotal = 0;
    for (const l of lines) {
      const it = byId.get(String(l.item_id));
      if (!it || !it.is_available || !activeCats.has(it.category)) return resp(400, { error: `Plat indisponible : ${l.name ?? l.item_id}.` });
      const base = Number(it.base_price) || 0;
      const maxSupp = (it.options ?? []).reduce((sum, g) => sum + (g.choices ?? []).reduce((m, c) => m + (Number(c.price) || 0), 0), 0);
      const qty = Math.max(1, Math.min(50, Math.floor(Number(l.qty) || 1)));
      const unit = round2(Math.min(Math.max(Number(l.unitPrice) || base, base), base + maxSupp));
      subtotal += unit * qty;
      const detail = String(l.detail || '').slice(0, 250);
      stripeItems.push({ price_data: { currency: 'eur', unit_amount: cents(unit), product_data: { name: it.name, ...(detail ? { description: detail } : {}) } }, quantity: qty });
      orderItems.push({ name: it.name, quantity: qty, price: unit, detail });
    }
    subtotal = round2(subtotal);
    if (s.min_order > 0 && subtotal < s.min_order) return resp(400, { error: `Minimum de commande : ${s.min_order} €.` });

    let deliveryFee = 0;
    if (orderType === 'delivery') deliveryFee = s.free_delivery_over != null && subtotal >= s.free_delivery_over ? 0 : s.delivery_fee;
    if (deliveryFee > 0) stripeItems.push({ price_data: { currency: 'eur', unit_amount: cents(deliveryFee), product_data: { name: 'Livraison' } }, quantity: 1 });

    // Promo revalidée serveur.
    let discount = 0;
    let appliedCode = '';
    if (promoCode) {
      const { data: p } = await db.from('promo_codes').select('*').eq('restaurant_id', RESTAURANT_ID).eq('code', String(promoCode).trim().toUpperCase()).maybeSingle();
      const now = Date.now();
      const valid = p && p.is_active && (!p.valid_until || new Date(p.valid_until).getTime() >= now) && (p.max_uses == null || p.used_count < p.max_uses) && (Number(p.min_order_cents) || 0) <= cents(subtotal);
      if (valid) {
        discount = round2(p.discount_type === 'percentage' ? (subtotal * Number(p.discount_value)) / 100 : Math.min(Number(p.discount_value), subtotal));
        appliedCode = p.code;
      }
    }
    const total = round2(Math.max(0, subtotal - discount) + deliveryFee);
    const discounts = [];
    if (discount > 0) {
      const coupon = await stripe.coupons.create({ amount_off: cents(discount), currency: 'eur', duration: 'once', name: `Code ${appliedCode}` });
      discounts.push({ coupon: coupon.id });
    }

    // Commande créée « pending » avant Stripe ; passée « paid » par le webhook.
    const orderCode = `${orderPrefix(resto.name)}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
    const { data: order, error: orderErr } = await db
      .from('orders')
      .insert({
        restaurant_id: RESTAURANT_ID,
        order_code: orderCode,
        customer_name: String(customer.name).slice(0, 120),
        customer_email: String(customer.email).slice(0, 160),
        customer_phone: String(customer.phone).slice(0, 40),
        delivery_address: address?.line ?? null,
        delivery_city: address?.city ?? null,
        delivery_zip_code: address?.zip ?? null,
        order_type: orderType,
        instructions: instructions ? String(instructions).slice(0, 500) : null,
        items: orderItems,
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: total,
        payment_status: 'pending',
        order_status: 'received',
      })
      .select('id')
      .single();
    if (orderErr) return resp(500, { error: "Impossible d'enregistrer la commande." });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: stripeItems,
      ...(discounts.length ? { discounts } : {}),
      customer_email: customer.email,
      success_url: `${origin}/?paiement=reussi`,
      cancel_url: `${origin}/?paiement=annule`,
      metadata: { order_id: order.id, promo_code: appliedCode, restaurant_id: RESTAURANT_ID },
    });
    await db.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);
    return resp(200, { url: session.url });
  } catch (e) {
    return resp(500, { error: String(e?.message || e) });
  }
};
