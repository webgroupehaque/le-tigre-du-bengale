import React, { useState } from 'react';
import { X } from 'lucide-react';
import { OrderType, CartItem } from '../types';

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
  onSubmit: (customerInfo: CustomerInfo, orderType: OrderType) => void;
  orderType: OrderType;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  isOpen,
  onClose,
  cartItems,
  totalAmount,
  onSubmit,
  orderType,
}) => {
  const [formData, setFormData] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  // Helper to extract price from option string like "Crevettes (19.90€)"
  // If found, it overrides the base price. If not, returns item.price
  const getItemPrice = (item: CartItem): number => {
    let finalPrice = item.price;
    
    if (item.selectedOptions) {
      Object.values(item.selectedOptions).forEach(optionValue => {
        const val = optionValue as string;
        const match = val.match(/\(([\d.]+)€\)/);
        if (match && match[1]) {
          finalPrice = parseFloat(match[1]);
        }
      });
    }
    return finalPrice;
  };

  // Helper function to generate a unique identifier for cart items (ID + options)
  const getCartItemKey = (item: CartItem): string => {
    const optionsKey = item.selectedOptions 
      ? JSON.stringify(item.selectedOptions) 
      : '';
    return `${item.id}::${optionsKey}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {};

    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^[\d\s+()-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }
    if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si à emporter, l'adresse n'est pas obligatoire
    if (orderType === 'pickup') {
      const newErrors: Partial<CustomerInfo> = {};
      if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
      if (!formData.email.trim()) {
        newErrors.email = 'L\'email est requis';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email invalide';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Le téléphone est requis';
      } else if (!/^[\d\s+()-]{10,}$/.test(formData.phone)) {
        newErrors.phone = 'Numéro de téléphone invalide';
      }
      setErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        onSubmit(formData, orderType);
      }
    } else {
      if (validateForm()) {
        onSubmit(formData, orderType);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof CustomerInfo]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] transition-opacity duration-300 flex items-center justify-center p-4"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-bengal-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-900/30 pointer-events-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-bengal-dark border-b border-orange-900/30 p-6 flex justify-between items-center z-10">
            <h2 className="text-2xl font-serif text-bengal-gold">Finaliser la commande</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Cart Summary */}
            <div className="mb-6 p-4 bg-bengal-dark/50 rounded-lg border border-orange-900/20">
              <h3 className="font-semibold text-lg mb-3 text-white">Récapitulatif</h3>
              {cartItems.map((item) => {
                const itemPrice = getItemPrice(item);
                const itemKey = getCartItemKey(item);
                return (
                  <div key={itemKey} className="mb-3 pb-3 border-b border-orange-900/20 last:border-0">
                    <div className="flex justify-between text-sm mb-1 text-gray-300">
                      <span className="font-bold text-white">{item.name} x{item.quantity}</span>
                      <span className="font-medium text-bengal-gold">{(itemPrice * item.quantity).toFixed(2)} €</span>
                    </div>
                    {item.selectedOptions && (
                      <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                        {Object.entries(item.selectedOptions).map(([key, value]) => {
                          const val = value as string;
                          const displayValue = val.replace(/\(([\d.]+)€\)/, '').trim();
                          return (
                            <p key={key}>
                              <span className="text-bengal-spice">{key}:</span> {displayValue || val}
                            </p>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="border-t border-orange-900/30 mt-3 pt-3 flex justify-between font-bold text-lg text-white">
                <span>Total</span>
                <span className="text-bengal-gold">{totalAmount.toFixed(2)} €</span>
              </div>
            </div>

            {/* Customer Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-bengal-dark/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-bengal-gold focus:ring-2 focus:ring-bengal-gold/50 transition-colors ${
                    errors.name ? 'border-red-500/50' : 'border-orange-900/20'
                  }`}
                  placeholder="Jean Dupont"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-bengal-dark/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-bengal-gold focus:ring-2 focus:ring-bengal-gold/50 transition-colors ${
                    errors.email ? 'border-red-500/50' : 'border-orange-900/20'
                  }`}
                  placeholder="jean.dupont@email.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-bengal-dark/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-bengal-gold focus:ring-2 focus:ring-bengal-gold/50 transition-colors ${
                    errors.phone ? 'border-red-500/50' : 'border-orange-900/20'
                  }`}
                  placeholder="06 12 34 56 78"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              {orderType === 'delivery' && (
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-400 mb-1">
                    Adresse de livraison *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-2 bg-bengal-dark/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-bengal-gold focus:ring-2 focus:ring-bengal-gold/50 transition-colors resize-none ${
                      errors.address ? 'border-red-500/50' : 'border-orange-900/20'
                    }`}
                    placeholder="123 Rue de la République, 54000 Nancy"
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-orange-900/30 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-bengal-gold to-orange-600 text-white font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] rounded-lg"
                >
                  Procéder au paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
