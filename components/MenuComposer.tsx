import React, { useEffect, useState } from 'react';
import { X, Check, ChevronRight } from 'lucide-react';
import { euro, missingRequired, pick, selectionDetail, unitPrice, useBodyScrollLock, useEscape, type MenuItem, type Selection } from '@kit';

interface MenuComposerProps {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (item: MenuItem, payload: { unitPrice: number; detail: string }, source: HTMLElement | null) => void;
}

/** Composition pas à pas des options d'un plat (groupes définis dans le CMS, suppléments inclus). */
const MenuComposer: React.FC<MenuComposerProps> = ({ item, onClose, onConfirm }) => {
  const [sel, setSel] = useState<Selection>({});
  const [step, setStep] = useState(0);
  useEffect(() => {
    setSel({});
    setStep(0);
  }, [item]);
  useBodyScrollLock(true);
  useEscape(true, onClose);

  const steps = item.options;
  const current = steps[step];
  if (!current) return null;
  const stepValid = !current.required || (sel[current.title] ?? []).length > 0;
  const allValid = !missingRequired(steps, sel);
  const total = unitPrice(item, sel);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-bengal-dark border border-bengal-gold/30 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-orange-900/30 bg-bengal-card flex justify-between items-center">
          <div>
            <h3 className="text-sm text-bengal-gold font-bold uppercase tracking-widest mb-1">Composer votre plat</h3>
            <h2 className="text-2xl font-serif text-white">{item.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Fermer">
            <X className="text-gray-400 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="flex mb-8 space-x-2">
            {steps.map((_, idx) => (
              <div key={idx} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${idx <= step ? 'bg-bengal-gold' : 'bg-gray-700'}`} />
            ))}
          </div>

          <div className="mb-6">
            <h4 className="text-xl text-white font-serif mb-4 flex items-center flex-wrap gap-2">
              <span className="bg-bengal-spice text-white text-xs font-sans font-bold px-2 py-1 rounded">ÉTAPE {step + 1}/{steps.length}</span>
              {current.title}
              {current.multiple && <span className="text-xs text-gray-400 font-sans">(plusieurs choix possibles)</span>}
              {!current.required && <span className="text-xs text-gray-400 font-sans">(optionnel)</span>}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {current.choices.map((choice, ci) => {
                const isSelected = (sel[current.title] ?? []).includes(ci);
                const price = choice.price ? euro(item.price + choice.price) : euro(item.price);
                return (
                  <button
                    key={`${choice.label}-${ci}`}
                    onClick={() => setSel(pick(sel, current, ci))}
                    className={`p-4 rounded-lg border text-left transition-all duration-200 flex justify-between items-center group ${
                      isSelected ? 'bg-bengal-gold text-bengal-dark border-bengal-gold shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-bengal-card/50 border-white/10 text-gray-300 hover:border-bengal-gold/50 hover:bg-bengal-card'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold">{choice.label}</span>
                      <span className={`text-xs mt-1 lowercase ${isSelected ? 'text-bengal-dark/80 font-bold' : 'text-bengal-gold'}`}>
                        {choice.price ? `${price} (+${euro(choice.price)})` : /viande/i.test(current.title) ? price : ''}
                      </span>
                    </div>
                    {isSelected && <Check size={18} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 bg-bengal-card border-t border-orange-900/30 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {step > 0 ? (
              <button onClick={() => setStep((s) => s - 1)} className="px-4 py-2 text-gray-400 hover:text-white font-bold uppercase text-sm tracking-wider">Retour</button>
            ) : <span />}
            <span className="text-bengal-gold font-serif text-xl">{euro(total)}</span>
          </div>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!stepValid} className={`px-8 py-3 rounded bg-white/10 border border-white/20 text-white font-bold uppercase tracking-wider flex items-center transition-all ${stepValid ? 'hover:bg-bengal-gold hover:text-bengal-dark hover:border-bengal-gold' : 'opacity-50 cursor-not-allowed'}`}>
              Suivant <ChevronRight size={16} className="ml-2" />
            </button>
          ) : (
            <button
              onClick={(ev) => allValid && onConfirm(item, { unitPrice: total, detail: selectionDetail(steps, sel) }, ev.currentTarget)}
              disabled={!allValid}
              className={`px-8 py-3 rounded bg-gradient-to-r from-bengal-gold to-orange-600 text-white font-bold uppercase tracking-wider shadow-lg transition-all ${allValid ? 'hover:brightness-110 hover:scale-105' : 'opacity-50 cursor-not-allowed'}`}
            >
              Ajouter au panier
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuComposer;
