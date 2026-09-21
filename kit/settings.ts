import { supabase, RESTAURANT_ID, hasSupabase } from './supabase';
import type { Closure, Restaurant, Settings } from './types';

/** Valeurs de repli tant que la base ne répond pas (ou si elle n'est pas configurée). */
export const DEFAULT_SETTINGS: Settings = {
  orderingEnabled: true,
  deliveryEnabled: true,
  pickupEnabled: true,
  deliveryFee: 0,
  freeDeliveryOver: null,
  minOrder: 0,
  deliveryZips: [],
  prepMinutes: 20,
  deliveryMinutes: 40,
  address: '',
  phone: '',
  email: '',
  hours: [],
  closures: [],
  announcement: '',
  announcementActive: false,
  legalCompany: '',
  legalSiret: '',
  legalPublisher: '',
};

const COLS =
  'ordering_enabled,delivery_enabled,pickup_enabled,delivery_fee,free_delivery_over,min_order,delivery_zips,prep_minutes,delivery_minutes,address,phone,email,hours,closures,announcement,announcement_active,legal_company,legal_siret,legal_publisher';

export async function fetchSettings(): Promise<Settings> {
  if (!hasSupabase) return DEFAULT_SETTINGS;
  const { data, error } = await supabase.from('restaurant_settings').select(COLS).eq('restaurant_id', RESTAURANT_ID).maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  const r = data as Record<string, unknown>;
  return {
    orderingEnabled: r.ordering_enabled !== false,
    deliveryEnabled: r.delivery_enabled !== false,
    pickupEnabled: r.pickup_enabled !== false,
    deliveryFee: Number(r.delivery_fee) || 0,
    freeDeliveryOver: r.free_delivery_over == null ? null : Number(r.free_delivery_over),
    minOrder: Number(r.min_order) || 0,
    deliveryZips: Array.isArray(r.delivery_zips) ? (r.delivery_zips as string[]) : [],
    prepMinutes: Number(r.prep_minutes) || 20,
    deliveryMinutes: Number(r.delivery_minutes) || 40,
    address: String(r.address ?? ''),
    phone: String(r.phone ?? ''),
    email: String(r.email ?? ''),
    hours: Array.isArray(r.hours) ? (r.hours as Settings['hours']) : [],
    closures: Array.isArray(r.closures) ? (r.closures as Closure[]) : [],
    announcement: String(r.announcement ?? ''),
    announcementActive: r.announcement_active === true,
    legalCompany: String(r.legal_company ?? ''),
    legalSiret: String(r.legal_siret ?? ''),
    legalPublisher: String(r.legal_publisher ?? ''),
  };
}

export async function fetchRestaurant(): Promise<Restaurant | null> {
  if (!hasSupabase) return null;
  const { data } = await supabase.from('restaurants').select('id,name,site_url,cuisine').eq('id', RESTAURANT_ID).maybeSingle();
  if (!data) return null;
  const r = data as Record<string, unknown>;
  return { id: String(r.id), name: String(r.name ?? ''), siteUrl: (r.site_url as string | null) ?? null, cuisine: (r.cuisine as string | null) ?? null };
}

/** La fermeture exceptionnelle en cours (aujourd'hui), s'il y en a une. */
export function currentClosure(closures: Closure[], now = new Date()): Closure | null {
  const today = now.toISOString().slice(0, 10);
  return closures.find((c) => c.from <= today && (c.to || c.from) >= today) ?? null;
}

/**
 * Règle de commande, dérivée des réglages : si la commande est coupée, ou si
 * aucun mode n'est disponible, le site masque le panier (carte simple).
 */
export function orderingState(s: Settings): { enabled: boolean; modes: ('pickup' | 'delivery')[]; reason?: string } {
  if (!s.orderingEnabled) return { enabled: false, modes: [], reason: 'La commande en ligne est désactivée.' };
  const modes: ('pickup' | 'delivery')[] = [];
  if (s.pickupEnabled) modes.push('pickup');
  // Livraison sans aucun code postal = livraison ouverte à la France entière : on la
  // considère non configurée tant que les zones ne sont pas renseignées dans l'app.
  if (s.deliveryEnabled && s.deliveryZips.length > 0) modes.push('delivery');
  if (modes.length === 0) return { enabled: false, modes, reason: 'Aucun mode de commande disponible.' };
  const closure = currentClosure(s.closures);
  if (closure) return { enabled: false, modes, reason: closure.label ? `Fermeture : ${closure.label}.` : 'Fermeture exceptionnelle.' };
  return { enabled: true, modes };
}

/** Frais de livraison applicables à un sous-total. */
export function deliveryFeeFor(s: Settings, subtotal: number, orderType: 'pickup' | 'delivery'): number {
  if (orderType !== 'delivery' || subtotal <= 0) return 0;
  if (s.freeDeliveryOver != null && subtotal >= s.freeDeliveryOver) return 0;
  return s.deliveryFee;
}

/**
 * Délai annoncé au client, en minutes, réglé dans l'app (Site → Réglages).
 * Une seule source pour le site ET pour les e-mails : le client doit lire
 * partout la même promesse.
 */
export function etaMinutes(s: Settings, orderType: 'pickup' | 'delivery'): number {
  return orderType === 'delivery' ? s.deliveryMinutes : s.prepMinutes;
}

/** Le même délai, écrit pour être affiché : « ≈ 20 min ». */
export function etaLabel(s: Settings, orderType: 'pickup' | 'delivery'): string {
  return `≈ ${etaMinutes(s, orderType)} min`;
}
