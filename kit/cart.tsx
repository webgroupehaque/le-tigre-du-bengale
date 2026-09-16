import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { deliveryFeeFor, orderingState } from './settings';
import { useSettings } from './hooks';
import type { CartLine, MenuItem, OrderType, Settings } from './types';

/**
 * Panier headless : état, persistance locale, règles de frais issues des
 * réglages du CMS, et deux petites animations optionnelles (« vol » vers
 * l'icône panier). Aucun visuel imposé : le site rend ce qu'il veut.
 */

const STORAGE_KEY = `rekvo_cart_${import.meta.env.VITE_RESTAURANT_ID || 'site'}`;

type Cart = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderType: OrderType;
  setOrderType: (t: OrderType) => void;
  settings: Settings;
  /** Règle de commande dérivée des réglages (commande coupée, fermeture…). */
  ordering: ReturnType<typeof orderingState>;
  add: (item: MenuItem, opts?: { unitPrice?: number; detail?: string; source?: HTMLElement | null }) => void;
  updateQty: (key: string, delta: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  checkoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  /** Enregistre l'élément « icône panier » vers lequel l'animation d'ajout vole. */
  registerCartIcon: (el: HTMLElement | null) => void;
};

const Ctx = createContext<Cart | null>(null);

export function useCart(): Cart {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCart doit être utilisé dans <CartProvider>.');
  return c;
}

export function CartProvider({ children, flyColor = '#111' }: { children: ReactNode; flyColor?: string }) {
  const settings = useSettings();
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderType, setOrderTypeState] = useState<OrderType>('pickup');
  const iconRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* mode privé / quota : on ignore */
    }
  }, [lines]);

  // Mode par défaut = le premier autorisé.
  useEffect(() => {
    if (orderType === 'delivery' && !settings.deliveryEnabled && settings.pickupEnabled) setOrderTypeState('pickup');
    if (orderType === 'pickup' && !settings.pickupEnabled && settings.deliveryEnabled) setOrderTypeState('delivery');
  }, [settings, orderType]);

  const registerCartIcon = useCallback((el: HTMLElement | null) => {
    iconRef.current = el;
  }, []);

  const fly = useCallback(
    (source: HTMLElement, done: () => void) => {
      const target = iconRef.current;
      if (!target || matchMedia('(prefers-reduced-motion: reduce)').matches) return done();
      const s = source.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const x0 = s.left + s.width / 2;
      const y0 = s.top + s.height / 2;
      const dx = t.left + t.width / 2 - x0;
      const dy = t.top + t.height / 2 - y0;
      const dot = document.createElement('div');
      Object.assign(dot.style, { position: 'fixed', left: `${x0 - 8}px`, top: `${y0 - 8}px`, width: '16px', height: '16px', borderRadius: '999px', background: flyColor, zIndex: '9999', pointerEvents: 'none' });
      document.body.appendChild(dot);
      const anim = dot.animate(
        [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(1.1)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0.3 },
        ],
        { duration: 520, easing: 'cubic-bezier(.45,.05,.55,.95)' },
      );
      anim.onfinish = () => {
        dot.remove();
        target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 320 });
        done();
      };
    },
    [flyColor],
  );

  const add = useCallback<Cart['add']>(
    (item, opts) => {
      const unitPrice = opts?.unitPrice ?? item.price;
      const detail = opts?.detail ?? '';
      const commit = () =>
        setLines((prev) => {
          const key = `${item.id}|${detail}`;
          const i = prev.findIndex((l) => l.key === key);
          if (i >= 0) return prev.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
          return [...prev, { key, item, qty: 1, unitPrice, detail }];
        });
      if (opts?.source) fly(opts.source, commit);
      else commit();
    },
    [fly],
  );

  const updateQty = useCallback((key: string, delta: number) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0));
  }, []);
  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const subtotal = useMemo(() => Math.round(lines.reduce((n, l) => n + l.unitPrice * l.qty, 0) * 100) / 100, [lines]);
  const deliveryFee = useMemo(() => deliveryFeeFor(settings, subtotal, orderType), [settings, subtotal, orderType]);
  const ordering = useMemo(() => orderingState(settings), [settings]);

  const value: Cart = {
    lines,
    count,
    subtotal,
    deliveryFee,
    total: Math.round((subtotal + deliveryFee) * 100) / 100,
    orderType,
    setOrderType: setOrderTypeState,
    settings,
    ordering,
    add,
    updateQty,
    remove,
    clear,
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    checkoutOpen,
    openCheckout: () => {
      setOpen(false);
      setCheckoutOpen(true);
    },
    closeCheckout: () => setCheckoutOpen(false),
    registerCartIcon,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
