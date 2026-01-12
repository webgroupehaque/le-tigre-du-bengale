import React from 'react';
import { RESTAURANT_DATA } from '../constants';
import { MapPin, Phone, Clock } from 'lucide-react';
import SEO from '../components/SEO';

const Contact: React.FC = () => {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(RESTAURANT_DATA.address + ", France")}&output=embed`;

  return (
    <>
      <SEO 
        title="Contact - Le Tigre du Bengale Nancy | Réservation Restaurant Indien"
        description="Contactez le restaurant indien Le Tigre du Bengale à Nancy. Téléphone, adresse, horaires. Réservation en ligne disponible."
        keywords="contact restaurant indien nancy, horaires restaurant indien nancy, adresse restaurant indien nancy"
        url="https://tigre-du-bengale.netlify.app/contact"
      />
      <div className="min-h-screen pt-24 pb-12 bg-bengal-dark">
      <div className="container mx-auto px-4 md:px-8">
        <header className="text-center mb-16">
          <span className="text-bengal-gold uppercase tracking-widest text-sm font-bold">Localisation & Horaires</span>
          <h2 className="text-4xl md:text-6xl font-serif text-white mt-2 drop-shadow-md">Contactez-nous</h2>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Info Section */}
          <div className="space-y-8">
            
            {/* Address */}
            <div className="flex items-start space-x-6 group p-6 rounded-xl border border-transparent hover:bg-bengal-card/50 transition-all duration-300">
              <div className="p-4 bg-bengal-card rounded-full group-hover:bg-bengal-gold transition-colors duration-300 shadow-lg border border-orange-900/20">
                <MapPin className="text-bengal-gold group-hover:text-bengal-dark" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-white mb-2 group-hover:text-bengal-gold transition-colors">Notre Adresse</h3>
                <p className="text-bengal-cream leading-relaxed text-lg">
                  {RESTAURANT_DATA.address}
                </p>
                <p className="text-gray-500 mt-2 text-sm italic">Facile d'accès au centre de Nancy</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start space-x-6 group p-6 rounded-xl border border-transparent hover:bg-bengal-card/50 transition-all duration-300">
              <div className="p-4 bg-bengal-card rounded-full group-hover:bg-bengal-gold transition-colors duration-300 shadow-lg border border-orange-900/20">
                <Phone className="text-bengal-gold group-hover:text-bengal-dark" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-white mb-2 group-hover:text-bengal-gold transition-colors">Téléphone</h3>
                <p className="text-bengal-cream text-lg font-bold">
                  {RESTAURANT_DATA.phone}
                </p>
                <p className="text-gray-500 mt-2 text-sm italic">Réservations & Commandes</p>
              </div>
            </div>

             {/* Hours */}
             <div className="flex items-start space-x-6 group p-6 rounded-xl border border-transparent hover:bg-bengal-card/50 transition-all duration-300">
              <div className="p-4 bg-bengal-card rounded-full group-hover:bg-bengal-gold transition-colors duration-300 shadow-lg border border-orange-900/20">
                <Clock className="text-bengal-gold group-hover:text-bengal-dark" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-white mb-2 group-hover:text-bengal-gold transition-colors">Horaires d'Ouverture</h3>
                <div className="text-bengal-cream text-lg space-y-2">
                   <p className="flex justify-between w-full max-w-[300px] border-b border-gray-800 pb-1">
                     <span className="text-bengal-gold font-bold">Midi</span> 
                     <span>{RESTAURANT_DATA.hours.lunch}</span>
                   </p>
                   <p className="flex justify-between w-full max-w-[300px]">
                     <span className="text-bengal-gold font-bold">Soir</span> 
                     <span>{RESTAURANT_DATA.hours.dinner}</span>
                   </p>
                   <p className="text-gray-500 text-sm mt-3 flex items-center">
                     <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Ouvert 7j/7
                   </p>
                </div>
              </div>
            </div>

          </div>

          {/* Map Section */}
          <div className="h-[500px] w-full bg-bengal-card rounded-2xl overflow-hidden shadow-2xl border-4 border-bengal-card relative group">
            <iframe 
              width="100%" 
              height="100%" 
              style={{ border: 0, filter: 'grayscale(0.3) contrast(1.1) sepia(0.2)' }} 
              loading="lazy" 
              allowFullScreen 
              referrerPolicy="no-referrer-when-downgrade" 
              src={mapSrc}
              title="Le Tigre du Bengale Map"
              className="group-hover:grayscale-0 transition-all duration-500"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Contact;