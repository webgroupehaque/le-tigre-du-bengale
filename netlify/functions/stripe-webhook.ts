import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = async (event: any) => {
  console.log('=== WEBHOOK CALLED ===');
  
  // Vérifier les variables d'environnement
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'OK' : 'MISSING');
  console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'OK' : 'MISSING');
  console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'OK' : 'MISSING');
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'OK' : 'MISSING');
  console.log('RESTAURANT_EMAIL:', process.env.RESTAURANT_EMAIL || 'NOT SET (using default)');

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

      // Envoyer email au restaurateur
      try {
        const itemsList = orderData.map((item: any) => 
          `- ${item.name} x${item.quantity} (${(item.price * item.quantity).toFixed(2)}€)${
            item.selectedOptions 
              ? '\n  Options: ' + Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')
              : ''
          }`
        ).join('\n');

        const restaurantEmail = process.env.RESTAURANT_EMAIL || 'EMAIL_DU_RESTAURATEUR@example.com';

        const emailResult = await resend.emails.send({
          from: 'Tigre du Bengale <onboarding@resend.dev>', // Email par défaut de Resend
          to: [restaurantEmail],
          subject: `🔔 Nouvelle commande #${session.id.slice(-8)} - ${metadata.customerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ea580c;">🍛 Nouvelle commande reçue !</h2>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">👤 Informations client</h3>
                <p><strong>Nom :</strong> ${metadata.customerName}</p>
                <p><strong>Email :</strong> ${session.customer_email}</p>
                <p><strong>Téléphone :</strong> ${metadata.customerPhone}</p>
                <p><strong>Adresse :</strong> ${metadata.customerAddress}</p>
              </div>

              <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📦 Détails de la commande</h3>
                <pre style="white-space: pre-wrap; font-family: monospace; font-size: 14px;">${itemsList}</pre>
                <p style="font-size: 18px; font-weight: bold; color: #ea580c; margin-top: 20px;">
                  💰 Total : ${(session.amount_total! / 100).toFixed(2)}€
                </p>
              </div>

              <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #166534;">✅ Paiement confirmé via Stripe</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #166534;">ID: ${session.payment_intent}</p>
              </div>

              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                Cet email a été envoyé automatiquement depuis votre système de commande en ligne.
              </p>
            </div>
          `,
        });

        console.log('Email sent successfully:', emailResult);
      } catch (emailError: any) {
        console.error('Error sending email:', emailError);
        // On ne fait pas échouer le webhook si l'email échoue
      }

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
