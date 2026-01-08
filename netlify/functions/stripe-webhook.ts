import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Clé service pour bypass RLS
);

export const handler = async (event: any) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return { statusCode: 500, body: 'Webhook secret not configured' };
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Traiter l'événement checkout.session.completed
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;

    try {
      const metadata = session.metadata!;
      const orderData = JSON.parse(metadata.orderData);

      // Insérer la commande dans Supabase
      const { data, error } = await supabase.from('orders').insert({
        restaurant_id: metadata.restaurantId,
        customer_name: metadata.customerName,
        customer_email: session.customer_email,
        customer_phone: metadata.customerPhone,
        customer_address: metadata.customerAddress,
        items: orderData,
        total_amount: (session.amount_total! / 100).toFixed(2), // Convertir centimes en euros
        status: 'paid',
        stripe_payment_id: session.payment_intent as string,
      });

      if (error) {
        console.error('Supabase insert error:', error);
        return { statusCode: 500, body: 'Database error' };
      }

      console.log('Order saved successfully:', data);

      // TODO: Envoyer email au restaurateur (prochaine étape)

      return { statusCode: 200, body: 'Order saved' };
    } catch (err: any) {
      console.error('Error processing webhook:', err);
      return { statusCode: 500, body: err.message };
    }
  }

  return { statusCode: 200, body: 'Event received' };
};
