import { supabase, RESTAURANT_ID, hasSupabase } from './supabase';
import type { GalleryImage } from './types';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Remise lisible : « −10 % » ou « −5 € ». */
function discountLabel(type: string | undefined, raw: unknown): string {
  const value = Number(raw) || 0;
  return type === 'fixed' ? `−${value.toFixed(2).replace('.', ',').replace(',00', '')} €` : `−${value} %`;
}

/** Offre annoncée AVANT l'inscription (la remise, jamais le code) ; null s'il n'y en a pas. */
export type NewsletterOffer = { label: string; minOrder: number };
export async function fetchNewsletterOffer(): Promise<NewsletterOffer | null> {
  if (!hasSupabase) return null;
  const { data, error } = await supabase.rpc('newsletter_offer', { p_restaurant: RESTAURANT_ID });
  if (error || !data) return null;
  const o = data as { discount_type?: string; discount_value?: number; min_order?: number };
  return { label: discountLabel(o.discount_type, o.discount_value), minOrder: Number(o.min_order) || 0 };
}

/** Code promo offert à l'inscription (réglé dans l'app : Site → Codes promo). */
export type NewsletterGift = { code: string; label: string; minOrder: number; validUntil: string | null };

/**
 * Inscription newsletter. Renvoie le code promo offert aux inscrits s'il y en a un (sinon null).
 * Schéma v3 : fonction newsletter_subscribe (le code n'est jamais lisible autrement) ;
 * base plus ancienne : simple inscription, sans code.
 */
/** E-mail de bienvenue (fonction Netlify) : sans importance si elle échoue, l'inscription est déjà faite. */
function welcomeEmail(email: string) {
  fetch('/.netlify/functions/newsletter-welcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => undefined);
}

export async function subscribeNewsletter(rawEmail: string, source = 'site'): Promise<NewsletterGift | null> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new Error('Adresse e-mail invalide.');
  if (!hasSupabase) throw new Error('Inscription indisponible pour le moment.');
  const { data, error } = await supabase.rpc('newsletter_subscribe', { p_restaurant: RESTAURANT_ID, p_email: email, p_source: source });
  if (error) {
    if (error.code !== 'PGRST202') throw new Error(error.code === '22023' ? error.message : "L'inscription n'a pas pu être enregistrée. Réessayez plus tard.");
    const { error: e2 } = await supabase.from('newsletter_subscribers').insert({ restaurant_id: RESTAURANT_ID, email, source });
    if (e2 && e2.code !== '23505') throw new Error("L'inscription n'a pas pu être enregistrée. Réessayez plus tard.");
    welcomeEmail(email);
    return null;
  }
  welcomeEmail(email);
  const g = (data ?? {}) as { code?: string | null; discount_type?: string; discount_value?: number; min_order?: number; valid_until?: string | null };
  if (!g.code) return null;
  return { code: g.code, label: discountLabel(g.discount_type, g.discount_value), minOrder: Math.round((Number(g.min_order) || 0) * 100) / 100, validUntil: g.valid_until ?? null };
}

/** Message du formulaire de contact (arrive dans l'app Rekvo, section Messages). */
export async function sendContactMessage(name: string, email: string, message: string): Promise<void> {
  if (!name.trim() || !EMAIL_RE.test(email.trim()) || message.trim().length < 5) throw new Error('Merci de remplir tous les champs.');
  if (!hasSupabase) throw new Error('Envoi indisponible pour le moment.');
  const { error } = await supabase.from('contact_messages').insert({
    restaurant_id: RESTAURANT_ID,
    name: name.trim().slice(0, 120),
    email: email.trim().slice(0, 160),
    message: message.trim().slice(0, 4000),
  });
  if (error) throw new Error("Le message n'a pas pu être envoyé. Réessayez plus tard.");
}

/** Photos de la galerie, dans l'ordre du CMS. */
export async function fetchGallery(): Promise<GalleryImage[]> {
  if (!hasSupabase) return [];
  const { data } = await supabase.from('gallery_images').select('id,url').eq('restaurant_id', RESTAURANT_ID).order('sort_order').order('created_at');
  return ((data ?? []) as { id: string; url: string }[]).map((g) => ({ id: g.id, url: g.url }));
}
