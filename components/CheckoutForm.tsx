import React, { useState } from 'react';
import { X } from 'lucide-react';
import { euro, startCheckout, toPayloadLines, useBodyScrollLock, useCart, useEscape, validatePromo } from '@kit';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Form = { name: string; email: string; phone: string; address: string; zip: string; city: string; instructions: string };

/** Coordonnées + adresse + promo, puis Stripe. Le serveur recalcule tous les prix. */
export const CheckoutForm: React.FC = () => {
  const { checkoutOpen, closeCheckout, lines, subtotal, deliveryFee, orderType, settings, ordering, setOrderType } = useCart();
  const [f, setF] = useState<Form>({ name: '', email: '', phone: '', address: '', zip: '', city: '', instructions: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useBodyScrollLock(checkoutOpen);
  useEscape(checkoutOpen, closeCheckout);
  if (!checkoutOpen) return null;

  const delivery = orderType === 'delivery';
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const belowMin = settings.minOrder > 0 && subtotal < settings.minOrder;

  const validate = (): boolean => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!f.name.trim()) e.name = 'Le nom est requis';
    if (!f.email.trim()) e.email = "L'email est requis";
    else if (!EMAIL_RE.test(f.email)) e.email = 'Email invalide';
    if (!f.phone.trim()) e.phone = 'Le téléphone est requis';
    else if (!/^[\d\s+()-]{10,}$/.test(f.phone)) e.phone = 'Numéro de téléphone invalide';
    if (delivery) {
      if (!f.address.trim()) e.address = "L'adresse est requise";
      if (!f.zip.trim()) e.zip = 'Le code postal est requis';
      else if (settings.deliveryZips.length > 0 && !settings.deliveryZips.includes(f.zip.trim())) e.zip = `Nous ne livrons pas au ${f.zip.trim()}`;
      if (!f.city.trim()) e.city = 'La ville est requise';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const applyPromo = async () => {
    const code = promoCode.trim();
    if (!code) return;
    try {
      const r = await validatePromo(code, subtotal);
      setDiscount(r.discount);
      setPromoMsg(`Code appliqué : ${r.label}`);
    } catch (e) {
      setDiscount(0);
      setPromoMsg(e instanceof Error ? e.message : 'Code invalide.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || belowMin) return;
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const { url } = await startCheckout({
        orderType,
        customer: { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() },
        address: delivery ? { line: f.address.trim(), zip: f.zip.trim(), city: f.city.trim() } : undefined,
        instructions: f.instructions.trim() || undefined,
        promoCode: promoCode.trim() || undefined,
        lines: toPayloadLines(lines),
      });
      window.location.href = url;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  };

  const set = (k: keyof Form) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF({ ...f, [k]: ev.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };
  const input = (k: keyof Form) =>
    `w-full px-4 py-2 bg-bengal-dark/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-bengal-gold focus:ring-2 focus:ring-bengal-gold/50 transition-colors ${errors[k] ? 'border-red-500/50' : 'border-orange-900/20'}`;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] transition-opacity duration-300" onClick={() => !isSubmitting && closeCheckout()} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-bengal-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-900/30 pointer-events-auto flex flex-col">
          <div className="sticky top-0 bg-bengal-dark border-b border-orange-900/30 p-6 flex justify-between items-center z-10">
            <h2 className="text-2xl font-serif text-bengal-gold">Finaliser la commande</h2>
            <button onClick={closeCheckout} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white" aria-label="Fermer">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {ordering.modes.length > 1 && (
              <div className="bg-bengal-dark p-1 rounded-lg flex border border-orange-900/20 mb-6">
                <button type="button" onClick={() => setOrderType('delivery')} className={`flex-1 py-2 rounded text-sm font-bold uppercase transition-colors ${delivery ? 'bg-bengal-gold text-bengal-dark shadow' : 'text-gray-400 hover:text-white'}`}>Livraison</button>
                <button type="button" onClick={() => setOrderType('pickup')} className={`flex-1 py-2 rounded text-sm font-bold uppercase transition-colors ${!delivery ? 'bg-bengal-gold text-bengal-dark shadow' : 'text-gray-400 hover:text-white'}`}>A Emporter</button>
              </div>
            )}

            <div className="mb-6 p-4 bg-bengal-dark/50 rounded-lg border border-orange-900/20">
              <h3 className="font-semibold text-lg mb-3 text-white">Récapitulatif</h3>
              {lines.map((l) => (
                <div key={l.key} className="mb-3 pb-3 border-b border-orange-900/20 last:border-0">
                  <div className="flex justify-between text-sm mb-1 text-gray-300">
                    <span className="font-bold text-white">{l.item.name} x{l.qty}</span>
                    <span className="font-medium text-bengal-gold">{euro(l.unitPrice * l.qty)}</span>
                  </div>
                  {l.detail && <p className="text-xs text-gray-400 mt-1"><span className="text-bengal-spice">Options :</span> {l.detail}</p>}
                </div>
              ))}
              <div className="space-y-1 mt-3 pt-3 border-t border-orange-900/30 text-sm text-gray-400">
                <div className="flex justify-between"><span>Sous-total</span><span>{euro(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-400"><span>Remise</span><span>−{euro(discount)}</span></div>}
                {delivery && <div className="flex justify-between"><span>Livraison</span><span>{deliveryFee > 0 ? euro(deliveryFee) : 'Offerte'}</span></div>}
                <div className="flex justify-between font-bold text-lg text-white pt-2"><span>Total</span><span className="text-bengal-gold">{euro(total)}</span></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Nom complet *</label>
                <input type="text" id="name" value={f.name} onChange={set('name')} className={input('name')} placeholder="Jean Dupont" autoComplete="name" />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email *</label>
                <input type="email" id="email" value={f.email} onChange={set('email')} className={input('email')} placeholder="jean.dupont@email.com" autoComplete="email" />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">Téléphone *</label>
                <input type="tel" id="phone" value={f.phone} onChange={set('phone')} className={input('phone')} placeholder="06 12 34 56 78" autoComplete="tel" />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              {delivery && (
                <>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-400 mb-1">Adresse de livraison *</label>
                    <input type="text" id="address" value={f.address} onChange={set('address')} className={input('address')} placeholder="123 Rue de la République" autoComplete="street-address" />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-3">
                    <div>
                      <label htmlFor="zip" className="block text-sm font-medium text-gray-400 mb-1">Code postal *</label>
                      <input type="text" id="zip" value={f.zip} onChange={set('zip')} className={input('zip')} placeholder="54000" autoComplete="postal-code" />
                      {errors.zip && <p className="text-red-500 text-sm mt-1">{errors.zip}</p>}
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-400 mb-1">Ville *</label>
                      <input type="text" id="city" value={f.city} onChange={set('city')} className={input('city')} placeholder="Nancy" autoComplete="address-level2" />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>
                  </div>
                </>
              )}
              <div>
                <label htmlFor="instructions" className="block text-sm font-medium text-gray-400 mb-1">Instructions (optionnel)</label>
                <textarea id="instructions" value={f.instructions} onChange={set('instructions')} rows={2} className={`${input('instructions')} resize-none`} placeholder="Digicode, étage, allergies…" />
              </div>
              <div>
                <label htmlFor="promoCode" className="block text-sm font-medium text-gray-400 mb-1">Code promo (optionnel)</label>
                <div className="flex gap-2">
                  <input type="text" id="promoCode" value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoMsg(''); }} className="flex-1 px-4 py-2 bg-bengal-dark/50 border border-orange-900/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-bengal-gold focus:ring-2 focus:ring-bengal-gold/50 transition-colors uppercase" placeholder="EX : BIENVENUE10" />
                  <button type="button" onClick={() => void applyPromo()} className="px-4 border border-orange-900/30 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors font-medium text-sm">Appliquer</button>
                </div>
                {promoMsg && <p className={`text-sm mt-1 ${discount > 0 ? 'text-green-400' : 'text-orange-300'}`}>{promoMsg}</p>}
              </div>

              {belowMin && <p className="text-orange-300 text-sm">Minimum de commande : {euro(settings.minOrder)}.</p>}
              {submitError && <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">{submitError}</p>}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeCheckout} className="flex-1 px-6 py-3 border border-orange-900/30 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors font-medium">Annuler</button>
                <button type="submit" disabled={isSubmitting || belowMin} className="flex-1 px-6 py-3 bg-gradient-to-r from-bengal-gold to-orange-600 text-white font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Traitement…' : `Payer ${euro(total)}`}
                </button>
              </div>
              <p className="text-gray-500 text-xs text-center">Paiement sécurisé par Stripe.</p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
