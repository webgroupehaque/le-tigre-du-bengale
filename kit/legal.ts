import { text, type ContentValues } from './content';
import type { Restaurant, Settings } from './types';

/**
 * Textes des pages légales (mentions, confidentialité, conditions de vente),
 * générés depuis les réglages de l'app et les champs « Mentions légales » du
 * manifeste. Renvoie du CONTENU structuré (titres + paragraphes), jamais de
 * mise en forme : le site l'affiche dans son propre style.
 *
 * Une information manquante apparaît entre crochets « [à compléter : …] »
 * pour qu'on la repère avant la mise en ligne.
 * Modèles à faire relire : ce n'est pas un conseil juridique.
 */

export type LegalPage = { title: string; sections: { title: string; paragraphs: string[] }[] };
const need = (v: string, label: string) => (v && v.trim() ? v.trim() : `[à compléter : ${label}]`);

export function legalPages(r: Restaurant, s: Settings, c: ContentValues): { mentions: LegalPage; confidentialite: LegalPage; cgv: LegalPage } {
  const company = need(s.legalCompany || text(c, 'legal.company'), 'raison sociale');
  const forme = text(c, 'legal.form');
  const capital = text(c, 'legal.capital');
  const siret = need(s.legalSiret || text(c, 'legal.siret'), 'SIRET');
  const rcs = text(c, 'legal.rcs');
  const siege = need(text(c, 'legal.address') || s.address, 'adresse du siège');
  const publisher = need(s.legalPublisher || text(c, 'legal.publisher'), 'directeur de la publication');
  const email = need(s.email, 'e-mail de contact');
  const phone = s.phone || '';
  const host = text(c, 'legal.host') || 'Netlify, Inc. — 101 2nd Street, San Francisco, CA 94105, États-Unis — www.netlify.com';
  const mediator = text(c, 'legal.mediator');
  const name = r.name || company;
  const url = r.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  const mentions: LegalPage = {
    title: 'Mentions légales',
    sections: [
      { title: 'Éditeur du site', paragraphs: [
        `Le site ${url} est édité par ${company}${forme ? `, ${forme}` : ''}${capital ? ` au capital de ${capital}` : ''}, exploitant le restaurant ${name}.`,
        `Siège : ${siege}. SIRET : ${siret}${rcs ? `. RCS : ${rcs}` : ''}.`,
        `Contact : ${email}${phone ? ` · ${phone}` : ''}.`,
        `Directeur de la publication : ${publisher}.`,
      ] },
      { title: 'Hébergement', paragraphs: [`Le site est hébergé par ${host}.`] },
      { title: 'Conception', paragraphs: ['Site conçu et réalisé par Rekvo — rekvo.agency.'] },
      { title: 'Propriété intellectuelle', paragraphs: [`Les textes, photographies, logos et éléments graphiques de ce site sont la propriété de ${company} ou de leurs auteurs. Toute reproduction sans autorisation est interdite.`] },
    ],
  };

  const confidentialite: LegalPage = {
    title: 'Politique de confidentialité',
    sections: [
      { title: 'Responsable du traitement', paragraphs: [`${company}, ${siege}. Contact pour toute question sur vos données : ${email}.`] },
      { title: 'Données collectées et finalités', paragraphs: [
        'Commande en ligne : nom, e-mail, téléphone et, pour une livraison, adresse. Elles servent à préparer, livrer et vous confirmer la commande.',
        'Newsletter : votre adresse e-mail, uniquement si vous vous inscrivez, pour recevoir nos actualités. Chaque envoi permet de se désinscrire.',
        'Formulaire de contact : nom, e-mail et message, pour vous répondre.',
        'Le paiement est traité par Stripe : vos données de carte bancaire ne nous sont jamais transmises.',
      ] },
      { title: 'Durée de conservation', paragraphs: [
        'Données de commande : le temps nécessaire au traitement de la commande, puis la durée imposée par les obligations comptables (10 ans pour les pièces comptables).',
        'Newsletter : jusqu’à votre désinscription. Messages de contact : 3 ans au plus après le dernier échange.',
      ] },
      { title: 'Prestataires', paragraphs: ['Vos données sont hébergées et traitées par nos prestataires techniques : hébergement du site (Netlify), base de données (Supabase), paiement (Stripe), envoi des e-mails (Google). Elles ne sont ni vendues ni cédées.'] },
      { title: 'Vos droits', paragraphs: [`Vous pouvez accéder à vos données, les rectifier, les effacer, vous opposer à leur traitement ou en demander la portabilité en écrivant à ${email}. Vous pouvez aussi saisir la CNIL (www.cnil.fr).`] },
      { title: 'Cookies', paragraphs: ['Ce site n’utilise aucun cookie publicitaire ni outil de suivi. Seul votre panier est conservé dans votre navigateur pour que vous ne le perdiez pas : ce stockage est nécessaire au service et ne requiert pas de consentement.'] },
    ],
  };

  const cgv: LegalPage = {
    title: 'Conditions générales de vente',
    sections: [
      { title: 'Objet', paragraphs: [`Les présentes conditions régissent les commandes passées sur ${url} auprès de ${company} (restaurant ${name}).`] },
      { title: 'Produits et prix', paragraphs: ['Les plats sont décrits avec le plus grand soin. Les photos sont non contractuelles. Les prix sont indiqués en euros, toutes taxes comprises. Ils peuvent être modifiés à tout moment ; le prix appliqué est celui affiché au moment de la commande.', 'Les informations sur les allergènes sont disponibles sur la carte ou sur simple demande au restaurant.'] },
      { title: 'Commande et paiement', paragraphs: ['La commande est ferme après paiement en ligne par carte bancaire, via la plateforme sécurisée Stripe. Une confirmation est envoyée par e-mail.', `${s.minOrder > 0 ? `Le montant minimum de commande est de ${s.minOrder.toFixed(2).replace('.', ',')} €. ` : ''}Des codes promotionnels peuvent s’appliquer selon leurs conditions.`] },
      { title: 'Retrait et livraison', paragraphs: [
        'À emporter : la commande est à retirer au restaurant à l’heure indiquée.',
        s.deliveryEnabled
          ? `Livraison : dans les zones desservies${s.deliveryZips.length ? ` (codes postaux ${s.deliveryZips.join(', ')})` : ''}${s.deliveryFee ? `, frais de livraison de ${s.deliveryFee.toFixed(2).replace('.', ',')} €` : ''}${s.freeDeliveryOver != null ? `, offerts dès ${s.freeDeliveryOver.toFixed(2).replace('.', ',')} € d’achat` : ''}. Les délais annoncés sont indicatifs.`
          : 'La livraison n’est pas proposée pour le moment.',
      ] },
      { title: 'Droit de rétractation', paragraphs: ['Conformément à l’article L221-28 du Code de la consommation, le droit de rétractation ne s’applique pas aux denrées susceptibles de se détériorer ou de se périmer rapidement, ce qui est le cas des plats préparés.'] },
      { title: 'Réclamations', paragraphs: [`Pour toute réclamation, contactez le restaurant : ${email}${phone ? ` · ${phone}` : ''}.${mediator ? ` En cas de litige non résolu, vous pouvez recourir gratuitement au médiateur de la consommation : ${mediator}.` : ''}`] },
    ],
  };

  return { mentions, confidentialite, cgv };
}
