/**
 * Kit fonctionnel Rekvo — point d'entrée.
 *
 *   import { useMenu, useCart, CartProvider, startCheckout, … } from '@kit';
 *
 * Le kit ne contient AUCUN visuel : il expose des données, des règles et des
 * hooks. Le site (src/) décide entièrement de l'apparence.
 */
export * from './types';
export { supabase, RESTAURANT_ID, hasSupabase, euro } from './supabase';
export { fetchMenu, itemsByGroup, splitCategory, normOptions, EMPTY_MENU } from './menu';
export { fetchSettings, fetchRestaurant, DEFAULT_SETTINGS, currentClosure, orderingState, deliveryFeeFor } from './settings';
export { fetchContent, defaultsFromManifest, text, list, type ContentValues } from './content';
export { subscribeNewsletter, sendContactMessage, fetchGallery } from './forms';
export { optionsTotal, missingRequired, selectionDetail, pick, unitPrice, type Selection } from './pricing';
export { CartProvider, useCart } from './cart';
export { startCheckout, validatePromo, readPaymentResult, toPayloadLines, type CheckoutPayload } from './checkout';
export { useMenu, useSettings, useRestaurant, useContent, useGallery, useBodyScrollLock, useEscape } from './hooks';
export { legalPages, type LegalPage } from './legal';
export { useVisitTracking, VisitTracker, trackPageView, visitSource } from './analytics';
