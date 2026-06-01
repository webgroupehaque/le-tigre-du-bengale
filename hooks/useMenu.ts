import { useEffect, useState } from 'react';
import type { MenuItem } from '../types';
import { MENU_ITEMS as FALLBACK_ITEMS, MENU_CATEGORIES as FALLBACK_CATEGORIES } from '../constants';

const SUPABASE_URL = 'https://rwnvrsagjgpukhnkpurh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bnZyc2FnamdwdWtobmtwdXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTYyOTQsImV4cCI6MjA4MzM5MjI5NH0.E8I9kX5LqkDr-a-0W1jOf5dMBp9vU8qSqTedavCSgfw';
const RESTAURANT_ID = 'tigre-bengale';

type DbItem = { item_id: string; name: string; description: string | null; category: string; base_price: number; image_url: string | null; options: unknown; is_available: boolean; sort_order: number; };
type DbCat = { name: string; sort_order: number; is_active: boolean; };

export function useMenu(): { items: MenuItem[]; categories: string[]; isLoading: boolean } {
  const [items, setItems] = useState<MenuItem[]>(FALLBACK_ITEMS);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const fetchMenu = async () => {
      try {
        const [itemsRes, catsRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/menu_items?restaurant_id=eq.${RESTAURANT_ID}&select=*&order=sort_order.asc`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }),
          fetch(`${SUPABASE_URL}/rest/v1/menu_categories?restaurant_id=eq.${RESTAURANT_ID}&is_active=eq.true&select=*&order=sort_order.asc`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }),
        ]);
        if (!itemsRes.ok || !catsRes.ok) throw new Error('Fetch error');
        const dbItems: DbItem[] = await itemsRes.json();
        const dbCats: DbCat[] = await catsRes.json();
        if (cancelled) return;
        if (dbItems.length === 0 || dbCats.length === 0) { setIsLoading(false); return; }
        const mapped: MenuItem[] = dbItems.filter((i) => i.is_available).map((i) => ({
          id: i.item_id,
          name: i.name,
          description: i.description ?? '',
          price: Number(i.base_price),
          category: i.category,
          image: i.image_url ?? '',
          options: i.options as MenuItem['options'],
        }));
        setItems(mapped);
        setCategories(dbCats.map((c) => c.name));
        setIsLoading(false);
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchMenu();
    return () => { cancelled = true; };
  }, []);

  return { items, categories, isLoading };
}
