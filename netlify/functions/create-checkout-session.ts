import Stripe from 'stripe';

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
    const { cartItems, customerInfo, totalAmount, restaurantId } = JSON.parse(event.body);

    // Create line items for Stripe
    const lineItems = cartItems.map((item: any) => ({
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
        unit_amount: Math.round(item.price * 100), // Prix en centimes
      },
      quantity: item.quantity,
    }));

    // Add delivery fee if needed
    const cartTotal = cartItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    if (totalAmount > cartTotal) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Frais de livraison',
          },
          unit_amount: 250, // 2.50€ en centimes
        },
        quantity: 1,
      });
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
