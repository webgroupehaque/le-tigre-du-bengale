import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const handler = async (event: any) => {
  console.log('=== WEBHOOK CALLED ===');
  
  // Vérifier les variables d'environnement
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'OK' : 'MISSING');
  console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'OK' : 'MISSING');
  console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'OK' : 'MISSING');

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return { statusCode: 500, body: 'Webhook secret not configured' };
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
    console.log('Webhook verified successfully');
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  console.log('Event type:', stripeEvent.type);

  // Traiter l'événement checkout.session.completed
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    console.log('Processing checkout.session.completed');
    console.log('Session ID:', session.id);

    try {
      const metadata = session.metadata!;
      console.log('Metadata:', metadata);
      
      const orderData = JSON.parse(metadata.orderData);
      console.log('Order data parsed:', orderData.length, 'items');

      // Initialiser Supabase
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
      console.log('Supabase client created');

      const orderToInsert = {
        restaurant_id: metadata.restaurantId,
        customer_name: metadata.customerName,
        customer_email: session.customer_email,
        customer_phone: metadata.customerPhone,
        customer_address: metadata.customerAddress,
        items: orderData,
        total_amount: (session.amount_total! / 100).toFixed(2),
        status: 'paid',
        stripe_payment_id: session.payment_intent as string,
      };

      console.log('Attempting to insert order:', JSON.stringify(orderToInsert, null, 2));

      // Insérer la commande dans Supabase
      const { data, error } = await supabase.from('orders').insert(orderToInsert);

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return { statusCode: 500, body: JSON.stringify({ error: 'Database error', details: error }) };
      }

      console.log('Order saved successfully:', data);
      return { statusCode: 200, body: 'Order saved' };
      
    } catch (err: any) {
      console.error('Error processing webhook:', err);
      console.error('Error stack:', err.stack);
      return { statusCode: 500, body: JSON.stringify({ error: err.message, stack: err.stack }) };
    }
  }

  console.log('Event type not handled:', stripeEvent.type);
  return { statusCode: 200, body: 'Event received' };
};
