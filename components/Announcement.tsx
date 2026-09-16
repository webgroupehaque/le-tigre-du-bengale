import React from 'react';
import { currentClosure, useCart } from '@kit';

/** Bandeau piloté par le CMS : annonce activée et/ou fermeture exceptionnelle du jour. */
const Announcement: React.FC = () => {
  const { settings } = useCart();
  const closure = currentClosure(settings.closures);
  const announcement = settings.announcementActive && settings.announcement ? settings.announcement : '';
  if (!closure && !announcement) return null;
  return (
    <div role="status" className="fixed top-0 inset-x-0 z-[60] bg-bengal-gold text-bengal-dark text-xs font-bold uppercase tracking-widest text-center px-6 py-2">
      {closure ? (
        <span>
          Fermeture exceptionnelle{closure.label ? ` · ${closure.label}` : ''} jusqu’au {new Date(closure.to || closure.from).toLocaleDateString('fr-FR')}
          {announcement ? ' · ' : ''}
        </span>
      ) : null}
      {announcement ? <span>{announcement}</span> : null}
    </div>
  );
};

export default Announcement;
