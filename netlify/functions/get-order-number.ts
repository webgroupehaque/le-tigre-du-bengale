import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const sessionId = event.queryStringParameters?.session_id;

    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing session_id' }),
      };
    }

    // Récupérer la session Stripe pour obtenir l'email du client
    let customerEmail: string | null = null;
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      customerEmail = session.customer_email;
      console.log('Stripe session retrieved, customer email:', customerEmail);
    } catch (stripeError: any) {
      console.error('Error retrieving Stripe session:', stripeError);
    }

    // Chercher d'abord par stripe_session_id si la colonne existe
    let { data, error } = await supabase
      .from('orders')
      .select('order_code')
      .eq('stripe_session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Si pas trouvé par session_id, chercher par email + date récente (dans les 10 dernières minutes)
    if (error || !data) {
      console.log('Order not found by session_id, trying by email and date');
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      let query = supabase
        .from('orders')
        .select('order_code')
        .gte('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      // Si on a l'email, filtrer par email aussi
      if (customerEmail) {
        query = query.eq('customer_email', customerEmail);
      }

      const result = await query.single();
      if (result.error) {
        error = result.error;
      } else {
        data = result.data;
        error = null;
      }
    }

    if (error || !data) {
      console.error('Error fetching order:', error);
      
      // Fallback : chercher simplement la commande la plus récente
      const { data: recentOrder } = await supabase
        .from('orders')
        .select('order_code')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentOrder && recentOrder.order_code) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ orderNumber: recentOrder.order_code }),
        };
      }

      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Order not found' }),
      };
    }

    // Retourner le code de commande à 4 chiffres
    if (data && data.order_code) {
      const orderNumber = data.order_code;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ orderNumber }),
      };
    }

    // Si order_code n'existe pas (anciennes commandes), retourner erreur
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Order code not found' }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
