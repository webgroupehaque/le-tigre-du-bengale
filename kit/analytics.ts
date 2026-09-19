import { useEffect } from 'react';
import { supabase, RESTAURANT_ID, hasSupabase } from './supabase';

/**
 * Mesure d'audience Rekvo — SANS cookie, SANS identifiant, SANS donnée
 * personnelle : le site signale une visite (première page d'une session du
 * navigateur) et chaque page vue ; la base du client n'additionne que des
 * compteurs par jour (schéma standard v2, fonction `track_visit`).
 * Les chiffres s'affichent dans l'app Rekvo : Site → Statistiques → Visiteurs.
 *
 * Exempté de consentement (mesure d'audience anonyme, strictement limitée) :
 * pas de bannière cookies nécessaire.
 */

const SESSION_KEY = 'rekvo_visit';
type Source = 'direct' | 'google' | 'facebook' | 'instagram' | 'tiktok' | 'whatsapp' | 'plaque' | 'fidelite' | 'autre';

/** D'où vient la visite : paramètre ?utm_source= / ?src= en priorité, sinon le site précédent. */
export function visitSource(referrer = document.referrer, search = window.location.search): Source {
  const q = new URLSearchParams(search);
  const tag = (q.get('utm_source') || q.get('src') || '').toLowerCase();
  const known: Source[] = ['google', 'facebook', 'instagram', 'tiktok', 'whatsapp', 'plaque', 'fidelite'];
  if (known.includes(tag as Source)) return tag as Source;
  if (!referrer) return 'direct';
  let host = '';
  try { host = new URL(referrer).hostname.replace(/^www\./, ''); } catch { return 'autre'; }
  if (host === window.location.hostname.replace(/^www\./, '')) return 'direct';
  if (/(^|\.)google\./.test(host)) return 'google';
  if (/facebook\.|fb\.|messenger\./.test(host)) return 'facebook';
  if (/instagram\./.test(host)) return 'instagram';
  if (/tiktok\./.test(host)) return 'tiktok';
  if (/whatsapp\.|wa\.me/.test(host)) return 'whatsapp';
  if (/go\.rekvo\.agency|rekvo-mockups/.test(host)) return 'plaque';
  if (/espace\.rekvo\.agency/.test(host)) return 'fidelite';
  return 'autre';
}

function isBot(): boolean {
  return /bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(navigator.userAgent) || (navigator as Navigator & { webdriver?: boolean }).webdriver === true;
}

let lastPath = '';
/** Signale la page courante (sans doublon si l'adresse n'a pas changé). */
export function trackPageView(): void {
  if (!hasSupabase || !RESTAURANT_ID) return;
  if (import.meta.env.DEV && !import.meta.env.VITE_TRACK_DEV) return; // pas de comptage en développement
  if (isBot() || new URLSearchParams(window.location.search).has('kit')) return;
  // Chemin seul : les ancres d'un site d'une page (#carte, #contact) ne sont pas des pages.
  const path = window.location.pathname;
  if (path === lastPath) return;
  lastPath = path;
  let isNew = false;
  try { isNew = !sessionStorage.getItem(SESSION_KEY); sessionStorage.setItem(SESSION_KEY, '1'); } catch { isNew = false; }
  const mobile = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  // .then() obligatoire : une requête Supabase ne part que lorsqu'on l'attend.
  supabase.rpc('track_visit', { p_restaurant: RESTAURANT_ID, p_path: path, p_new: isNew, p_source: isNew ? visitSource() : 'direct', p_mobile: mobile }).then(() => undefined, () => undefined);
}

/**
 * À appeler une fois dans l'application (le squelette le fait dans main.tsx) :
 * compte l'arrivée puis chaque changement de page (routeur ou ancres).
 */
export function useVisitTracking(): void {
  useEffect(() => {
    trackPageView();
    const onChange = () => setTimeout(trackPageView, 0);
    const { pushState, replaceState } = window.history;
    window.history.pushState = function (...args: Parameters<History['pushState']>) { pushState.apply(this, args); onChange(); };
    window.history.replaceState = function (...args: Parameters<History['replaceState']>) { replaceState.apply(this, args); onChange(); };
    window.addEventListener('popstate', onChange);
    return () => {
      window.history.pushState = pushState;
      window.history.replaceState = replaceState;
      window.removeEventListener('popstate', onChange);
    };
  }, []);
}

/** Version composant (ne rend rien) : <VisitTracker />. */
export function VisitTracker(): null {
  useVisitTracking();
  return null;
}
