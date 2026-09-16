import type { CartLine, OrderType } from './types';

/**
 * Appels vers les fonctions Netlify. Aucune logique de prix ici : tout est
 * recalculé et borné côté serveur (create-checkout.mjs).
 */

export type CheckoutPayload = {
  orderType: OrderType;
  customer: { name: string; email: string; phone: string };
  address?: { line: string; zip: string; city: string };
  instructions?: string;
  promoCode?: string;
  lines: { item_id: string; name: string; qty: number; unitPrice: number; detail: string }[];
};

async function callFn<T>(name: string, body: unknown): Promise<T> {
  const res = await fetch(`/.netlify/functions/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok || data?.error) throw new Error(data?.error || 'Une erreur est survenue.');
  return data;
}

export const toPayloadLines = (lines: CartLine[]): CheckoutPayload['lines'] =>
  lines.map((l) => ({ item_id: l.item.id, name: l.item.name, qty: l.qty, unitPrice: l.unitPrice, detail: l.detail }));

/** Démarre le paiement : renvoie l'URL de la page Stripe (rediriger avec window.location.href). */
export const startCheckout = (payload: CheckoutPayload) => callFn<{ url: string }>('create-checkout', payload);

/** Aperçu d'un code promo ; revalidé au paiement. */
export const validatePromo = (code: string, subtotal: number) => callFn<{ discount: number; label: string }>('validate-promo', { code, subtotal });

/**
 * Lit `?paiement=reussi|annule` au retour de Stripe, nettoie l'URL et renvoie
 * le statut (null si aucun). À appeler une fois au montage ; vider le panier
 * uniquement si `reussi`.
 */
export function readPaymentResult(): 'reussi' | 'annule' | null {
  const p = new URLSearchParams(window.location.search).get('paiement');
  if (p !== 'reussi' && p !== 'annule') return null;
  window.history.replaceState({}, '', window.location.pathname + window.location.hash);
  return p;
}
