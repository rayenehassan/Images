import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY as string;
if (!key) {
  throw new Error('STRIPE_SECRET_KEY manquant dans les variables d\'environnement');
}

// Use a Stripe API version supported by the installed SDK types
export const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
