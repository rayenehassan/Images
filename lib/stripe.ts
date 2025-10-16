import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY as string;
if (!key) {
  throw new Error('STRIPE_SECRET_KEY manquant dans les variables d\'environnement');
}

export const stripe = new Stripe(key, { apiVersion: '2024-06-20' });

