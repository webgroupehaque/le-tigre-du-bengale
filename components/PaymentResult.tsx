import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { fetchReceipt, readPaymentResult, readPaymentSession, useCart, type OrderReceipt } from '@kit';

/** Bandeau au retour de Stripe (?paiement=reussi | annule). Le panier n'est vidé qu'en cas de succès. */
const PaymentResult: React.FC = () => {
  const { clear } = useCart();
  const [status, setStatus] = useState<'reussi' | 'annule' | null>(null);
  // Le code de commande, affiché tout de suite : le client n'attend pas son e-mail.
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

  useEffect(() => {
    const session = readPaymentSession();
    const p = readPaymentResult();
    if (!p) return;
    setStatus(p);
    if (p === 'reussi') {
      clear();
      if (session) fetchReceipt(session).then(setReceipt);
    }
  }, [clear]);

  if (!status) return null;
  const ok = status === 'reussi';
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setStatus(null)} />
      <div className="relative max-w-md w-full bg-bengal-card p-8 rounded-lg border border-orange-900/30 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${ok ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          {ok ? <Check className="text-green-500" size={48} /> : <X className="text-red-500" size={48} />}
        </div>
        <h1 className="text-3xl font-serif text-bengal-gold mb-4">{ok ? 'Commande confirmée !' : 'Paiement annulé'}</h1>
        <p className="text-gray-300 mb-6">
          {ok
            ? 'Votre paiement a été effectué avec succès. Vous recevrez un e-mail de confirmation avec votre code de commande. Le restaurant a été notifié et prépare votre commande.'
            : 'Aucun montant n’a été débité. Votre panier est conservé, vous pouvez reprendre votre commande.'}
        </p>
        {ok && receipt ? (
          <div className="mb-6 rounded-lg border border-current/25 px-5 py-4 opacity-95">
            <p className="text-xs uppercase tracking-[0.2em] opacity-60">Votre code de commande</p>
            <p className="my-1 text-3xl font-bold tracking-[0.18em]">{receipt.code}</p>
            <p className="text-xs opacity-60">
              {receipt.orderType === 'delivery' ? `Livraison estimée dans ${receipt.eta} minutes environ` : `Prête dans ${receipt.eta} minutes environ`}
            </p>
          </div>
        ) : null}
        <button onClick={() => setStatus(null)} className="w-full py-3 bg-gradient-to-r from-bengal-gold to-orange-600 text-white font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] rounded-lg">
          {ok ? "Retour à l'accueil" : 'Fermer'}
        </button>
      </div>
    </div>
  );
};

export default PaymentResult;
