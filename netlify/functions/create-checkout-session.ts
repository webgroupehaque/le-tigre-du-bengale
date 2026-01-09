import Stripe from 'stripe';
import { MENU_PRICES, DELIVERY_FEE } from './menu-prices';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const handler = async (event: any) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  try {
    const { cartItems, customerInfo, restaurantId, orderType } = JSON.parse(event.body);

    // Debug logs
    console.log('=== DEBUG CHECKOUT ===');
    console.log('Cart items received:', JSON.stringify(cartItems, null, 2));
    console.log('Available prices:', Object.keys(MENU_PRICES));
    console.log('=====================');

    // Valider que tous les produits existent dans MENU_PRICES
    for (const item of cartItems) {
      if (!MENU_PRICES[item.id]) {
        console.error(`INVALID PRODUCT: ${item.id}`);
        console.error(`Available IDs:`, Object.keys(MENU_PRICES).slice(0, 10));
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: `Produit invalide: ${item.id}. Available IDs: ${Object.keys(MENU_PRICES).slice(0, 5).join(', ')}` 
          }),
        };
      }
    }

    // Helper function to calculate price with meat supplements
    const calculateItemPrice = (item: any): number => {
      const basePrice = MENU_PRICES[item.id];
      if (!basePrice) {
        throw new Error(`Invalid product ID: ${item.id}`);
      }

      // Check if item has meat option with supplement (Crevettes or Agneau)
      if (item.selectedOptions) {
        for (const optionValue of Object.values(item.selectedOptions)) {
          const val = optionValue as string;
          // Check if option contains "Crevettes" or "Agneau" (with or without price in parentheses)
          if (val.includes('Crevettes') || val.includes('Agneau')) {
            // Add 2.00€ supplement for Crevettes or Agneau
            return basePrice + 2.00;
          }
        }
      }

      return basePrice;
    };

    // Recalculer les prix côté serveur (IGNORER les prix du frontend)
    const lineItems = cartItems.map((item: any) => {
      console.log(`Checking item: ${item.id}, base price: ${MENU_PRICES[item.id]}`);
      const securePrice = calculateItemPrice(item);
      console.log(`Final price for ${item.id}: ${securePrice}€`);
      
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            description: item.selectedOptions 
              ? Object.entries(item.selectedOptions)
                  .map(([key, value]) => {
                    // Remove price from display in description
                    const val = value as string;
                    return `${key}: ${val.replace(/\(([\d.]+)€\)/, '').trim()}`;
                  })
                  .join(', ')
              : undefined,
          },
          unit_amount: Math.round(securePrice * 100), // Prix sécurisé en centimes
        },
        quantity: item.quantity,
      };
    });

    // Calculer le total côté serveur (avec suppléments si applicable)
    const serverCartTotal = cartItems.reduce((acc: number, item: any) => {
      const securePrice = calculateItemPrice(item);
      return acc + (securePrice * item.quantity);
    }, 0);

    // Ajouter les frais de livraison uniquement si delivery
    const serverDeliveryFee = (orderType === 'delivery' ? DELIVERY_FEE : 0);
    const serverTotalAmount = serverCartTotal + serverDeliveryFee;

    // Ajouter les frais de livraison aux line items uniquement si delivery
    if (serverDeliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Frais de livraison',
          },
          unit_amount: Math.round(DELIVERY_FEE * 100), // 2.50€ en centimes
        },
        quantity: 1,
      });
    }

    // Nettoyer les items pour les metadata (enlever les données inutiles pour respecter la limite de 500 caractères)
    // On garde uniquement : id, name, quantity, selectedOptions, price
    let cleanedItems = cartItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions || null,
      price: item.price || null, // On garde le prix pour le calcul dans le webhook
    }));

    let orderDataString = JSON.stringify(cleanedItems);
    console.log('OrderData length:', orderDataString.length);
    
    // Si c'est encore trop long (ce qui ne devrait normalement pas arriver), retirer le prix aussi
    if (orderDataString.length > 500) {
      console.warn('WARNING: OrderData still too long!', orderDataString.length, 'characters');
      console.warn('Reducing to minimal data (removing price)...');
      
      // Version minimale sans prix (le prix sera recalculé dans le webhook depuis MENU_PRICES)
      cleanedItems = cartItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions || null,
      }));
      
      orderDataString = JSON.stringify(cleanedItems);
      console.log('Minimal OrderData length:', orderDataString.length, 'characters');
      
      if (orderDataString.length > 500) {
        console.error('ERROR: OrderData STILL too long even with minimal data!', orderDataString.length);
        // En dernier recours, tronquer ou utiliser une autre méthode (mais ça ne devrait jamais arriver)
      }
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${event.headers.origin || 'https://tigre-du-bengale.netlify.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin || 'https://tigre-du-bengale.netlify.app'}/?canceled=true`,
      customer_email: customerInfo.email,
      metadata: {
        restaurantId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address || 'À emporter',
        orderData: JSON.stringify(cleanedItems), // Utiliser cleanedItems au lieu de cartItems
        orderType: orderType || 'delivery',
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
