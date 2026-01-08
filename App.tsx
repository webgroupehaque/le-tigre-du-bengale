import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import Home from './pages/Home';
import Order from './pages/Order';
import Contact from './pages/Contact';
import { PageView, CartItem } from './types';

function App() {
  const [activePage, setActivePage] = useState<PageView>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <Home setPage={setActivePage} />;
      case 'order':
        return <Order addToCart={addToCart} />;
      case 'contact':
        return <Contact />;
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