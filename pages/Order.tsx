import React, { useState } from 'react';
import { CartItem, MenuItem } from '../types';
import { MENU_CATEGORIES, MENU_ITEMS } from '../constants';
import { ShoppingBag, Edit3 } from 'lucide-react';
import MenuComposer from '../components/MenuComposer';
import SEO from '../components/SEO';

interface OrderProps {
  addToCart: (item: any) => void;
}

const Order: React.FC<OrderProps> = ({ addToCart }) => {
  const [activeCategory, setActiveCategory] = useState(MENU_CATEGORIES[0]);
  const [composingItem, setComposingItem] = useState<MenuItem | null>(null);

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const element = document.getElementById(`cat-${category}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.pageYOffset - 150;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (item: MenuItem, selectedOptions?: { [key: string]: string }) => {
      addToCart({ ...item, quantity: 1, selectedOptions });
  };

  return (
    <>
      <SEO 
        title="Commander en Ligne - Restaurant Indien Le Tigre du Bengale Nancy"
        description="Commandez vos plats indiens préférés en ligne : tandoori, curry, biryani, naan. Livraison rapide à Nancy. Menu complet disponible."
        keywords="commander indien nancy, livraison indien nancy, menu indien nancy, plats indiens nancy"
        url="https://tigre-du-bengale.netlify.app/order"
      />
      <div className="min-h-screen pt-28 pb-20 bg-bengal-dark pattern-bg">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation (Sticky) */}
          <aside className="lg:w-1/4">
            <div className="sticky top-24 bg-bengal-card/90 backdrop-blur-md border border-orange-900/30 rounded-xl shadow-xl overflow-hidden">
              <div className="p-4 bg-bengal-dark border-b border-orange-900/30">
                <h3 className="font-serif text-xl text-bengal-gold">La Carte</h3>
              </div>
              <nav className="p-2 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <ul className="space-y-1">
                  {MENU_CATEGORIES.map((cat) => (
                    <li key={cat}>
                      <button
                        onClick={() => scrollToCategory(cat)}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                          activeCategory === cat 
                            ? 'bg-bengal-spice text-white shadow-lg translate-x-1' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {cat}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Main Menu Content */}
          <div className="lg:w-3/4 space-y-16">
            {MENU_CATEGORIES.map((category) => {
              const items = MENU_ITEMS.filter(item => item.category === category);
              if (items.length === 0) return null;

              return (
                <section key={category} id={`cat-${category}`} className="scroll-mt-32">
                  <div className="flex items-center mb-8">
                    <div className="h-px bg-gradient-to-r from-transparent via-bengal-gold to-transparent flex-1 opacity-50"></div>
                    <h2 className="text-3xl md:text-4xl font-serif text-white px-6 drop-shadow-sm text-center">
                      {category}
                    </h2>
                    <div className="h-px bg-gradient-to-r from-transparent via-bengal-gold to-transparent flex-1 opacity-50"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {items.map((item) => (
                      <div key={item.id} className="bg-bengal-card rounded-xl overflow-hidden border border-orange-900/10 hover:border-bengal-gold/40 transition-all duration-300 group shadow-lg flex flex-col">
                        
                        {/* Image Area */}
                        <div className="h-48 bg-bengal-dark relative overflow-hidden group-hover:opacity-90 transition-opacity">
                          <img
                            src={item.image}
                            alt={`${item.name} - Plat indien authentique au restaurant Le Tigre du Bengale Nancy`}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>

                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-white group-hover:text-bengal-gold transition-colors font-serif leading-tight">
                              {item.name}
                            </h3>
                            <span className="text-bengal-gold font-bold text-lg whitespace-nowrap ml-3">
                              {item.price.toFixed(2)} €
                            </span>
                          </div>
                          
                          <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                            {item.description}
                          </p>

                          {item.options ? (
                             <button 
                                onClick={() => setComposingItem(item)}
                                className="w-full py-3 bg-gradient-to-r from-bengal-gold/20 to-bengal-spice/20 border border-bengal-gold text-bengal-gold text-sm uppercase font-bold rounded hover:bg-bengal-gold hover:text-bengal-dark transition-all flex items-center justify-center space-x-2"
                              >
                                <Edit3 size={16} />
                                <span>Composer</span>
                              </button>
                          ) : (
                              <button 
                                onClick={() => handleAddToCart(item)}
                                className="w-full py-3 bg-white/5 border border-bengal-gold/30 text-bengal-gold text-sm uppercase font-bold rounded hover:bg-bengal-gold hover:text-bengal-dark transition-all flex items-center justify-center space-x-2 group-hover:bg-bengal-gold/10"
                              >
                                <ShoppingBag size={16} />
                                <span>Ajouter</span>
                              </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Disclaimer */}
            <div className="text-center text-gray-500 text-sm italic mt-12 pb-8 border-t border-gray-800 pt-8">
              <p>Viandes Halal. Les chèques ne sont pas acceptés.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Composer Modal */}
      {composingItem && (
        <MenuComposer 
          item={composingItem}
          isOpen={true}
          onClose={() => setComposingItem(null)}
          onConfirm={handleAddToCart}
        />
      )}
    </div>
    </>
  );
};

export default Order;