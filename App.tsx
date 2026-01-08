import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import { CheckoutForm, CustomerInfo } from './components/CheckoutForm';
import Home from './pages/Home';
import Order from './pages/Order';
import Contact from './pages/Contact';
import Success from './pages/Success';
import { PageView, CartItem } from './types';

function App() {
  const [activePage, setActivePage] = useState<PageView>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Détecter l'URL et changer la page automatiquement
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/success') {
      setActivePage('success');
    }
  }, []);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, item];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
     setCart((prevCart) => prevCart.filter(item => item.id !== id));
  };

  const handleCheckoutSubmit = async (customerInfo: CustomerInfo) => {
    try {
      // Calculer le total
      const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const deliveryFee = 2.50;
      const totalAmount = cartTotal + deliveryFee;

      // Appeler la fonction Netlify pour créer la session Stripe
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart,
          customerInfo,
          totalAmount,
          restaurantId: 'tigre-bengale',
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.url;
      } else {
        alert('Erreur lors de la création de la session de paiement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue');
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <Home setPage={setActivePage} />;
      case 'order':
        return <Order addToCart={addToCart} />;
      case 'contact':
        return <Contact />;
      case 'success':
        return <Success />;
      default:
        return <Home setPage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-bengal-dark text-slate-100 font-sans selection:bg-bengal-spice selection:text-white overflow-x-hidden">
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
        openCart={() => setIsCartOpen(true)}
      />
      
      <main className="fade-in-page">
        {renderPage()}
      </main>

      {/* Global Cart Sidebar */}
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Form */}
      <CheckoutForm
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        totalAmount={cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) + 2.50}
        onSubmit={handleCheckoutSubmit}
      />

      {/* Simple Footer */}
      <footer className="bg-black py-8 border-t border-gray-900 mt-auto">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-xl font-serif text-bengal-gold mb-2">Le Tigre du Bengale</h2>
          <p className="text-gray-600 text-sm">© 2024 - 19 Rue des Maréchaux, Nancy</p>
        </div>
      </footer>
    </div>
  );
}

export default App;