import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { MENU_PRICES } from './menu-prices';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export const handler = async (event: any) => {
  console.log('=== WEBHOOK CALLED ===');
  
  // Vérifier les variables d'environnement
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'OK' : 'MISSING');
  console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'OK' : 'MISSING');
  console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'OK' : 'MISSING');
  console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'OK' : 'MISSING');
  console.log('GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD ? 'OK' : 'MISSING');
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

      // Générer un code de commande à 4 chiffres aléatoire (1000 à 9999)
      const orderCode = Math.floor(1000 + Math.random() * 9000).toString();
      console.log('Generated order code:', orderCode);

      const orderToInsert: any = {
        restaurant_id: metadata.restaurantId,
        customer_name: metadata.customerName,
        customer_email: session.customer_email,
        customer_phone: metadata.customerPhone,
        customer_address: metadata.customerAddress,
        items: orderData,
        total_amount: (session.amount_total! / 100).toFixed(2),
        status: 'paid',
        stripe_payment_id: session.payment_intent as string,
        order_type: metadata.orderType || 'delivery',
        order_code: orderCode, // Code à 4 chiffres
      };

      // Stocker aussi le session_id si la colonne existe (pour faciliter la recherche)
      // Si la colonne n'existe pas, on utilisera l'email + date comme fallback
      if (session.id) {
        orderToInsert.stripe_session_id = session.id;
      }

      console.log('Attempting to insert order:', JSON.stringify(orderToInsert, null, 2));

      // Insérer la commande dans Supabase
      const { data, error } = await supabase.from('orders').insert(orderToInsert);

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return { statusCode: 500, body: JSON.stringify({ error: 'Database error', details: error }) };
      }

      console.log('Order saved successfully:', data);

      // Helper function to calculate price from MENU_PRICES and options
      // Same logic as calculateItemPrice in create-checkout-session.ts
      const getItemPriceFromOptions = (item: any): number => {
        // 1. Récupérer le prix de base depuis MENU_PRICES (source de vérité)
        const basePrice = MENU_PRICES[item.id];
        if (!basePrice) {
          console.warn(`Price not found in MENU_PRICES for item ${item.id}, using item.price or 0`);
          // Fallback: utiliser item.price si présent, sinon 0
          const fallbackPrice = item.price || 0;
          console.log(`Price calculation for ${item.name}:`, {
            basePrice: 'NOT FOUND',
            itemPrice: item.price,
            selectedOptions: item.selectedOptions,
            finalPrice: fallbackPrice
          });
          return fallbackPrice;
        }

        let finalPrice = basePrice;

        // 2. Vérifier les options sélectionnées
        if (item.selectedOptions) {
          for (const optionValue of Object.values(item.selectedOptions)) {
            const val = String(optionValue);
            
            // PRIORITÉ 1 : Extraire le prix formaté "(XX.XX€)" si présent (plus précis)
            const match = val.match(/\(([\d.]+)€\)/);
            if (match && match[1]) {
              finalPrice = parseFloat(match[1]);
              console.log(`Price calculation for ${item.name}:`, {
                basePrice: basePrice,
                itemPrice: item.price,
                selectedOptions: item.selectedOptions,
                extractedPrice: finalPrice,
                finalPrice: finalPrice
              });
              return finalPrice;
            }
            
            // PRIORITÉ 2 : Vérifier si l'option contient "Crevettes" ou "Agneau" (supplément +2€)
            // Seulement si aucun prix formaté n'a été trouvé
            if (val.includes('Crevettes') || val.includes('Agneau')) {
              finalPrice = basePrice + 2.00;
              console.log(`Price calculation for ${item.name}:`, {
                basePrice: basePrice,
                itemPrice: item.price,
                selectedOptions: item.selectedOptions,
                supplement: '+2.00€ for Crevettes/Agneau',
                finalPrice: finalPrice
              });
              return finalPrice;
            }
          }
        }

        console.log(`Price calculation for ${item.name}:`, {
          basePrice: basePrice,
          itemPrice: item.price,
          selectedOptions: item.selectedOptions || 'none',
          finalPrice: finalPrice
        });

        return finalPrice;
      };

      // Envoyer email au restaurateur
      try {
        const itemsList = orderData.map((item: any) => {
          const itemPrice = getItemPriceFromOptions(item);
          const optionsDisplay = item.selectedOptions 
            ? '\n  Options: ' + Object.entries(item.selectedOptions)
                .map(([k, v]) => {
                  // Remove price from display for cleaner look
                  const val = String(v);
                  return `${k}: ${val.replace(/\(([\d.]+)€\)/, '').trim()}`;
                })
                .join(', ')
            : '';
          return `- ${item.name} x${item.quantity} (${(itemPrice * item.quantity).toFixed(2)}€)${optionsDisplay}`;
        }).join('\n');

        const mailOptions = {
          from: `"Le Tigre du Bengale" <${process.env.GMAIL_USER}>`,
          to: process.env.RESTAURANT_EMAIL || 'le.tigre.du.bengale1@gmail.com',
          subject: `🔔 Nouvelle commande #${orderCode} - ${metadata.customerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ea580c;">🍛 Nouvelle commande reçue !</h2>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 24px;">
                  Code de commande : #${orderCode}
                </p>
              </div>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">👤 Informations client</h3>
                <p><strong>Nom :</strong> ${metadata.customerName}</p>
                <p><strong>Email :</strong> ${session.customer_email}</p>
                <p><strong>Téléphone :</strong> ${metadata.customerPhone}</p>
                <p><strong>Adresse :</strong> ${metadata.customerAddress}</p>
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 16px;">
                  ${metadata.orderType === 'delivery' ? '🚲 LIVRAISON' : '🏠 À EMPORTER'}
                </p>
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
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #166534;">ID paiement: ${session.payment_intent}</p>
              </div>

              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                Cet email a été envoyé automatiquement depuis votre système de commande en ligne.
              </p>
            </div>
          `,
        };

        const emailResult = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully via Gmail:', emailResult.messageId);
      } catch (emailError: any) {
        console.error('Error sending email:', emailError);
        // On ne fait pas échouer le webhook si l'email échoue
      }

      // Envoyer email de confirmation au client
      try {
        const clientItemsList = orderData.map((item: any) => {
          const itemPrice = getItemPriceFromOptions(item);
          const optionsDisplay = item.selectedOptions 
            ? '<br/><span style="font-size: 12px; color: #6b7280;">' + Object.entries(item.selectedOptions)
                .map(([k, v]) => {
                  // Remove price from display for cleaner look
                  const val = String(v);
                  return `${k}: ${val.replace(/\(([\d.]+)€\)/, '').trim()}`;
                })
                .join(', ') + '</span>'
            : '';
          return `<tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}${optionsDisplay}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">x${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${(itemPrice * item.quantity).toFixed(2)}€</td>
          </tr>`;
        }).join('');

        const clientMailOptions = {
          from: `"Le Tigre du Bengale" <${process.env.GMAIL_USER}>`,
          to: session.customer_email!,
          subject: `✅ Confirmation de votre commande #${orderCode} - Le Tigre du Bengale`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🍛 Le Tigre du Bengale</h1>
                <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 14px;">Restaurant Indien - Nancy</p>
              </div>

              <div style="padding: 30px;">
                <h2 style="color: #ea580c; margin-top: 0;">Merci pour votre commande !</h2>
                
                <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
                  <p style="margin: 0; color: #166534; font-weight: bold; font-size: 16px;">✅ Paiement confirmé</p>
                  <p style="margin: 5px 0 0 0; color: #166534; font-size: 14px;">Votre commande a bien été enregistrée et sera préparée dans les plus brefs délais.</p>
                </div>

                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #f59e0b;">
                  <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: normal;">Votre code de commande</p>
                  <p style="margin: 5px 0 0 0; font-weight: bold; color: #92400e; font-size: 32px; letter-spacing: 4px;">
                    #${orderCode}
                  </p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #92400e;">
                    ${metadata.orderType === 'delivery' ? 'Communiquez ce code au livreur' : 'Communiquez ce code au restaurant'}
                  </p>
                </div>

                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 18px;">
                    ${metadata.orderType === 'delivery' ? '🚲 LIVRAISON' : '🏠 À EMPORTER'}
                  </p>
                  ${metadata.orderType === 'pickup' ? '<p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">Votre commande sera prête dans 30-45 minutes</p>' : ''}
                </div>

                <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Détails de votre commande</h3>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead>
                    <tr style="background: #f9fafb;">
                      <th style="padding: 10px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase;">Article</th>
                      <th style="padding: 10px; text-align: center; color: #6b7280; font-size: 12px; text-transform: uppercase;">Qté</th>
                      <th style="padding: 10px; text-align: right; color: #6b7280; font-size: 12px; text-transform: uppercase;">Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${clientItemsList}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding: 15px 10px 5px 10px; text-align: right; font-weight: bold;">Sous-total :</td>
                      <td style="padding: 15px 10px 5px 10px; text-align: right;">${((session.amount_total! / 100) - (metadata.orderType === 'delivery' ? 2.50 : 0)).toFixed(2)}€</td>
                    </tr>
                    ${metadata.orderType === 'delivery' ? `
                    <tr>
                      <td colspan="2" style="padding: 5px 10px; text-align: right;">Frais de livraison :</td>
                      <td style="padding: 5px 10px; text-align: right;">2.50€</td>
                    </tr>
                    ` : ''}
                    <tr style="background: #f9fafb;">
                      <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; color: #ea580c;">Total :</td>
                      <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; color: #ea580c;">${(session.amount_total! / 100).toFixed(2)}€</td>
                    </tr>
                  </tfoot>
                </table>

                ${metadata.orderType === 'delivery' ? `
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #1f2937;">📍 Adresse de livraison</h4>
                  <p style="margin: 0; color: #4b5563;">${metadata.customerAddress}</p>
                </div>
                ` : `
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #1f2937;">📍 Adresse du restaurant</h4>
                  <p style="margin: 0; color: #4b5563;">19 Rue des Maréchaux<br/>54000 Nancy</p>
                </div>
                `}

                <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #3b82f6;">
                  <p style="margin: 0; color: #1e40af; font-size: 14px;">
                    <strong>📞 Besoin d'aide ?</strong><br/>
                    Contactez-nous au 03 83 22 88 31 ou répondez directement à cet email.
                  </p>
                </div>

                <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 40px;">
                  Merci de votre confiance !<br/>
                  L'équipe du Tigre du Bengale
                </p>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(clientMailOptions);
        console.log('Confirmation email sent to client:', session.customer_email);
      } catch (clientEmailError: any) {
        console.error('Error sending client email:', clientEmailError);
        // Ne pas faire échouer le webhook
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
