import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Le site peut s'afficher sans base (contenus par défaut), mais on le dit clairement en console.
  console.warn('[rekvo-kit] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes : le site tourne sur ses valeurs par défaut.');
}

/** Client Supabase public (clé anon) : lecture de la carte, des réglages, des contenus ; insert newsletter/contact. */
export const supabase = createClient(url || 'https://invalid.supabase.co', key || 'anon', {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Identifiant de CE restaurant dans la base (restaurants.id) : filtre toutes les requêtes. */
export const RESTAURANT_ID: string = import.meta.env.VITE_RESTAURANT_ID || '';

export const hasSupabase = Boolean(url && key && RESTAURANT_ID);

/** Format monétaire français. */
export const euro = (n: number) => `${(Number(n) || 0).toFixed(2).replace('.', ',')} €`;
