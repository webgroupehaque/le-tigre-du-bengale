import { supabase, RESTAURANT_ID, hasSupabase } from './supabase';
import type { GalleryImage } from './types';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Inscription newsletter (insert public ; déjà inscrit = succès). */
export async function subscribeNewsletter(rawEmail: string, source = 'site'): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new Error('Adresse e-mail invalide.');
  if (!hasSupabase) throw new Error('Inscription indisponible pour le moment.');
  const { error } = await supabase.from('newsletter_subscribers').insert({ restaurant_id: RESTAURANT_ID, email, source });
  if (error && error.code !== '23505') throw new Error("L'inscription n'a pas pu être enregistrée. Réessayez plus tard.");
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
