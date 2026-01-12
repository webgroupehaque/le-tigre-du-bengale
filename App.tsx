import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import { CheckoutForm, CustomerInfo } from './components/CheckoutForm';
import Home from './pages/Home';
import Order from './pages/Order';
import Contact from './pages/Contact';
import Success from './pages/Success';
import { PageView, CartItem, OrderType } from './types';

function App() {
  const [activePage, setActivePage] = useState<PageView>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('delivery');

  // Détecter l'URL et changer la page automatiquement
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/success') {
      setActivePage('success');
    }
  }, []);

  // Helper function to generate a unique identifier for cart items (ID + options)
  const getCartItemKey = (item: CartItem): string => {
    const optionsKey = item.selectedOptions 
      ? JSON.stringify(item.selectedOptions) 
      : '';
    return `${item.id}::${optionsKey}`;
  };

  // Helper to extract price from option string like "Crevettes (19.90€)"
  // If found, it overrides the base price. If not, returns item.price
  const getItemPrice = (item: CartItem): number => {
    let finalPrice = item.price;
    
    if (item.selectedOptions) {
      Object.values(item.selectedOptions).forEach(optionValue => {
        const val = optionValue as string;
        const match = val.match(/\(([\d.]+)€\)/);
        if (match && match[1]) {
          finalPrice = parseFloat(match[1]);
        }
      });
    }
    return finalPrice;
  };

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const itemKey = getCartItemKey(item);
      const existingItem = prevCart.find((i) => getCartItemKey(i) === itemKey);
      
      if (existingItem) {
        // Same item with same options: increment quantity
        return prevCart.map((i) =>
          getCartItemKey(i) === itemKey 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      // Different item or different options: add as new item
      return [...prevCart, item];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (itemKey: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (getCartItemKey(item) === itemKey) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (itemKey: string) => {
     setCart((prevCart) => prevCart.filter(item => getCartItemKey(item) !== itemKey));
  };

  const handleCheckoutSubmit = async (customerInfo: CustomerInfo, submittedOrderType: OrderType) => {
    try {
      // Calculer le total avec getItemPrice pour prendre en compte les suppléments
      const cartTotal = cart.reduce((acc, item) => acc + (getItemPrice(item) * item.quantity), 0);
      const deliveryFee = submittedOrderType === 'delivery' ? 2.50 : 0;
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
          orderType: submittedOrderType,
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
    <HelmetProvider>
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
          orderType={orderType}
          setOrderType={setOrderType}
        />

        {/* Checkout Form */}
        <CheckoutForm
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cartItems={cart}
          totalAmount={cart.reduce((acc, item) => acc + (getItemPrice(item) * item.quantity), 0) + (orderType === 'delivery' ? 2.50 : 0)}
          onSubmit={handleCheckoutSubmit}
          orderType={orderType}
        />

        {/* Simple Footer */}
        <footer className="bg-black py-8 border-t border-gray-900 mt-auto">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-xl font-serif text-bengal-gold mb-2">Le Tigre du Bengale</h2>
            <p className="text-gray-600 text-sm">© 2024 - 19 Rue des Maréchaux, Nancy</p>
          </div>
        </footer>
      </div>
    </HelmetProvider>
  );
}

export default App;