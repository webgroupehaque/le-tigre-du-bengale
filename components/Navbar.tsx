import React, { useState, useEffect } from 'react';
import { PageView } from '../types';
import { ShoppingBag, Menu, X, Phone } from 'lucide-react';
import { RESTAURANT_DATA } from '../constants';

interface NavbarProps {
  activePage: PageView;
  setActivePage: (page: PageView) => void;
  cartCount: number;
  openCart: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage, cartCount, openCart }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClass = `fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
    isScrolled ? 'bg-bengal-dark/95 backdrop-blur-md shadow-lg py-3 border-b border-orange-900/30' : 'bg-transparent py-6'
  }`;

  const linkClass = (page: PageView) => `
    cursor-pointer text-sm font-bold tracking-widest uppercase transition-colors duration-300
    ${activePage === page ? 'text-bengal-gold' : 'text-bengal-cream hover:text-bengal-gold'}
  `;

  return (
    <nav className={navClass}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Brand */}
        <div 
          onClick={() => setActivePage('home')} 
          className="cursor-pointer flex flex-col items-start group"
        >
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white group-hover:text-bengal-gold transition-colors">
            Le Tigre
          </h1>
          <span className="text-xs text-bengal-gold tracking-[0.2em] uppercase">du Bengale</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-12">
          <span onClick={() => setActivePage('home')} className={linkClass('home')}>Accueil</span>
          <span onClick={() => setActivePage('order')} className={linkClass('order')}>Notre Carte</span>
          <span onClick={() => setActivePage('contact')} className={linkClass('contact')}>Infos & Contact</span>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-6">
          <a href={`tel:${RESTAURANT_DATA.phone}`} className="flex items-center text-bengal-cream hover:text-bengal-gold transition-colors">
            <Phone size={18} className="mr-2" />
            <span className="text-sm font-bold">{RESTAURANT_DATA.phone}</span>
          </a>
          {/* Cart Icon - Toggles Cart Sidebar */}
          <button 
            onClick={openCart}
            className="relative p-2 text-bengal-cream hover:text-bengal-gold transition-colors group"
          >
            <ShoppingBag size={24} className="group-hover:fill-current" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-bengal-spice text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-bengal-dark shadow-xl border-t border-orange-900/50 md:hidden flex flex-col p-6 space-y-6 animate-fade-in-down">
          <span onClick={() => { setActivePage('home'); setIsMobileMenuOpen(false); }} className={linkClass('home')}>Accueil</span>
          <span onClick={() => { setActivePage('order'); setIsMobileMenuOpen(false); }} className={linkClass('order')}>Notre Carte</span>
          <span onClick={() => { setActivePage('contact'); setIsMobileMenuOpen(false); }} className={linkClass('contact')}>Infos & Contact</span>
        </div>
      )}
    </nav>
  );
};

export default Navbar;