import Replicate from 'replicate';

const token = process.env.REPLICATE_API_TOKEN as string;
if (!token) throw new Error('REPLICATE_API_TOKEN manquant dans les variables d’environnement');

export const replicate = new Replicate({ auth: token });

