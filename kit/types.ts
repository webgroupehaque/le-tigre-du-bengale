/**
 * Types du schéma de site standard Rekvo (v1) tels que le site les consomme.
 * Source de vérité du schéma : Documents/Rekvo/clients/<client>/schema-standard.
 */

export type MenuChoice = { label: string; price?: number };
export type MenuOption = { title: string; required: boolean; multiple?: boolean; choices: MenuChoice[] };

export type MenuItem = {
  /** Slug stable (menu_items.item_id) — c'est lui qui part dans la commande. */
  id: string;
  name: string;
  description: string;
  price: number;
  /** Nom complet de la catégorie, ex. « Entrées — Salades ». */
  category: string;
  /** Groupe (avant « — ») ou catégorie entière s'il n'y a pas de groupe. */
  group: string;
  /** Sous-catégorie (après « — ») ou catégorie entière. */
  sub: string;
  image?: string;
  options: MenuOption[];
  available: boolean;
  featured: boolean;
  tags: string[];
  allergens: string[];
  sortOrder: number;
};

export type MenuCategory = { id: string; name: string; group: string; sub: string; description: string | null; sortOrder: number };

export type Menu = {
  categories: MenuCategory[];
  items: MenuItem[];
  /** Groupes dans l'ordre des catégories (« Entrées », « Plats »…). */
  groups: string[];
  /** Plats mis en avant (vedettes), disponibles. */
  featured: MenuItem[];
};

export type OpeningHours = { days: string; slots: string };
export type Closure = { from: string; to: string; label?: string };

export type Settings = {
  orderingEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryFee: number;
  freeDeliveryOver: number | null;
  minOrder: number;
  deliveryZips: string[];
  address: string;
  phone: string;
  email: string;
  hours: OpeningHours[];
  closures: Closure[];
  announcement: string;
  announcementActive: boolean;
  legalCompany: string;
  legalSiret: string;
  legalPublisher: string;
};

export type Restaurant = { id: string; name: string; siteUrl: string | null; cuisine: string | null };

export type ContentFieldType = 'text' | 'textarea' | 'image' | 'url' | 'list';
export type ContentField = { key: string; label: string; type: ContentFieldType; group?: string; default?: unknown; help?: string };

export type GalleryImage = { id: string; url: string };

export type OrderType = 'delivery' | 'pickup';

export type CartLine = {
  key: string;
  item: MenuItem;
  qty: number;
  unitPrice: number;
  /** Options choisies, lisible : « Agneau (+2,00 €) · Nan au fromage ». */
  detail: string;
};
