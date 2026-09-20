import React, { useState } from 'react';
import { legalPages, useCart, useRestaurant } from '@kit';
import { useSiteContent } from '../lib/content';
import { PageView } from '../types';

/**
 * Pages légales (mentions, confidentialité, conditions de vente).
 * Les textes sont produits par le kit à partir des réglages et des contenus
 * saisis dans l'app Rekvo : rien n'est écrit en dur ici.
 */
type Doc = 'mentions' | 'confidentialite' | 'cgv';
const CHEMINS: Record<Doc, string> = { mentions: '/mentions-legales', confidentialite: '/confidentialite', cgv: '/cgv' };
const ONGLETS: [Doc, string][] = [['mentions', 'Mentions légales'], ['confidentialite', 'Confidentialité'], ['cgv', 'Conditions de vente']];

export function docFromPath(pathname = window.location.pathname): Doc | null {
  const found = (Object.entries(CHEMINS) as [Doc, string][]).find(([, p]) => p === pathname);
  return found ? found[0] : null;
}

const Legal: React.FC<{ doc?: Doc | null; setPage: (p: PageView) => void }> = ({ doc, setPage }) => {
  const [actif, setActif] = useState<Doc>(doc ?? 'mentions');
  const { settings } = useCart();
  const restaurant = useRestaurant();
  const { values } = useSiteContent();
  const page = legalPages(restaurant, settings, values)[actif];

  const ouvrir = (d: Doc) => {
    setActif(d);
    window.history.pushState(null, '', CHEMINS[d]);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="bg-bengal-dark min-h-screen pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-3xl">
        <button onClick={() => { window.history.pushState(null, '', '/'); setPage('home'); }} className="text-bengal-gold/80 hover:text-bengal-gold text-sm mb-8 inline-block">
          ← Retour à l'accueil
        </button>
        <div className="flex flex-wrap gap-2 mb-10">
          {ONGLETS.map(([d, libelle]) => (
            <button
              key={d}
              onClick={() => ouvrir(d)}
              className={`px-4 py-2 rounded-full text-sm transition ${actif === d ? 'bg-bengal-gold text-bengal-dark font-semibold' : 'border border-bengal-gold/30 text-bengal-cream/80 hover:border-bengal-gold'}`}
            >
              {libelle}
            </button>
          ))}
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-bengal-gold mb-8">{page.title}</h1>
        {page.sections.map((s) => (
          <section key={s.title} className="mb-8">
            <h2 className="font-serif text-xl text-bengal-cream mb-3">{s.title}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} className={`text-sm leading-relaxed mb-2 ${p.includes('[à compléter') ? 'text-bengal-spice' : 'text-gray-400'}`}>{p}</p>
            ))}
          </section>
        ))}
        <p className="text-gray-600 text-xs mt-10">Modèles fournis par Rekvo, à faire relire : ce n'est pas un conseil juridique.</p>
      </div>
    </div>
  );
};

export default Legal;
