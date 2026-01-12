import React from 'react';
import { ChevronRight, MapPin, Clock, Utensils } from 'lucide-react';
import { PageView } from '../types';
import { RESTAURANT_DATA } from '../constants';
import SEO from '../components/SEO';

interface HomeProps {
  setPage: (page: PageView) => void;
}

const Home: React.FC<HomeProps> = ({ setPage }) => {
  return (
    <>
      <SEO />
      <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] w-full flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay - Appetizing Indian Food */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1585937421612-70a008356f36?q=80&w=2070&auto=format&fit=crop" 
            alt="Restaurant indien Le Tigre du Bengale" 
            className="w-full h-full object-cover scale-105 animate-pulse-slow"
          />
          {/* Warm Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-bengal-dark via-bengal-dark/60 to-orange-900/30"></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto mt-16">
          <span className="text-bengal-gold tracking-[0.3em] uppercase text-sm md:text-base font-bold mb-4 block animate-fade-in drop-shadow-md">
            Restaurant Indien Semi-Gastronomique
          </span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-9xl text-white mb-6 leading-tight animate-fade-in-up drop-shadow-xl">
            Restaurant Indien à Nancy
            <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-bengal-gold via-orange-400 to-bengal-spice">
              Le Tigre du Bengale
            </span>
          </h1>
          <p className="text-bengal-cream text-lg md:text-2xl font-light mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-100 drop-shadow-md">
            Cuisine indienne authentique • Commande en ligne • Livraison rapide à Nancy
            <br/><span className="italic text-bengal-gold">Une cuisine riche, chaleureuse et authentique.</span>
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 animate-fade-in-up delay-200">
            <button 
              onClick={() => setPage('order')}
              className="px-10 py-4 bg-bengal-gold text-bengal-dark font-bold uppercase tracking-wider hover:bg-white hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              Voir la Carte
            </button>
            <button 
              onClick={() => setPage('contact')}
              className="px-10 py-4 border-2 border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-bengal-dark transition-all duration-300 bg-black/30 backdrop-blur-sm"
            >
              Nous trouver
            </button>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="bg-bengal-dark border-y border-orange-900/30 py-10 relative z-20 shadow-2xl">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center group cursor-default">
            <div className="p-3 rounded-full bg-bengal-card mb-4 group-hover:bg-bengal-gold transition-colors duration-500">
              <Clock className="text-bengal-gold group-hover:text-bengal-dark" size={28} />
            </div>
            <h3 className="text-white font-serif text-xl mb-1">Horaires</h3>
            <p className="text-gray-400">Ouvert 7j/7</p>
            <p className="text-bengal-gold font-bold mt-1">{RESTAURANT_DATA.hours.lunch}</p>
            <p className="text-bengal-gold font-bold">{RESTAURANT_DATA.hours.dinner}</p>
          </div>
          
          <div className="flex flex-col items-center border-t md:border-t-0 md:border-l md:border-r border-orange-900/30 pt-8 md:pt-0 group cursor-pointer" onClick={() => setPage('contact')}>
             <div className="p-3 rounded-full bg-bengal-card mb-4 group-hover:bg-bengal-gold transition-colors duration-500">
                <MapPin className="text-bengal-gold group-hover:text-bengal-dark" size={28} />
             </div>
             <h3 className="text-white font-serif text-xl mb-1">Adresse</h3>
             <p className="text-gray-400 max-w-[200px] mb-2">{RESTAURANT_DATA.address}</p>
             <span className="text-bengal-spice text-sm uppercase tracking-wider font-bold group-hover:underline">Voir le plan</span>
          </div>
          
          <div className="flex flex-col items-center pt-8 md:pt-0 group cursor-pointer" onClick={() => setPage('order')}>
             <div className="p-3 rounded-full bg-bengal-card mb-4 group-hover:bg-bengal-gold transition-colors duration-500">
                <Utensils className="text-bengal-gold group-hover:text-bengal-dark" size={28} />
             </div>
             <h3 className="text-white font-serif text-xl mb-1">Commander</h3>
             <p className="text-gray-400 mb-2">Livraison & A Emporter</p>
             <span className="text-bengal-spice text-sm uppercase tracking-wider font-bold group-hover:underline">Découvrir le Menu</span>
          </div>
        </div>
      </section>

      {/* SEO Section */}
      <section className="py-16 px-4 bg-bengal-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-8 text-white">
            Votre Restaurant Indien de Confiance à Nancy
          </h2>
          <p className="text-lg md:text-xl text-gray-300 text-center leading-relaxed">
            Découvrez les saveurs authentiques de l'Inde au cœur de Nancy. 
            Le Tigre du Bengale vous propose une cuisine indienne traditionnelle : 
            tandoori, curry, biryani, naan fraîchement préparés. 
            Commandez en ligne et profitez d'une livraison rapide dans tout Nancy.
          </p>
        </div>
      </section>
    </div>
    </>
  );
};

export default Home;