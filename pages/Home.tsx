import React from 'react';
import { MapPin, Clock, Utensils } from 'lucide-react';
import { useCart } from '@kit';
import { PageView } from '../types';
import SEO from '../components/SEO';
import { useSiteContent } from '../lib/content';

interface HomeProps {
  setPage: (page: PageView) => void;
}

const Home: React.FC<HomeProps> = ({ setPage }) => {
  const { settings, ordering } = useCart();
  const { c } = useSiteContent();
  return (
    <>
      <SEO />
      <div className="w-full flex flex-col">
        <section className="relative h-screen min-h-[600px] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src={c('hero.image')} alt="Restaurant indien Le Tigre du Bengale" className="w-full h-full object-cover scale-105 animate-pulse-slow" />
            <div className="absolute inset-0 bg-gradient-to-t from-bengal-dark via-bengal-dark/60 to-orange-900/30"></div>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          <div className="relative z-10 text-center px-6 max-w-5xl mx-auto mt-16">
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-4 leading-tight animate-fade-in-up drop-shadow-xl">
              {c('hero.line1')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bengal-gold via-orange-400 to-bengal-spice">{c('hero.line2')}</span>
            </h1>
            <p className="text-bengal-cream text-lg md:text-2xl font-light mb-2 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-100 drop-shadow-md">{c('hero.subtitle')}</p>
            <p className="text-bengal-gold text-base md:text-xl italic mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-150 drop-shadow-md">{c('hero.tagline')}</p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 animate-fade-in-up delay-200">
              <button onClick={() => setPage('order')} className="px-10 py-4 bg-bengal-gold text-bengal-dark font-bold uppercase tracking-wider hover:bg-white hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                {ordering.enabled ? 'Commander' : 'Voir la carte'}
              </button>
              <button onClick={() => setPage('contact')} className="px-10 py-4 border-2 border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-bengal-dark transition-all duration-300 bg-black/30 backdrop-blur-sm">
                Nous trouver
              </button>
            </div>
          </div>
        </section>

        <section className="bg-bengal-dark border-y border-orange-900/30 py-10 relative z-20 shadow-2xl">
          <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center group cursor-default">
              <div className="p-3 rounded-full bg-bengal-card mb-4 group-hover:bg-bengal-gold transition-colors duration-500">
                <Clock className="text-bengal-gold group-hover:text-bengal-dark" size={28} />
              </div>
              <h3 className="text-white font-serif text-xl mb-1">Horaires</h3>
              {c('info.hours_note') && <p className="text-gray-400">{c('info.hours_note')}</p>}
              {settings.hours.map((h, i) => (
                <p key={i} className="text-bengal-gold font-bold mt-1">
                  {h.days !== 'Tous les jours' ? <span className="text-gray-400 font-normal">{h.days} · </span> : null}
                  {h.slots}
                </p>
              ))}
            </div>

            <div className="flex flex-col items-center border-t md:border-t-0 md:border-l md:border-r border-orange-900/30 pt-8 md:pt-0 group cursor-pointer" onClick={() => setPage('contact')}>
              <div className="p-3 rounded-full bg-bengal-card mb-4 group-hover:bg-bengal-gold transition-colors duration-500">
                <MapPin className="text-bengal-gold group-hover:text-bengal-dark" size={28} />
              </div>
              <h3 className="text-white font-serif text-xl mb-1">Adresse</h3>
              <p className="text-gray-400 max-w-[200px] mb-2">{settings.address}</p>
              <span className="text-bengal-spice text-sm uppercase tracking-wider font-bold group-hover:underline">Voir le plan</span>
            </div>

            <div className="flex flex-col items-center pt-8 md:pt-0 group cursor-pointer" onClick={() => setPage('order')}>
              <div className="p-3 rounded-full bg-bengal-card mb-4 group-hover:bg-bengal-gold transition-colors duration-500">
                <Utensils className="text-bengal-gold group-hover:text-bengal-dark" size={28} />
              </div>
              <h3 className="text-white font-serif text-xl mb-1">{ordering.enabled ? 'Commander' : 'Notre carte'}</h3>
              <p className="text-gray-400 mb-2">
                {ordering.enabled
                  ? [ordering.modes.includes('delivery') ? 'Livraison' : null, ordering.modes.includes('pickup') ? 'À emporter' : null].filter(Boolean).join(' & ') || c('info.order_note')
                  : 'Sur place'}
              </p>
              <span className="text-bengal-spice text-sm uppercase tracking-wider font-bold group-hover:underline">Découvrir le Menu</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
