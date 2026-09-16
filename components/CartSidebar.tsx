import React from 'react';
import { X, ShoppingBag, Bike, Store, Plus, Minus, Trash2 } from 'lucide-react';
import { euro, useBodyScrollLock, useCart, useEscape } from '@kit';

const CartSidebar: React.FC = () => {
  const { lines, subtotal, deliveryFee, total, orderType, setOrderType, isOpen, close, updateQty, remove, openCheckout, settings, ordering } = useCart();
  useBodyScrollLock(isOpen);
  useEscape(isOpen, close);
  const belowMin = settings.minOrder > 0 && subtotal < settings.minOrder;
  const modes = ordering.modes;

  return (
    <>
      <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={close} />

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-bengal-card shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col border-l border-orange-900/30 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} aria-hidden={!isOpen}>
        <div className="p-6 border-b border-orange-900/30 flex justify-between items-center bg-bengal-dark">
          <div className="flex items-center">
            <ShoppingBag className="text-bengal-gold mr-3" size={24} />
            <h2 className="text-2xl font-serif text-white">Votre Panier</h2>
          </div>
          <button onClick={close} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white" aria-label="Fermer">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60 space-y-4">
              <div className="w-20 h-20 bg-bengal-dark rounded-full flex items-center justify-center">
                <ShoppingBag size={40} className="text-gray-600" />
              </div>
              <p className="text-gray-400 text-lg">Votre panier est vide.</p>
              <button onClick={close} className="text-bengal-gold hover:underline text-sm font-bold uppercase tracking-wide">Retourner à la carte</button>
            </div>
          ) : (
            <div className="space-y-6">
              {modes.length > 1 && (
                <div className="bg-bengal-dark p-1 rounded-lg flex border border-orange-900/20">
                  <button onClick={() => setOrderType('delivery')} className={`flex-1 flex items-center justify-center py-2 rounded text-sm font-bold uppercase transition-colors ${orderType === 'delivery' ? 'bg-bengal-gold text-bengal-dark shadow' : 'text-gray-400 hover:text-white'}`}>
                    <Bike size={16} className="mr-2" /> Livraison
                  </button>
                  <button onClick={() => setOrderType('pickup')} className={`flex-1 flex items-center justify-center py-2 rounded text-sm font-bold uppercase transition-colors ${orderType === 'pickup' ? 'bg-bengal-gold text-bengal-dark shadow' : 'text-gray-400 hover:text-white'}`}>
                    <Store size={16} className="mr-2" /> A Emporter
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {lines.map((l) => (
                  <div key={l.key} className="bg-bengal-dark/50 p-4 rounded-lg border border-orange-900/10 flex justify-between items-start group hover:border-bengal-gold/30 transition-colors">
                    <div className="flex-1">
                      <h4 className="text-white font-bold mb-1">{l.item.name}</h4>
                      {l.detail && (
                        <div className="text-xs text-gray-400 mb-2 border-l-2 border-bengal-spice/50 pl-2">
                          <p>{l.detail}</p>
                        </div>
                      )}
                      <p className="text-bengal-gold text-sm font-bold">{euro(l.unitPrice * l.qty)}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-3">
                      <button onClick={() => remove(l.key)} className="text-red-500/50 hover:text-red-500 transition-colors p-1" aria-label="Retirer">
                        <Trash2 size={16} />
                      </button>
                      <div className="flex items-center space-x-3 bg-bengal-card rounded px-2 py-1 border border-white/5">
                        <button onClick={() => updateQty(l.key, -1)} className="p-1 text-gray-400 hover:text-white transition-colors" aria-label="Moins"><Minus size={14} /></button>
                        <span className="text-sm font-bold text-white w-4 text-center">{l.qty}</span>
                        <button onClick={() => updateQty(l.key, 1)} className="p-1 text-gray-400 hover:text-white transition-colors" aria-label="Plus"><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="p-6 bg-bengal-dark border-t border-orange-900/30">
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between text-gray-400"><span>Sous-total</span><span>{euro(subtotal)}</span></div>
              <div className="flex justify-between text-gray-400">
                <span>Frais ({orderType === 'delivery' ? 'Livraison' : 'Retrait'})</span>
                <span>{deliveryFee > 0 ? euro(deliveryFee) : 'Gratuit'}</span>
              </div>
              <div className="flex justify-between text-white text-xl font-bold font-serif pt-4 border-t border-gray-700">
                <span>Total</span>
                <span className="text-bengal-gold">{euro(total)}</span>
              </div>
            </div>
            {belowMin && <p className="text-orange-300 text-sm text-center mb-3">Minimum de commande : {euro(settings.minOrder)}.</p>}
            <button onClick={openCheckout} disabled={belowMin} className="w-full py-4 bg-gradient-to-r from-bengal-gold to-orange-600 text-white font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] rounded-lg text-lg disabled:opacity-50">
              Commander
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
