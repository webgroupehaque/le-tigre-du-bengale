import React from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';
import { useCart } from '@kit';
import SEO from '../components/SEO';
import { useSiteContent } from '../lib/content';

const Contact: React.FC = () => {
  const { settings } = useCart();
  const { c } = useSiteContent();
  const mapSrc = settings.address ? `https://www.google.com/maps?q=${encodeURIComponent(settings.address + ', France')}&output=embed` : null;

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
            <div className="space-y-8">
              {settings.address && (
                <div className="flex items-start space-x-6 group p-6 rounded-xl border border-transparent hover:bg-bengal-card/50 transition-all duration-300">
                  <div className="p-4 bg-bengal-card rounded-full group-hover:bg-bengal-gold transition-colors duration-300 shadow-lg border border-orange-900/20">
                    <MapPin className="text-bengal-gold group-hover:text-bengal-dark" size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif text-white mb-2 group-hover:text-bengal-gold transition-colors">Notre Adresse</h3>
                    <p className="text-bengal-cream leading-relaxed text-lg">{settings.address}</p>
                    {c('contact.address_note') && <p className="text-gray-500 mt-2 text-sm italic">{c('contact.address_note')}</p>}
                  </div>
                </div>
              )}

              {settings.phone && (
                <div className="flex items-start space-x-6 group p-6 rounded-xl border border-transparent hover:bg-bengal-card/50 transition-all duration-300">
                  <div className="p-4 bg-bengal-card rounded-full group-hover:bg-bengal-gold transition-colors duration-300 shadow-lg border border-orange-900/20">
                    <Phone className="text-bengal-gold group-hover:text-bengal-dark" size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif text-white mb-2 group-hover:text-bengal-gold transition-colors">Téléphone</h3>
                    <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="text-bengal-cream text-lg font-bold hover:text-bengal-gold">{settings.phone}</a>
                    {c('contact.phone_note') && <p className="text-gray-500 mt-2 text-sm italic">{c('contact.phone_note')}</p>}
                  </div>
                </div>
              )}

              {settings.hours.length > 0 && (
                <div className="flex items-start space-x-6 group p-6 rounded-xl border border-transparent hover:bg-bengal-card/50 transition-all duration-300">
                  <div className="p-4 bg-bengal-card rounded-full group-hover:bg-bengal-gold transition-colors duration-300 shadow-lg border border-orange-900/20">
                    <Clock className="text-bengal-gold group-hover:text-bengal-dark" size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif text-white mb-2 group-hover:text-bengal-gold transition-colors">Horaires d'Ouverture</h3>
                    <div className="text-bengal-cream text-lg space-y-2">
                      {settings.hours.map((h, i) => (
                        <p key={i} className="flex justify-between gap-6 w-full max-w-[340px] border-b border-gray-800 pb-1 last:border-0">
                          <span className="text-bengal-gold font-bold">{h.days}</span>
                          <span>{h.slots}</span>
                        </p>
                      ))}
                      {c('info.hours_note') && (
                        <p className="text-gray-500 text-sm mt-3 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> {c('info.hours_note')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {mapSrc && (
              <div className="h-[500px] w-full bg-bengal-card rounded-2xl overflow-hidden shadow-2xl border-4 border-bengal-card relative group">
                <iframe width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.3) contrast(1.1) sepia(0.2)' }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" src={mapSrc} title="Le Tigre du Bengale sur la carte" className="group-hover:grayscale-0 transition-all duration-500"></iframe>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
