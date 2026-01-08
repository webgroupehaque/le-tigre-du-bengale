import React, { useState } from 'react';
import { MenuItem, MenuOption } from '../types';
import { X, Check, ChevronRight } from 'lucide-react';

interface MenuComposerProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: MenuItem, selectedOptions: { [key: string]: string }) => void;
}

const MenuComposer: React.FC<MenuComposerProps> = ({ item, isOpen, onClose, onConfirm }) => {
  const [selections, setSelections] = useState<{ [key: string]: string }>({});
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen || !item.options) return null;

  const steps = item.options;
  const currentOption = steps[currentStep];

  const handleSelect = (choice: string) => {
    setSelections(prev => ({ ...prev, [currentOption.title]: choice }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const isCurrentStepValid = !!selections[currentOption.title];
  const isAllValid = steps.every(step => !!selections[step.title]);

  const handleConfirm = () => {
    if (isAllValid) {
      onConfirm(item, selections);
      setSelections({}); // Reset for next time
      setCurrentStep(0);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-bengal-dark border border-bengal-gold/30 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-orange-900/30 bg-bengal-card flex justify-between items-center">
          <div>
            <h3 className="text-sm text-bengal-gold font-bold uppercase tracking-widest mb-1">Composer votre menu</h3>
            <h2 className="text-2xl font-serif text-white">{item.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            
            {/* Progress Bar */}
            <div className="flex mb-8 space-x-2">
                {steps.map((step, idx) => (
                    <div key={idx} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${idx <= currentStep ? 'bg-bengal-gold' : 'bg-gray-700'}`} />
                ))}
            </div>

            <div className="mb-6">
                <h4 className="text-xl text-white font-serif mb-4 flex items-center">
                    <span className="bg-bengal-spice text-white text-xs font-sans font-bold px-2 py-1 rounded mr-3">ÉTAPE {currentStep + 1}/{steps.length}</span>
                    {currentOption.title}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentOption.choices.map((choice) => {
                        // Extract Name and Price if formatted as "Name (Price)"
                        const match = choice.match(/(.*?)\s*(\(.*\))$/);
                        const displayName = match ? match[1] : choice;
                        const displayPrice = match ? match[2].replace('(', '').replace(')', '') : null;

                        return (
                          <button
                              key={choice}
                              onClick={() => handleSelect(choice)}
                              className={`p-4 rounded-lg border text-left transition-all duration-200 flex justify-between items-center group ${
                                  selections[currentOption.title] === choice
                                  ? 'bg-bengal-gold text-bengal-dark border-bengal-gold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                  : 'bg-bengal-card/50 border-white/10 text-gray-300 hover:border-bengal-gold/50 hover:bg-bengal-card'
                              }`}
                          >
                              <div className="flex flex-col">
                                <span className="font-bold">{displayName}</span>
                                {displayPrice && (
                                  <span className={`text-xs mt-1 lowercase ${selections[currentOption.title] === choice ? 'text-bengal-dark/80 font-bold' : 'text-bengal-gold'}`}>
                                    {displayPrice}
                                  </span>
                                )}
                              </div>
                              {selections[currentOption.title] === choice && <Check size={18} />}
                          </button>
                        );
                    })}
                </div>
            </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-bengal-card border-t border-orange-900/30 flex justify-between items-center">
            {currentStep > 0 ? (
                <button 
                    onClick={handlePrev}
                    className="px-6 py-2 text-gray-400 hover:text-white font-bold uppercase text-sm tracking-wider"
                >
                    Retour
                </button>
            ) : (
                <div></div> // Spacer
            )}

            {currentStep < steps.length - 1 ? (
                <button 
                    onClick={handleNext}
                    disabled={!isCurrentStepValid}
                    className={`px-8 py-3 rounded bg-white/10 border border-white/20 text-white font-bold uppercase tracking-wider flex items-center transition-all ${
                        isCurrentStepValid ? 'hover:bg-bengal-gold hover:text-bengal-dark hover:border-bengal-gold' : 'opacity-50 cursor-not-allowed'
                    }`}
                >
                    Suivant <ChevronRight size={16} className="ml-2" />
                </button>
            ) : (
                <button 
                    onClick={handleConfirm}
                    disabled={!isAllValid}
                    className={`px-8 py-3 rounded bg-gradient-to-r from-bengal-gold to-orange-600 text-white font-bold uppercase tracking-wider shadow-lg transition-all ${
                         isAllValid ? 'hover:brightness-110 hover:scale-105' : 'opacity-50 cursor-not-allowed'
                    }`}
                >
                    Valider le Menu
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default MenuComposer;