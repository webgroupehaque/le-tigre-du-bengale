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
    const { cartItems, customerInfo, restaurantId } = JSON.parse(event.body);

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

    // Recalculer les prix côté serveur (IGNORER les prix du frontend)
    const lineItems = cartItems.map((item: any) => {
      console.log(`Checking item: ${item.id}, price found: ${MENU_PRICES[item.id]}`);
      const securePrice = MENU_PRICES[item.id];
      if (!securePrice) {
        console.error(`INVALID PRODUCT: ${item.id}`);
        console.error(`Available IDs:`, Object.keys(MENU_PRICES).slice(0, 10));
        throw new Error(`Invalid product ID: ${item.id}. Available IDs: ${Object.keys(MENU_PRICES).slice(0, 5).join(', ')}`);
      }
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            description: item.selectedOptions 
              ? Object.entries(item.selectedOptions)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')
              : undefined,
          },
          unit_amount: Math.round(securePrice * 100), // Prix sécurisé en centimes
        },
        quantity: item.quantity,
      };
    });

    // Calculer le total côté serveur
    const serverCartTotal = cartItems.reduce((acc: number, item: any) => {
      const securePrice = MENU_PRICES[item.id];
      return acc + (securePrice * item.quantity);
    }, 0);

    // Ajouter les frais de livraison
    const serverTotalAmount = serverCartTotal + DELIVERY_FEE;

    // Ajouter les frais de livraison aux line items
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
        customerAddress: customerInfo.address,
        orderData: JSON.stringify(cartItems),
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
