import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!url) throw new Error('SUPABASE_URL manquant dans les variables d’environnement');
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant dans les variables d’environnement');

const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export default supabaseAdmin;

