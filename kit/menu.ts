import { supabase, RESTAURANT_ID, hasSupabase } from './supabase';
import type { Menu, MenuCategory, MenuItem, MenuOption } from './types';

/** « Groupe — Sous-catégorie » → { group, sub }. */
export function splitCategory(name: string): { group: string; sub: string } {
  const i = name.indexOf(' — ');
  return i === -1 ? { group: name, sub: name } : { group: name.slice(0, i), sub: name.slice(i + 3) };
}

/** Tolère l'ancien format d'options (choices en chaînes). */
export function normOptions(raw: unknown): MenuOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((o) => {
      const g = (o ?? {}) as { title?: unknown; required?: unknown; multiple?: unknown; choices?: unknown };
      const choices = Array.isArray(g.choices)
        ? g.choices.map((c) => {
            if (typeof c === 'string') return { label: c };
            const x = (c ?? {}) as { label?: unknown; price?: unknown };
            const price = Number(x.price);
            return price > 0 ? { label: String(x.label ?? ''), price } : { label: String(x.label ?? '') };
          })
        : [];
      return { title: String(g.title ?? ''), required: !!g.required, multiple: !!g.multiple, choices };
    })
    .filter((g) => g.title && g.choices.length > 0);
}

function toItem(r: Record<string, unknown>): MenuItem {
  const category = String(r.category ?? '');
  const { group, sub } = splitCategory(category);
  return {
    id: String(r.item_id ?? r.id),
    name: String(r.name ?? ''),
    description: String(r.description ?? ''),
    price: Number(r.base_price) || 0,
    category,
    group,
    sub,
    image: (r.image_url as string | null) || undefined,
    options: normOptions(r.options),
    available: r.is_available !== false,
    featured: r.is_featured === true,
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    allergens: Array.isArray(r.allergens) ? (r.allergens as string[]) : [],
    sortOrder: Number(r.sort_order) || 0,
  };
}

export const EMPTY_MENU: Menu = { categories: [], items: [], groups: [], featured: [] };

/**
 * La carte complète : catégories actives (dans l'ordre du CMS) et plats
 * (disponibles ET indisponibles — l'UI décide de griser ou masquer).
 */
export async function fetchMenu(): Promise<Menu> {
  if (!hasSupabase) return EMPTY_MENU;
  const [{ data: cats, error: e1 }, { data: rows, error: e2 }] = await Promise.all([
    supabase.from('menu_categories').select('id,name,description,sort_order,is_active').eq('restaurant_id', RESTAURANT_ID).eq('is_active', true).order('sort_order').order('name'),
    supabase
      .from('menu_items')
      .select('id,item_id,name,description,category,base_price,image_url,options,is_available,is_featured,sort_order,allergens,tags')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('sort_order')
      .order('name'),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const categories: MenuCategory[] = ((cats ?? []) as Record<string, unknown>[]).map((c) => ({
    id: String(c.id),
    name: String(c.name),
    ...splitCategory(String(c.name)),
    description: (c.description as string | null) ?? null,
    sortOrder: Number(c.sort_order) || 0,
  }));
  const activeNames = new Set(categories.map((c) => c.name));
  // Un plat dont la catégorie est désactivée ou inconnue n'apparaît pas sur le site.
  const items = ((rows ?? []) as Record<string, unknown>[]).map(toItem).filter((i) => activeNames.has(i.category));
  const order = new Map(categories.map((c, i) => [c.name, i]));
  items.sort((a, b) => (order.get(a.category)! - order.get(b.category)!) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'fr'));
  const groups = [...new Set(categories.map((c) => c.group))];
  const featured = items.filter((i) => i.featured && i.available);
  return { categories, items, groups, featured };
}

/** Plats d'un groupe (ex. « Plats »), regroupés par sous-catégorie dans l'ordre du CMS. */
export function itemsByGroup(menu: Menu, group: string): { sub: string; category: MenuCategory; items: MenuItem[] }[] {
  return menu.categories
    .filter((c) => c.group === group)
    .map((category) => ({ sub: category.sub, category, items: menu.items.filter((i) => i.category === category.name) }))
    .filter((s) => s.items.length > 0);
}
