import { supabase, RESTAURANT_ID, hasSupabase } from './supabase';
import type { ContentField } from './types';

/**
 * Contenus éditables du site (textes, images, liens) : déclarés dans
 * `site.manifest.json` (poussé dans restaurants.content_manifest), valeurs
 * dans `site_content`. Ce module renvoie toujours une valeur : celle de la
 * base si elle existe, sinon le `default` du manifeste.
 */

export type ContentValues = Record<string, string | string[]>;

export function defaultsFromManifest(manifest: ContentField[]): ContentValues {
  const out: ContentValues = {};
  for (const f of manifest) {
    if (f.type === 'list') out[f.key] = Array.isArray(f.default) ? (f.default as string[]) : [];
    else out[f.key] = f.default == null ? '' : String(f.default);
  }
  return out;
}

export async function fetchContent(manifest: ContentField[]): Promise<ContentValues> {
  const values = defaultsFromManifest(manifest);
  if (!hasSupabase) return values;
  const { data } = await supabase.from('site_content').select('key,value').eq('restaurant_id', RESTAURANT_ID);
  const types = new Map(manifest.map((f) => [f.key, f.type]));
  for (const row of (data ?? []) as { key: string; value: unknown }[]) {
    const t = types.get(row.key);
    if (!t) continue; // valeur orpheline (champ retiré du manifeste)
    if (t === 'list') values[row.key] = Array.isArray(row.value) ? (row.value as string[]).map(String) : String(row.value ?? '').split('\n').filter(Boolean);
    else if (row.value != null && String(row.value) !== '') values[row.key] = String(row.value);
  }
  return values;
}

/** Accès typé : `text(values, 'hero.title')` / `list(values, 'about.points')`. */
export const text = (v: ContentValues, key: string): string => {
  const x = v[key];
  return Array.isArray(x) ? x.join('\n') : (x ?? '');
};
export const list = (v: ContentValues, key: string): string[] => {
  const x = v[key];
  return Array.isArray(x) ? x : x ? String(x).split('\n').filter(Boolean) : [];
};
