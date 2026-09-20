import React, { useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider, useCart } from '@kit';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import { CheckoutForm } from './components/CheckoutForm';
import PaymentResult from './components/PaymentResult';
import Announcement from './components/Announcement';
import Home from './pages/Home';
import Order from './pages/Order';
import Contact from './pages/Contact';
import Legal, { docFromPath } from './pages/Legal';
import { PageView } from './types';
import { ContentProvider, useSiteContent } from './lib/content';

/** Panier et tunnel n'existent que si la commande est activée dans le CMS. */
const Ordering: React.FC = () => {
  const { ordering } = useCart();
  if (!ordering.enabled) return null;
  return (
    <>
      <CartSidebar />
      <CheckoutForm />
    </>
  );
};

const Footer: React.FC<{ setPage: (p: PageView) => void }> = ({ setPage }) => {
  const { settings } = useCart();
  const { c } = useSiteContent();
  return (
    <footer className="bg-black py-8 border-t border-gray-900 mt-auto">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-xl font-serif text-bengal-gold mb-2">Le Tigre du Bengale</h2>
        {c('footer.tagline') && <p className="text-gray-400 text-sm mb-1">{c('footer.tagline')}</p>}
        <p className="text-gray-600 text-sm">© {new Date().getFullYear()} Le Tigre du Bengale{settings.address ? ` - ${settings.address}` : ''}</p>
        {settings.legalCompany && <p className="text-gray-700 text-xs mt-2">{settings.legalCompany}{settings.legalSiret ? ` · SIRET ${settings.legalSiret}` : ''}</p>}
        <nav className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-500">
          {([['Mentions légales', '/mentions-legales'], ['Confidentialité', '/confidentialite'], ['Conditions de vente', '/cgv']] as [string, string][]).map(([libelle, chemin]) => (
            <a
              key={chemin}
              href={chemin}
              onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', chemin); setPage('legal'); window.scrollTo({ top: 0 }); }}
              className="hover:text-bengal-gold"
            >
              {libelle}
            </a>
          ))}
        </nav>
        <p className="text-gray-700 text-xs mt-2">Site réalisé par <a href="https://rekvo.agency" target="_blank" rel="noreferrer" className="hover:text-bengal-gold">Rekvo</a></p>
      </div>
    </footer>
  );
};

function App() {
  // Ouverture directe sur /mentions-legales, /confidentialite ou /cgv.
  const [activePage, setActivePage] = useState<PageView>(docFromPath() ? 'legal' : 'home');

  const renderPage = () => {
    switch (activePage) {
      case 'order':
        return <Order />;
      case 'contact':
        return <Contact />;
      case 'legal':
        return <Legal doc={docFromPath()} setPage={setActivePage} />;
      default:
        return <Home setPage={setActivePage} />;
    }
  };

  return (
    <HelmetProvider>
      <CartProvider flyColor="#F59E0B">
        <ContentProvider>
          <div className="min-h-screen bg-bengal-dark text-slate-100 font-sans selection:bg-bengal-spice selection:text-white overflow-x-hidden flex flex-col">
            <Announcement />
            <Navbar activePage={activePage} setActivePage={setActivePage} />
            <main className="fade-in-page">{renderPage()}</main>
            <Ordering />
            <PaymentResult />
            <Footer setPage={setActivePage} />
          </div>
        </ContentProvider>
      </CartProvider>
    </HelmetProvider>
  );
}

export default App;
