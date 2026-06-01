import Stripe from 'stripe';
import { MENU_PRICES, DELIVERY_FEE } from './menu-prices';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

async function fetchDbPrices(restaurantId: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?restaurant_id=eq.${restaurantId}&select=item_id,base_price&is_available=eq.true`, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
    });
    if (!res.ok) return {};
    const items: Array<{ item_id: string; base_price: number }> = await res.json();
    const map: Record<string, number> = {};
    for (const it of items) map[it.item_id] = Number(it.base_price);
    return map;
  } catch { return {}; }
}

async function validatePromoCode(
  code: string,
  restaurantId: string,
  subtotalEuros: number,
): Promise<{ valid: true; discountCents: number; codeNormalized: string } | { valid: false; error: string }> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/promo_codes?code=ilike.${encodeURIComponent(code)}&is_active=eq.true&select=*`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
    });
    if (!res.ok) return { valid: false, error: 'Erreur validation code promo' };
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return { valid: false, error: 'Code promo invalide' };

    const promo = list[0];
    const now = new Date();

    if (promo.restaurant_id && promo.restaurant_id !== restaurantId) {
      return { valid: false, error: 'Code promo non valide pour ce restaurant' };
    }
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return { valid: false, error: 'Code promo pas encore valide' };
    }
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return { valid: false, error: 'Code promo expiré' };
    }
    if (promo.max_uses != null && promo.used_count >= promo.max_uses) {
      return { valid: false, error: 'Code promo épuisé' };
    }
    if (promo.min_order_cents > 0 && Math.round(subtotalEuros * 100) < promo.min_order_cents) {
      const minEuros = (promo.min_order_cents / 100).toFixed(2);
      return { valid: false, error: `Minimum ${minEuros}€ requis pour ce code` };
    }

    let discountCents = 0;
    if (promo.discount_type === 'percentage') {
      discountCents = Math.round(subtotalEuros * 100 * (Number(promo.discount_value) / 100));
    } else {
      discountCents = Math.round(Number(promo.discount_value) * 100);
    }
    // Cap at subtotal
    discountCents = Math.min(discountCents, Math.round(subtotalEuros * 100));

    return { valid: true, discountCents, codeNormalized: promo.code };
  } catch (err: any) {
    console.error('Promo validation error:', err);
    return { valid: false, error: 'Erreur serveur' };
  }
}

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { cartItems, customerInfo, restaurantId, orderType, promoCode } = JSON.parse(event.body);

    for (const item of cartItems) {
      if (!MERGED_PRICES[item.id]) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Produit invalide: ${item.id}` }) };
      }
    }

    const calculateItemPrice = (item: any): number => {
      const basePrice = MERGED_PRICES[item.id];
      if (item.selectedOptions) {
        for (const optionValue of Object.values(item.selectedOptions)) {
          const val = optionValue as string;
          if (val.includes('Crevettes') || val.includes('Agneau')) return basePrice + 2.00;
        }
      }
      return basePrice;
    };

    const lineItems: any[] = cartItems.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: item.selectedOptions
            ? Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${(v as string).replace(/\(([\d.]+)€\)/, '').trim()}`).join(', ')
            : undefined,
        },
        unit_amount: Math.round(calculateItemPrice(item) * 100),
      },
      quantity: item.quantity,
    }));

    const serverCartTotal = cartItems.reduce((acc: number, item: any) => acc + (calculateItemPrice(item) * item.quantity), 0);
    const serverDeliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;

    if (serverDeliveryFee > 0) {
      lineItems.push({
        price_data: { currency: 'eur', product_data: { name: 'Frais de livraison' }, unit_amount: Math.round(DELIVERY_FEE * 100) },
        quantity: 1,
      });
    }

    // Validation du code promo (optionnel)
    let validatedPromoCode: string | null = null;
    let discountCents = 0;
    if (promoCode && typeof promoCode === 'string' && promoCode.trim()) {
      const result = await validatePromoCode(promoCode.trim(), restaurantId, serverCartTotal);
      if (!result.valid) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: result.error }) };
      }
      validatedPromoCode = result.codeNormalized;
      discountCents = result.discountCents;
    }

    const cleanedItems = cartItems.map((item: any) => ({
      id: item.id, name: item.name, quantity: item.quantity,
      selectedOptions: item.selectedOptions || null, price: item.price || null,
    }));

    // Configure Stripe session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${event.headers.origin || 'https://tigre-du-bengale.netlify.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin || 'https://tigre-du-bengale.netlify.app'}/?canceled=true`,
      customer_email: customerInfo.email,
      metadata: {
        restaurantId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address || 'À emporter',
        orderData: JSON.stringify(cleanedItems),
        orderType: orderType || 'delivery',
        promoCode: validatedPromoCode ?? '',
      },
    };

    // Apply discount via one-shot Stripe coupon
    if (discountCents > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: discountCents,
        currency: 'eur',
        duration: 'once',
        name: `Code ${validatedPromoCode}`,
      });
      sessionConfig.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return { statusCode: 200, headers, body: JSON.stringify({ sessionId: session.id, url: session.url }) };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
