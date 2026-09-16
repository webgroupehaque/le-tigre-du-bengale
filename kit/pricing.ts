import { euro } from './supabase';
import type { MenuItem, MenuOption } from './types';

/**
 * Calcul du prix et du libellé d'un plat avec ses options — utilisé par la
 * modale de choix (côté site) ; le serveur recalcule et borne au paiement.
 */

export type Selection = Record<string, number[]>; // titre du groupe → indices des choix

export function optionsTotal(options: MenuOption[], sel: Selection): number {
  return options.reduce((sum, g) => sum + (sel[g.title] ?? []).reduce((s, i) => s + (g.choices[i]?.price ?? 0), 0), 0);
}

export function missingRequired(options: MenuOption[], sel: Selection): boolean {
  return options.some((g) => g.required && (sel[g.title] ?? []).length === 0);
}

export function selectionDetail(options: MenuOption[], sel: Selection): string {
  const parts: string[] = [];
  for (const g of options) for (const i of sel[g.title] ?? []) {
    const c = g.choices[i];
    if (c) parts.push(c.price ? `${c.label} (+${euro(c.price)})` : c.label);
  }
  return parts.join(' · ');
}

/** Bascule un choix : groupe multiple → ajoute/retire, groupe simple → remplace. */
export function pick(sel: Selection, group: MenuOption, index: number): Selection {
  const cur = sel[group.title] ?? [];
  if (group.multiple) return { ...sel, [group.title]: cur.includes(index) ? cur.filter((x) => x !== index) : [...cur, index] };
  return { ...sel, [group.title]: [index] };
}

export function unitPrice(item: MenuItem, sel: Selection): number {
  return Math.round((item.price + optionsTotal(item.options, sel)) * 100) / 100;
}
