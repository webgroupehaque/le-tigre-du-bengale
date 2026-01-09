import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

const Success: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderNumber = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      
      if (sessionId) {
        try {
          // Appeler une fonction Netlify pour récupérer le numéro de commande
          const response = await fetch(`/.netlify/functions/get-order-number?session_id=${sessionId}`);
          const data = await response.json();
          
          if (data.orderNumber) {
            setOrderNumber(data.orderNumber);
          } else {
            setOrderNumber('####'); // Fallback si erreur
          }
        } catch (error) {
          console.error('Error fetching order number:', error);
          setOrderNumber('####');
        }
      }
      setLoading(false);
    };

    fetchOrderNumber();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full bg-bengal-card p-8 rounded-lg border border-orange-900/30 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="text-green-500" size={48} />
        </div>
        
        <h1 className="text-3xl font-serif text-bengal-gold mb-4">
          Commande confirmée !
        </h1>
        
        <p className="text-gray-300 mb-6">
          Votre paiement a été effectué avec succès. Vous recevrez un email de confirmation à l'adresse indiquée.
        </p>
        
        {loading ? (
          <div className="bg-bengal-dark/50 p-4 rounded border border-orange-900/20 mb-6">
            <p className="text-sm text-gray-400 mb-1">Numéro de commande</p>
            <p className="text-xl text-bengal-gold font-bold animate-pulse">
              Chargement...
            </p>
          </div>
        ) : (
          <div className="bg-bengal-dark/50 p-4 rounded border border-orange-900/20 mb-6">
            <p className="text-sm text-gray-400 mb-1">Numéro de commande</p>
            <p className="text-3xl text-bengal-gold font-bold font-mono">
              #{orderNumber}
            </p>
          </div>
        )}

        <p className="text-gray-400 text-sm mb-6">
          Le restaurateur a été notifié de votre commande et la prépare actuellement.
        </p>

        <button
          onClick={() => window.location.href = '/'}
          className="w-full py-3 bg-gradient-to-r from-bengal-gold to-orange-600 text-white font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] rounded-lg"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default Success;
