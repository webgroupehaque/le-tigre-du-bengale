import { useEffect, useState } from 'react';
import { EMPTY_MENU, fetchMenu } from './menu';
import { DEFAULT_SETTINGS, fetchRestaurant, fetchSettings } from './settings';
import { defaultsFromManifest, fetchContent, type ContentValues } from './content';
import { fetchGallery } from './forms';
import type { ContentField, GalleryImage, Menu, Restaurant, Settings } from './types';

/** Hooks de lecture : chaque donnée arrive avec une valeur de repli immédiate, puis la vraie valeur. */

export function useMenu(): { menu: Menu; loading: boolean; error: string | null } {
  const [menu, setMenu] = useState<Menu>(EMPTY_MENU);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetchMenu()
      .then((m) => alive && setMenu(m))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Carte indisponible.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);
  return { menu, loading, error };
}

export function useSettings(): Settings {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    let alive = true;
    fetchSettings().then((v) => alive && setS(v));
    return () => {
      alive = false;
    };
  }, []);
  return s;
}

export function useRestaurant(fallbackName = ''): Restaurant {
  const [r, setR] = useState<Restaurant>({ id: '', name: fallbackName, siteUrl: null, cuisine: null });
  useEffect(() => {
    let alive = true;
    fetchRestaurant().then((v) => alive && v && setR(v));
    return () => {
      alive = false;
    };
  }, []);
  return r;
}

export function useContent(manifest: ContentField[]): ContentValues {
  const [v, setV] = useState<ContentValues>(() => defaultsFromManifest(manifest));
  useEffect(() => {
    let alive = true;
    fetchContent(manifest).then((x) => alive && setV(x));
    return () => {
      alive = false;
    };
    // le manifeste est une constante du site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}

export function useGallery(): GalleryImage[] {
  const [g, setG] = useState<GalleryImage[]>([]);
  useEffect(() => {
    let alive = true;
    fetchGallery().then((v) => alive && setG(v));
    return () => {
      alive = false;
    };
  }, []);
  return g;
}

/** Bloque le défilement de la page tant qu'une modale est ouverte (verrou partagé). */
let locks = 0;
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    locks++;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      locks--;
      if (locks === 0) document.body.style.overflow = prev;
    };
  }, [active]);
}

/** Ferme sur Échap. */
export function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onClose]);
}
